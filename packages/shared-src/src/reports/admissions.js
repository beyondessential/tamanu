import { Op } from 'sequelize';
import { subDays, format } from 'date-fns';
import { ENCOUNTER_TYPES, DIAGNOSIS_CERTAINTY, NOTE_TYPES } from 'shared/constants';
import upperFirst from 'lodash/upperFirst';
import { generateReportFromQueryData } from './utilities';

const reportColumnTemplate = [
  { title: 'Patient First Name', accessor: data => data.patient.firstName },
  { title: 'Patient Last Name', accessor: data => data.patient.lastName },
  { title: 'Patient ID', accessor: data => data.patient.displayId },
  { title: 'Sex', accessor: data => data.patient.sex },
  { title: 'Village', accessor: data => data.patient.village.name },
  { title: 'Date of Birth', accessor: data => format(data.patient.dateOfBirth, 'dd/MM/yyyy') },
  { title: 'Admitting Doctor/Nurse', accessor: data => data.examiner?.displayName },
  { title: 'Admission Date', accessor: data => format(data.startDate, 'dd/MM/yyyy h:mm:ss a') },
  { title: 'Discharge Date', accessor: data => format(data.endDate, 'dd/MM/yyyy') },
  { title: 'Location', accessor: data => data.locationHistory },
  { title: 'Department', accessor: data => data.departmentHistory },
  { title: 'Primary diagnoses', accessor: data => data.primaryDiagnoses },
  { title: 'Secondary diagnoses', accessor: data => data.secondaryDiagnoses },
];

function parametersToSqlWhere(parameters) {
  const {
    fromDate = subDays(new Date(), 30).toISOString(),
    toDate,
    practitioner,
    location,
    department,
  } = parameters;

  return {
    encounterType: ENCOUNTER_TYPES.ADMISSION,
    ...(practitioner && { examinerId: practitioner }),
    ...(department && { departmentId: department }),
    ...(location && { locationId: location }),
    startDate: {
      [Op.gte]: fromDate,
      ...(toDate && { [Op.lte]: toDate }),
    },
  };
}

const stringifyDiagnoses = (diagnoses, shouldBePrimary) =>
  diagnoses
    .filter(({ isPrimary }) => isPrimary === shouldBePrimary)
    .map(({ Diagnosis }) => `${Diagnosis.code} ${Diagnosis.name}`)
    .join('; ');

const getAllNotes = async (models, encounterIds) => {
  const locationChangeNotes = await models.Note.findAll({
    where: {
      recordId: encounterIds,
      noteType: NOTE_TYPES.SYSTEM,
      content: {
        [Op.like]: 'Changed location from%',
      },
    },
  });
  const departmentChangeNotes = await models.Note.findAll({
    where: {
      recordId: encounterIds,
      noteType: NOTE_TYPES.SYSTEM,
      content: {
        [Op.like]: 'Changed department from%',
      },
    },
  });
  return { locationChangeNotes, departmentChangeNotes };
};

// Note - hard to figure out departments with a ' to ' in them:
// Changed department from Department x to Department to be
// Could be: "Department x"/"Department to be" or "Department x to Department"/"be"
const locationExtractorPattern = /^Changed location from (?<from>.*) to (?<to>.*)/;
const departmentExtractorPattern = /^Changed department from (?<from>.*) to (?<to>.*)/;

const patternsForPlaceTypes = {
  department: departmentExtractorPattern,
  location: locationExtractorPattern,
};

const getPlaceHistoryFromNotes = (changeNotes, encounterData, placeType) => {
  const relevantNotes = changeNotes
    .filter(({ recordId }) => recordId === encounterData.id)
    .sort(({ date }) => date);

  if (!relevantNotes.length) {
    const { [placeType]: place, startDate } = encounterData;
    const { name: placeName } = place;
    return `${placeName} (${upperFirst(placeType)} change: ${format(
      startDate,
      'dd/MM/yy h:mm a',
    )})`;
  }

  const matcher = patternsForPlaceTypes[placeType];
  const {
    groups: { from },
  } = relevantNotes[0].content.match(matcher);

  const history = [
    {
      to: from,
      date: encounterData.startDate,
    },
    ...relevantNotes.map(({ content, date }) => {
      const {
        groups: { to },
      } = content.match(matcher);
      return { to, date };
    }),
  ];

  return history
    .map(
      ({ to, date }) =>
        `${to} (${upperFirst(placeType)} change: ${format(date, 'dd/MM/yy h:mm a')})`,
    )
    .join('; ');
};

async function queryAdmissionsData(models, parameters) {
  const results = (
    await models.Encounter.findAll({
      include: [
        {
          model: models.Patient,
          as: 'patient',
          include: ['village'],
        },
        'examiner',
        'location',
        'department',
        {
          model: models.EncounterDiagnosis,
          as: 'diagnoses',
          required: false,
          where: {
            certainty: DIAGNOSIS_CERTAINTY.CONFIRMED,
          },
          include: ['Diagnosis'],
        },
      ],
      where: parametersToSqlWhere(parameters),
    })
  ).map(x => x.get({ plain: true }));

  const encounterIds = results.map(({ id }) => id);
  const { locationChangeNotes, departmentChangeNotes } = await getAllNotes(models, encounterIds);

  return results.map(result => ({
    ...result,
    locationHistory: getPlaceHistoryFromNotes(locationChangeNotes, result, 'location'),
    departmentHistory: getPlaceHistoryFromNotes(departmentChangeNotes, result, 'department'),
    primaryDiagnoses: stringifyDiagnoses(result.diagnoses, true),
    secondaryDiagnoses: stringifyDiagnoses(result.diagnoses, false),
  }));
}

export async function dataGenerator({ models }, parameters) {
  const queryResults = await queryAdmissionsData(models, parameters);
  return generateReportFromQueryData(queryResults, reportColumnTemplate);
}

export const permission = 'Encounter';
