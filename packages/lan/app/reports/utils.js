export const formatPatientInfo = p => ({
  name: [p.firstName, p.culturalName, p.lastName].filter(x => x).join(' '),
  village: p.village && p.village.name,
  id: p.displayId,
});
