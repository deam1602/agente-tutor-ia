export type UserRole = 'student' | 'admin' | 'superUser';

export function normalizeCarnet(carnet: string): string {
  return carnet.trim().toUpperCase();
}

export function validateCarnet(carnet: string): boolean {
  const normalized = normalizeCarnet(carnet);
  return /^(EST|CAT|SUP)\d{7}$/.test(normalized);
}

export function getRoleFromCarnet(carnet: string): UserRole | null {
  const normalized = normalizeCarnet(carnet);

  if (!validateCarnet(normalized)) return null;

  if (normalized.startsWith('EST')) return 'student';
  if (normalized.startsWith('CAT')) return 'admin';
  if (normalized.startsWith('SUP')) return 'superUser';

  return null;
}

export function validateInstitutionalEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return /^[A-Za-z0-9._%+-]+@(correo\.url\.edu\.gt|url\.edu\.gt)$/.test(normalized);
}