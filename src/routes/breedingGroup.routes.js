import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { BreedingGroup } from "../models/BreedingGroup.js";

export const breedingGroupRouter = Router();

breedingGroupRouter.use(requireAuth);

// List saved groups, optionally filtered by animal type.
breedingGroupRouter.get("/", async (req, res, next) => {
  try {
    const query = { ownerId: req.user._id };
    if (req.query.type) {
      query.type = String(req.query.type);
    }

    const groups = await BreedingGroup.find(query).sort({ name: 1 });
    res.json({ groups, count: groups.length });
  } catch (error) {
    next(error);
  }
});

// Create or update a group (upsert by owner + type + name).
breedingGroupRouter.post("/", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const type = String(req.body.type || "").trim();
    const maleIdCodes = Array.isArray(req.body.maleIdCodes)
      ? req.body.maleIdCodes.map((code) => String(code).trim()).filter(Boolean)
      : [];

    if (!name || !type) {
      const error = new Error("Название и вид группы обязательны");
      error.status = 400;
      throw error;
    }

    const group = await BreedingGroup.findOneAndUpdate(
      { ownerId: req.user._id, type, name },
      { $set: { maleIdCodes } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.status(201).json({ group });
  } catch (error) {
    next(error);
  }
});
