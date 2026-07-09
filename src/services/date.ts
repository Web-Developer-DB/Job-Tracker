const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const parseDateValue = (value?: string): Date | null => {
  if (!value) return null;

  const dateOnlyMatch = DATE_ONLY_PATTERN.exec(value);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    const date = new Date(year, month, day);

    if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
      return date;
    }

    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const toDateOnly = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const normalizeDateOnly = (value?: string): string | undefined => {
  const date = parseDateValue(value);
  return date ? toDateOnly(date) : undefined;
};

export const stripTime = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const formatDateDE = (value?: string): string => {
  const date = parseDateValue(value);
  return date ? date.toLocaleDateString('de-DE') : '';
};
