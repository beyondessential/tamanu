const COVID_TEST_NORMAL = {
  code: '96119-3',
  display: 'SARS-CoV-2 (COVID-19) Ag [Presence] in Upper respiratory specimen by Immunoassay',
};

const COVID_TEST_RAPID = {
  code: '97097-0',
  display: 'SARS-CoV-2 (COVID-19) Ag [Presence] in Upper respiratory specimen by Rapid immunoassay',
};

const UNKNOWN = {
  code: 'Unknown',
  display: 'Unknown',
};

const labTestTypeNameToLOINC = {
  'COVID-19 Swab': COVID_TEST_NORMAL,
  'COVID-19 Nasopharyngeal Swab': COVID_TEST_NORMAL,
  'COVID-19 Nasal Swab': COVID_TEST_NORMAL,
  'COVID-19 Oropharyngeal Swab': COVID_TEST_NORMAL,
  'COVID-19 Endotracheal aspirate': COVID_TEST_NORMAL,
  'AgRDT Negative, no further testing needed': COVID_TEST_RAPID,
  'AgRDT Positive': COVID_TEST_RAPID,
};

export function labTestTypeToLOINCCode(labTestType) {
  const coding = labTestTypeNameToLOINC[labTestType.name] || UNKNOWN;

  return {
    text: coding.display,
    coding: [
      {
        system: 'http://loinc.org',
        ...coding,
      },
    ],
  };
}
