import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

export function signToken(user) {
  if (!SECRET) throw new Error("JWT_SECRET is not set in server/.env");
  return jwt.sign({ userId: user.id, name: user.name, email: user.email }, SECRET, {
    expiresIn: "7d",
  });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not logged in." });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Session expired, please log in again." });
  }
}
