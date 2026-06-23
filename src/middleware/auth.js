import { User } from "../models/User.js";
import { verifyToken } from "../utils/jwt.js";

export async function requireAuth(req, _res, next) {
  try {
    const header = req.get("authorization") || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      const error = new Error("Authorization token is required");
      error.status = 401;
      throw error;
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      const error = new Error("User not found");
      error.status = 401;
      throw error;
    }

    req.user = user;
    next();
  } catch (error) {
    error.status = error.status || 401;
    next(error);
  }
}
