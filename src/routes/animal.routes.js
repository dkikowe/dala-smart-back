import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Animal } from "../models/Animal.js";
import { requireFields } from "../utils/validation.js";

export const animalRouter = Router();

animalRouter.use(requireAuth);

animalRouter.post("/", async (req, res, next) => {
  try {
    requireFields(req.body, ["idCode", "chipCode"]);

    const animal = await Animal.create({
      ownerId: req.user._id,
      idCode: req.body.idCode,
      chipCode: req.body.chipCode,
      type: req.body.type,
      breed: req.body.breed,
      color: req.body.color,
      gender: req.body.gender,
      birthDate: req.body.birthDate,
      weightKg: req.body.weightKg,
      status: req.body.status,
    });

    res.status(201).json({ animal });
  } catch (error) {
    next(error);
  }
});

animalRouter.get("/", async (req, res, next) => {
  try {
    const animals = await Animal.find({ ownerId: req.user._id })
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
