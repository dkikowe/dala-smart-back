import jwt from "jsonwebtoken";

function getSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }

  return secret;
}

export function signToken(user) {
  return jwt.sign(
    {
      phone: user.phone,
      role: user.role,
    },
    getSecret(),
    {
      subject: user._id.toString(),
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
}

export function verifyToken(token) {
  return jwt.verify(token, getSecret());
}
