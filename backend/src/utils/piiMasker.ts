/**
 * PII Masking Utility
 * Anonymizes Indian Aadhaar numbers, phone numbers, email addresses, and potential direct identifiers
 * before sending data to external AI models or public audit streams.
 */

export function maskPII(text: string): { maskedText: string; redactedItemsCount: number } {
  if (!text) return { maskedText: "", redactedItemsCount: 0 };

  let count = 0;
  let masked = text;

  // 1. Aadhaar Number (12 digits with or without spaces/hyphens: \b\d{4}[ -]?\d{4}[ -]?\d{4}\b)
  const aadhaarRegex = /\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g;
  masked = masked.replace(aadhaarRegex, (match) => {
    count++;
    return `[AADHAAR:XXXX-XXXX-${match.slice(-4)}]`;
  });

  // 2. Indian Phone numbers (10 digits starting with 6-9, optional +91 or 0)
  const phoneRegex = /(?:\+91[\s-]?)?[6-9]\d{9}\b/g;
  masked = masked.replace(phoneRegex, (match) => {
    count++;
    return `[PHONE:XXXXXX${match.slice(-4)}]`;
  });

  // 3. Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
  masked = masked.replace(emailRegex, () => {
    count++;
    return `[EMAIL_REDACTED]`;
  });

  return { maskedText: masked, redactedItemsCount: count };
}
