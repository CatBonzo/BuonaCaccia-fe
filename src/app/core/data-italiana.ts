import { MAT_NATIVE_DATE_FORMATS, MatDateFormats, NativeDateAdapter } from '@angular/material/core';

/** Il calendario di Angular Material in italiano: si scrive e si legge `gg/mm/aaaa` e la settimana comincia di lunedi'. */
export class DataItalianaAdapter extends NativeDateAdapter {
  override getFirstDayOfWeek(): number {
    return 1;
  }

  override parse(value: unknown): Date | null {
    if (typeof value !== 'string') return super.parse(value);
    const text = value.trim();
    if (!text) return null;
    const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text);
    if (!m) return this.invalid();
    const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : this.invalid();
  }

  override format(date: Date, displayFormat: object): string {
    if ((displayFormat as unknown) === 'gg/mm/aaaa') {
      const two = (n: number) => String(n).padStart(2, '0');
      return `${two(date.getDate())}/${two(date.getMonth() + 1)}/${date.getFullYear()}`;
    }
    return super.format(date, displayFormat);
  }
}

export const FORMATI_DATA_ITALIANI: MatDateFormats = {
  parse: { dateInput: 'gg/mm/aaaa' },
  display: { ...MAT_NATIVE_DATE_FORMATS.display, dateInput: 'gg/mm/aaaa' },
};

/** "2027-03-10" (come lo vuole il backend) in una data del calendario, e viceversa; senza fusi orari di mezzo. */
export function isoToDate(iso: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

export function dateToIso(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return '';
  const two = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;
}
