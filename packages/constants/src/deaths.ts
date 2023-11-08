export const MANNER_OF_DEATHS = [
  'Disease',
  'Assault',
  'Accident',
  'Legal Intervention',
  'Pending Investigation',
  'Intentional Self Harm',
  'War',
  'Unknown/Could not be determined',
];

export const MANNER_OF_DEATH_OPTIONS = Object.values(MANNER_OF_DEATHS).map(
  (type) => ({
    label: type,
    value: type,
  }),
);
