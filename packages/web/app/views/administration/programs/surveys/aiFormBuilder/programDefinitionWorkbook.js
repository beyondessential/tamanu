import * as XLSX from 'xlsx';

const SURVEY_SHEET_HEADERS = [
  'code',
  'type',
  'name',
  'text',
  'detail',
  'newScreen',
  'options',
  'optionLabels',
  'optionColors',
  'visibilityCriteria',
  'validationCriteria',
  'visualisationConfig',
  'optionSet',
  'questionLabel',
  'detailLabel',
  'calculation',
  'config',
  'visibilityStatus',
];

const stringifyField = value => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
};

const createSheetName = (name, fallback) => {
  const sheetName = (name || fallback).replace(/[:/\\?*[\]]/g, '').slice(0, 31);
  return sheetName || fallback;
};

const createMetadataSheet = programDefinition => ({
  name: 'Metadata',
  data: [
    ['programName', programDefinition.programName || programDefinition.title],
    ['programCode', programDefinition.programCode],
    ['country', programDefinition.country || ''],
    ['homeServer', programDefinition.homeServer || ''],
    [],
    [
      'code',
      'name',
      'surveyType',
      'targetLocationId',
      'targetDepartmentId',
      'status',
      'isSensitive',
      'visibilityStatus',
      'notifiable',
      'notifyEmailAddresses',
      'visibilityCriteria',
    ],
    ...programDefinition.surveys.map(survey => [
      survey.code,
      survey.name,
      survey.surveyType || 'programs',
      survey.targetLocationId || '',
      survey.targetDepartmentId || '',
      survey.status || 'draft',
      survey.isSensitive || false,
      survey.visibilityStatus || '',
      survey.notifiable || false,
      (survey.notifyEmailAddresses || []).join(','),
      stringifyField(survey.visibilityCriteria),
    ]),
  ],
});

const createSurveySheet = (survey, index) => ({
  name: createSheetName(survey.code, `Survey ${index + 1}`),
  data: [
    SURVEY_SHEET_HEADERS,
    ...survey.questions.map(question => [
      question.code,
      question.type,
      question.name || question.code,
      question.text,
      question.detail || '',
      question.newScreen ? 'yes' : '',
      stringifyField(question.options),
      stringifyField(question.optionLabels),
      stringifyField(question.optionColors),
      stringifyField(question.visibilityCriteria),
      stringifyField(question.validationCriteria),
      stringifyField(question.visualisationConfig),
      question.optionSet || '',
      question.questionLabel || '',
      question.detailLabel || '',
      stringifyField(question.calculation),
      stringifyField(question.config),
      question.visibilityStatus || '',
    ]),
  ],
});

export const createProgramDefinitionWorkbook = programDefinition => {
  const workbook = XLSX.utils.book_new();
  const sheets = [
    createMetadataSheet(programDefinition),
    ...programDefinition.surveys.map(createSurveySheet),
  ];

  for (const sheet of sheets) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet.data), sheet.name);
  }

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
};
