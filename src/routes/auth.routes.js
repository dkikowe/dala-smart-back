import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import { requireFields } from "../utils/validation.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    requireFields(req.body, ["name", "phone", "password"]);

    if (String(req.body.password).length < 6) {
      const error = new Error("Password must be at least 6 characters");
      error.status = 422;
      throw error;
    }

    const user = await User.create({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      passwordHash: await User.hashPassword(req.body.password),
    });
    const token = signToken(user);

    res.status(201).json({ user: user.toSafeJSON(), token });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    requireFields(req.body, ["phone", "password"]);

    const user = await User.findOne({ phone: req.body.phone }).select(
      "+passwordHash",
    );
    const valid = user ? await user.comparePassword(req.body.password) : false;

    if (!valid) {
      const error = new Error("Invalid phone or password");
      error.status = 401;
      throw error;
    }

    res.json({ user: user.toSafeJSON(), token: signToken(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});
