// Safe numbers and punctuation remain intact; normalization trims only surrounding whitespace.
export const normalizePhone = (phone: string) => phone.trim();
