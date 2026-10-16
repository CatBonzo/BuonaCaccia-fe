import { AVAILABILITY_LABELS, CATEGORY_LABELS, SORT_OPTIONS, label } from './labels';

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
});
