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

export const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  REGISTERED: 'Iscritto, da completare',
  COMPLETED: 'Iscrizione completa',
  EXPIRED: 'Scaduta',
  WITHDRAWN: 'Ritirata',
  REJECTED: 'Rifiutata',
  CANCELLED: 'Annullata',
};

export const OBLIGATION_STATUS_LABELS: Record<string, string> = {
  TODO: 'Da fare',
  IN_REVIEW: 'In verifica',
  SATISFIED: 'Fatto',
  REJECTED: 'Rifiutato',
  NOT_REQUIRED: 'Non richiesto',
};

export const CLOSING_REASON_LABELS: Record<string, string> = {
  WITHDRAWN: 'Ritirata da te',
  EXPIRED: 'Scaduta perché gli adempimenti non sono stati completati in tempo',
  REJECTED: 'Rifiutata dalla segreteria',
  EVENT_CANCELLED: 'Evento annullato',
  SEATS_EXHAUSTED: 'Posti esauriti',
};

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  UPLOADED: 'Caricato, in attesa di verifica',
  VALIDATED: 'Approvato',
  REJECTED: 'Rifiutato: caricane un altro',
  REPLACED: 'Sostituito',
};

export const FORM_STATUS_LABELS: Record<string, string> = { DRAFT: 'Bozza', SUBMITTED: 'Inviata' };

export function formatBytes(bytes: number | undefined): string {
  if (!bytes) return '';
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(bytes % 1048576 ? 1 : 0)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export const REFUND_STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Da lavorare',
  IN_PROGRESS: 'In lavorazione',
  ISSUED: 'Emesso',
  REJECTED: 'Rifiutato',
};

export const BRANCH_LABELS: Record<string, string> = { LC: 'Lupetti e coccinelle', EG: 'Esploratori e guide', RS: 'Rover e scolte', CO: 'Comunità capi' };
export const MEMBER_TYPE_LABELS: Record<string, string> = { YOUTH: 'Ragazzi', LEADER: 'Capi' };
export const QUESTION_TYPE_LABELS: Record<string, string> = {
  TEXT: 'Testo breve', LONG_TEXT: 'Testo lungo', YES_NO: 'Sì o no', CHOICE: 'Scelta tra opzioni', DATE: 'Data',
};
export const DELIVERY_LABELS: Record<string, string> = { ONLINE: 'Online', PAPER: 'Cartaceo' };
export const LEADER_ACTIONS: Record<string, { type: 'UNIT_LEADER_AUTHORIZATION' | 'GROUP_LEADER_AUTHORIZATION'; approve: boolean }> = {
  APPROVE_UNIT_LEADER: { type: 'UNIT_LEADER_AUTHORIZATION', approve: true },
  REJECT_UNIT_LEADER: { type: 'UNIT_LEADER_AUTHORIZATION', approve: false },
  APPROVE_GROUP_LEADER: { type: 'GROUP_LEADER_AUTHORIZATION', approve: true },
  REJECT_GROUP_LEADER: { type: 'GROUP_LEADER_AUTHORIZATION', approve: false },
};
