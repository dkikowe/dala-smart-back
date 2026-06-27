import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { Animal } from "../models/Animal.js";
import { BreedingGroup } from "../models/BreedingGroup.js";
import { requireFields } from "../utils/validation.js";
import { uploadImage } from "../utils/s3.js";

// Store uploaded files in memory so sharp can process them before S3.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB raw max
  fileFilter(_req, file, cb) {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(Object.assign(new Error("Только изображения"), { status: 422 }));
  },
});

export const animalRouter = Router();

animalRouter.use(requireAuth);

animalRouter.get("/check-chip", async (req, res, next) => {
  try {
    const chipCode = String(req.query.chipCode || "").trim();
    if (!chipCode) {
      return res.json({ exists: false, animal: null });
    }

    const animal = await Animal.findOne({
      ownerId: req.user._id,
      chipCode,
    }).select("_id idCode chipCode type breed lifecycleStatus");

    res.json({
      exists: Boolean(animal),
      animal: animal
        ? {
            id: animal._id.toString(),
            idCode: animal.idCode,
            chipCode: animal.chipCode,
            type: animal.type,
            breed: animal.breed,
            lifecycleStatus: animal.lifecycleStatus,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
});

animalRouter.post("/", async (req, res, next) => {
  try {
    requireFields(req.body, ["idCode", "chipCode"]);

    const breedingMaleIdCodes = Array.isArray(req.body.breedingMaleIdCodes)
      ? req.body.breedingMaleIdCodes
      : [];
    const breedingGroupName = String(req.body.breedingGroupName || "").trim();

    const animal = await Animal.create({
      ownerId: req.user._id,
      idCode: req.body.idCode,
      chipCode: req.body.chipCode,
      type: req.body.type,
      breed: req.body.breed,
      color: req.body.color,
      gender: req.body.gender,
      motherIdCode: req.body.motherIdCode,
      fatherIdCode: req.body.fatherIdCode,
      breedingGroup: req.body.breedingGroup,
      breedingGroupName: req.body.breedingGroupName,
      breedingMaleIdCodes,
      ageGroup: req.body.ageGroup,
      birthDate: req.body.birthDate,
      weightKg: req.body.weightKg,
      status: req.body.status,
    });

    // Remember the breeding group so its sires auto-fill next time.
    if (breedingGroupName && req.body.type) {
      await BreedingGroup.findOneAndUpdate(
        { ownerId: req.user._id, type: req.body.type, name: breedingGroupName },
        { $set: { maleIdCodes: breedingMaleIdCodes } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    res.status(201).json({ animal });
  } catch (error) {
    next(error);
  }
});

animalRouter.get("/", async (req, res, next) => {
  try {
    const query = { ownerId: req.user._id };
    if (req.query.includeArchived !== "true") {
      query.$or = [
        { lifecycleStatus: "on_farm" },
        { lifecycleStatus: { $exists: false } },
        { lifecycleStatus: "" },
        { lifecycleStatus: null },
      ];
    }

    const animals = await Animal.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ animals, count: animals.length });
  } catch (error) {
    next(error);
  }
});

animalRouter.get("/:id", async (req, res, next) => {
  try {
    const animal = await Animal.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });

    if (!animal) {
      const error = new Error("Animal not found");
      error.status = 404;
      throw error;
    }

    res.json({ animal });
  } catch (error) {
    next(error);
  }
});

animalRouter.patch("/:id/disposition", async (req, res, next) => {
  try {
    const allowedStatuses = [
      "transferred",
      "dead",
      "sold_alive",
      "slaughtered",
      "archived",
    ];
    const { lifecycleStatus, departureReason, departureComment, newOwner } =
      req.body;

    if (!allowedStatuses.includes(lifecycleStatus)) {
      const error = new Error("Invalid animal disposition");
      error.status = 422;
      throw error;
    }

    if (lifecycleStatus === "dead" && !departureReason?.trim()) {
      const error = new Error("Причина смерти обязательна");
      error.status = 422;
      throw error;
    }

    const animal = await Animal.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      {
        lifecycleStatus,
        departureReason: departureReason?.trim() || "",
        departureComment: departureComment?.trim() || "",
        newOwner: newOwner?.trim() || "",
        departureDate: new Date(),
      },
      { new: true },
    );

    if (!animal) {
      const error = new Error("Animal not found");
      error.status = 404;
      throw error;
    }

    res.json({ animal });
  } catch (error) {
    next(error);
  }
});

animalRouter.delete("/:id", async (req, res, next) => {
  try {
    const animal = await Animal.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      {
        lifecycleStatus: "archived",
        departureReason: req.body.reason?.trim() || "Удалено из реестра",
        departureDate: new Date(),
      },
      { new: true },
    );

    if (!animal) {
      const error = new Error("Animal not found");
      error.status = 404;
      throw error;
    }

    res.json({ animal });
  } catch (error) {
    next(error);
  }
});

// Add a health record (vaccination or treatment).
animalRouter.post("/:id/health-records", async (req, res, next) => {
  try {
    const kind = req.body.kind;
    const title = String(req.body.title || "").trim();

    if (!["vaccination", "treatment"].includes(kind)) {
      const error = new Error("Неизвестный тип записи");
      error.status = 422;
      throw error;
    }
    if (!title) {
      const error = new Error("Укажите название записи");
      error.status = 422;
      throw error;
    }

    const animal = await Animal.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });

    if (!animal) {
      const error = new Error("Animal not found");
      error.status = 404;
      throw error;
    }

    animal.healthRecords.push({
      kind,
      title,
      note: String(req.body.note || "").trim(),
      date: req.body.date ? new Date(req.body.date) : new Date(),
    });
    await animal.save();

    res.status(201).json({ animal });
  } catch (error) {
    next(error);
  }
});

