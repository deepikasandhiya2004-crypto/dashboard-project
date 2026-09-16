import { hasRole } from "../../lib/auth.js";

export default function RequireRole({ roles, children, fallback = null }) {
  if (!hasRole(...roles)) return fallback;
  return children;
}