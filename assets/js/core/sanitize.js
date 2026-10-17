/**
 * Tvzinha Online - HTML & Attribute Sanitizer (D4)
 * Protects DOM insertions against Cross-Site Scripting (XSS).
 */

const HTML_ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const HTML_ESCAPE_REGEX = /[&<>"']/g;

/**
 * Escapes characters that have special meaning in HTML contexts.
 * Safe for text content and attributes surrounded by quotes.
 *
 * @param {any} value - Value to escape
 * @returns {string} Escaped HTML-safe string
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char]);
}

/**
 * Escapes values destined for HTML attributes.
 *
 * @param {any} value - Value to escape
 * @returns {string} Escaped attribute-safe string
 */
export function escapeAttr(value) {
  return escapeHtml(value);
}
