/**
 * Escape user-provided text before using it in a MongoDB regular expression.
 * This keeps search terms literal and prevents regex injection.
 */
export function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