// Update a health record.
animalRouter.patch("/:id/health-records/:recordId", async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    if (!title) {
      const error = new Error("Укажите название записи");
      error.status = 422;
      throw error;
    }

    const animal = await Animal.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });

    if (!animal) {
      const error = new Error("Animal not found");
      error.status = 404;
      throw error;
    }

    const record = animal.healthRecords.id(req.params.recordId);
    if (!record) {
      const error = new Error("Record not found");
      error.status = 404;
      throw error;
    }

    record.title = title;
    record.note = String(req.body.note || "").trim();
    if (req.body.date) record.date = new Date(req.body.date);

    await animal.save();
    res.json({ animal });
  } catch (error) {
    next(error);
  }
});

// Remove a health record.
animalRouter.delete("/:id/health-records/:recordId", async (req, res, next) => {
  try {
    const animal = await Animal.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });

    if (!animal) {
      const error = new Error("Animal not found");
      error.status = 404;
      throw error;
    }

    animal.healthRecords.pull({ _id: req.params.recordId });
    await animal.save();

    res.json({ animal });
  } catch (error) {
    next(error);
  }
});

// Upload / replace animal photo.
// POST /api/animals/:id/photo  (multipart/form-data, field "photo")
animalRouter.post(
  "/:id/photo",
  upload.single("photo"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        const error = new Error("Файл не выбран");
        error.status = 422;
        throw error;
      }

      const animal = await Animal.findOne({
        _id: req.params.id,
        ownerId: req.user._id,
      });

      if (!animal) {
        const error = new Error("Animal not found");
        error.status = 404;
        throw error;
      }

      // Build a unique, predictable S3 key.
      const key = `animals/${req.user._id}/${animal._id}_${Date.now()}.jpg`;

      // Compress (max 1200px, JPEG 82%) and upload to S3.
      const photoUrl = await uploadImage(req.file.buffer, key, req.file.mimetype);

      animal.photoUrl = photoUrl;
      await animal.save();

      res.json({ animal });
    } catch (error) {
      next(error);
    }
  },
);
