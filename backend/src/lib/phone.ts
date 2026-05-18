export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  let normalized = digits;
  if (normalized.startsWith('972') && normalized.length === 12) {
    normalized = '0' + normalized.slice(3);
  }
  if (/^05[0-9]{8}$/.test(normalized)) return normalized;
  return null;
}

export function maskPhone(phone: string): string {
  return phone.slice(0, 3) + '****' + phone.slice(7);
}
