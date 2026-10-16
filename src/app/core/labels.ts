/** Etichette in italiano per i valori dell'API. I codici restano quelli del backend. */
export const CATEGORY_LABELS: Record<string, string> = {
  LC: 'Lupetti e Coccinelle',
  EG: 'Esploratori e Guide',
  RS: 'Rover e Scolte',
  LEADER_TRAINING: 'Formazione capi',
  ASSOCIATION: 'Associazione',
};

export const AVAILABILITY_LABELS: Record<string, string> = {
  NOT_YET_OPEN: 'Iscrizioni non ancora aperte',
  OPEN: 'Posti disponibili',
  LIMITED: 'Ultimi posti',
  HEAVY_OVERBOOKING: 'Posti esauriti, lista d’attesa lunga',
  CLOSED: 'Iscrizioni chiuse',
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bozza',
  PUBLISHED: 'Pubblicato',
  REGISTRATION_OPEN: 'Iscrizioni aperte',
  REGISTRATION_CLOSED: 'Iscrizioni chiuse',
  IN_PROGRESS: 'In corso',
  COMPLETED: 'Concluso',
  CANCELLED: 'Annullato',
};

export const LEVEL_LABELS: Record<string, string> = { NATIONAL: 'Nazionale', REGIONAL: 'Regionale', ZONE: 'Di zona' };

export const OBLIGATION_LABELS: Record<string, string> = {
  LEADER_VALIDATION: 'Validazione del capo',
  UNIT_LEADER_AUTHORIZATION: 'Autorizzazione del capo unità',
  GROUP_LEADER_AUTHORIZATION: 'Autorizzazione del capo gruppo',
  PAYMENT: 'Pagamento della quota',
  DOCUMENT: 'Documento da caricare',
  ELECTRONIC_FORM: 'Scheda da compilare',
};

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'startDate,asc', label: 'Data: prima i più vicini' },
  { value: 'startDate,desc', label: 'Data: prima i più lontani' },
  { value: 'title,asc', label: 'Titolo A-Z' },
];

export function label(map: Record<string, string>, key: string | undefined): string {
  return key ? (map[key] ?? key) : '';
}
