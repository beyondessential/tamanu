export const DRUG_ROUTES = {
  dermal: 'dermal',
  ear: 'ear',
  eye: 'eye',
  intramuscular: 'intramuscular',
  intravenous: 'intravenous',
  inhaled: 'inhaled',
  nasal: 'nasal',
  oral: 'oral',
  rectal: 'rectal',
  subcutaneous: 'subcutaneous',
  sublingual: 'sublingual',
  topical: 'topical',
  vaginal: 'vaginal',
};

export const DRUG_ROUTE_VALUES = Object.values(DRUG_ROUTES);

export const DRUG_ROUTE_LABELS = {
  [DRUG_ROUTES.dermal]: 'Dermal',
  [DRUG_ROUTES.ear]: 'Ear',
  [DRUG_ROUTES.eye]: 'Eye',
  [DRUG_ROUTES.intramuscular]: 'IM',
  [DRUG_ROUTES.intravenous]: 'IV',
  [DRUG_ROUTES.inhaled]: 'Inhaled',
  [DRUG_ROUTES.nasal]: 'Nasal',
  [DRUG_ROUTES.oral]: 'Oral',
  [DRUG_ROUTES.rectal]: 'Rectal',
  [DRUG_ROUTES.subcutaneous]: 'S/C',
  [DRUG_ROUTES.sublingual]: 'Sublingual',
  [DRUG_ROUTES.topical]: 'Topical',
  [DRUG_ROUTES.vaginal]: 'Vaginal',
};

const MAX_REPEATS = 12;
export const REPEATS_LABELS = Array.from({ length: MAX_REPEATS + 1 }, (_, i) => i);
