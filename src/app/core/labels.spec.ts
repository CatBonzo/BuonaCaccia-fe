import { AVAILABILITY_LABELS, CATEGORY_LABELS, SORT_OPTIONS, formatBytes, label } from './labels';

describe('etichette', () => {
  it('traducono i codici noti e lasciano intatti quelli sconosciuti', () => {
    expect(label(CATEGORY_LABELS, 'EG')).toBe('Esploratori e Guide');
    expect(label(AVAILABILITY_LABELS, 'LIMITED')).toBe('Ultimi posti');
    expect(label(CATEGORY_LABELS, 'NUOVA')).toBe('NUOVA');
    expect(label(CATEGORY_LABELS, undefined)).toBe('');
  });

  it('gli ordinamenti sono quelli accettati dal backend', () => {
    for (const option of SORT_OPTIONS) {
      expect(option.value).toMatch(/^(startDate|title|type),(asc|desc)$/);
    }
  });

  it('scrive le dimensioni dei file in modo leggibile', () => {
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(5242880)).toBe('5 MB');
    expect(formatBytes(512 * 1024)).toBe('512 KB');
    expect(formatBytes(undefined)).toBe('');
  });
});
