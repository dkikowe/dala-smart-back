import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Farm } from "../models/Farm.js";
import { Animal } from "../models/Animal.js";

export const farmRouter = Router();

farmRouter.use(requireAuth);

// Get my farm (returns null if not created yet)
farmRouter.get("/my", async (req, res, next) => {
  try {
    const farm = await Farm.findOne({ ownerId: req.user._id });
    const count = await Animal.countDocuments({
      ownerId: req.user._id,
      $or: [
        { lifecycleStatus: "on_farm" },
        { lifecycleStatus: { $exists: false } },
        { lifecycleStatus: "" },
        { lifecycleStatus: null },
      ],
    });
    res.json({ farm: farm ? farm.toJSON() : null, animalCount: count });
  } catch (error) {
    next(error);
  }
});

// Create or update farm
farmRouter.post("/", async (req, res, next) => {
  try {
    const { name, location, imageUrl } = req.body;
    if (!name || !name.trim()) {
      const err = new Error("Название фермы обязательно");
      err.status = 400;
      throw err;
    }

    const farm = await Farm.findOneAndUpdate(
      { ownerId: req.user._id },
      { name: name.trim(), location: location?.trim() || "", imageUrl: imageUrl?.trim() || "" },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.status(201).json({ farm });
  } catch (error) {
    next(error);
  }
});
