// Client-safe helpers (no next/headers import)
import jwt from "jsonwebtoken";

export function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}
