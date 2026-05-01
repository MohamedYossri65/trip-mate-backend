const SAUDI_COUNTRY_CODE = '966';

function compactPhone(phone: string): string {
  return phone.trim().replace(/[\s\-()]/g, '');
}

export function normalizeSaudiPhone(phone: string): string {
  const compact = compactPhone(phone);

  if (!compact) {
    return compact;
  }

  const withoutPlus = compact.startsWith('+') ? compact.slice(1) : compact;

  if (withoutPlus.startsWith('00')) {
    return normalizeSaudiPhone(withoutPlus.slice(2));
  }

  if (withoutPlus.startsWith(SAUDI_COUNTRY_CODE)) {
    return `${withoutPlus}`;
  }

  if (withoutPlus.startsWith('0')) {
    return `${SAUDI_COUNTRY_CODE}${withoutPlus.slice(1)}`;
  }

  return `${SAUDI_COUNTRY_CODE}${withoutPlus}`;
}

export function toSaudiLocalPhone(phone: string): string {
  const normalized = normalizeSaudiPhone(phone);
  const digitsOnly = normalized.replace(/\D/g, '');

  if (digitsOnly.startsWith(SAUDI_COUNTRY_CODE)) {
    return `0${digitsOnly.slice(SAUDI_COUNTRY_CODE.length)}`;
  }

  return digitsOnly;
}

export function getSaudiPhoneVariants(phone: string): string[] {
  const compact = compactPhone(phone);
  const normalized = normalizeSaudiPhone(compact);
  const local = toSaudiLocalPhone(compact);

  return Array.from(new Set([compact, normalized, local].filter(Boolean)));
}