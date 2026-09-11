export function parseExcelDate(val: unknown): string | null {
  if (val === null || val === undefined) return null;

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    let year: number;
    let month: string;
    let day: string;
    if (val.getUTCHours() === 0 && val.getUTCMinutes() === 0 && val.getUTCSeconds() === 0) {
      year = val.getUTCFullYear();
      month = String(val.getUTCMonth() + 1).padStart(2, "0");
      day = String(val.getUTCDate()).padStart(2, "0");
    } else {
      year = val.getFullYear();
      month = String(val.getMonth() + 1).padStart(2, "0");
      day = String(val.getDate()).padStart(2, "0");
    }
    return `${year}-${month}-${day}`;
  }

  if (typeof val === "number") {
    if (isNaN(val) || !isFinite(val) || val < 1 || val > 100000) return null;
    const utcDays = Math.floor(val - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const str = String(val).trim();
  if (!str) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const parts = str.split("-");
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) {
      return str;
    }
    return null;
  }

  const matchDmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (matchDmy) {
    const day = Number(matchDmy[1]);
    const month = Number(matchDmy[2]);
    const year = Number(matchDmy[3]);

    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    return null;
  }

  if (/^\d{4,5}(\.\d+)?$/.test(str)) {
    const num = Number(str);
    if (num >= 1 && num <= 100000) {
      const utcDays = Math.floor(num - 25569);
      const date = new Date(utcDays * 86400 * 1000);
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    if (year < 1900 || year > 2100) return null;
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return null;
}
