import { Op } from 'sequelize';
import { subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { ENCOUNTER_TYPES, DIAGNOSIS_CERTAINTY, NOTE_TYPES } from 'shared/constants';
import upperFirst from 'lodash/upperFirst';
import { ageInYears } from 'shared/utils/dateTime';
import { generateReportFromQueryData } from './utilities';
import { toDateTimeString, format } from '../utils/dateTime';

const reportColumnTemplate = [
  { title: 'Patient First Name', accessor: data => data.patient.firstName },
  { title: 'Patient Last Name', accessor: data => data.patient.lastName },
  { title: 'Patient ID', accessor: data => data.patient.displayId },
  { title: 'Sex', accessor: data => data.patient.sex },
  { title: 'Village', accessor: data => data.patient.village.name },
  {
    title: 'Date of Birth',
    accessor: data => format(data.patient.dateOfBirth, 'dd/MM/yyyy'),
  },
  {
    title: 'Age',
    accessor: data => ageInYears(data.patient.dateOfBirth),
  },
  { title: 'Patient Type', accessor: data => data.patientBillingType?.name },
  { title: 'Admitting Doctor/Nurse', accessor: data => data.examiner?.displayName },
  {
    title: 'Admission Date',
    accessor: data => format(data.startDate, 'dd/MM/yyyy h:mm:ss a'),
  },
  {
    title: 'Discharge Date',
    accessor: data => data.endDate && format(data.endDate, 'dd/MM/yyyy h:mm:ss a'),
  },
  { title: 'Area', accessor: data => data.locationGroupName },
  { title: 'Location', accessor: data => data.locationHistoryString },
  { title: 'Department', accessor: data => data.departmentHistoryString },
  { title: 'Primary diagnoses', accessor: data => data.primaryDiagnoses },
  { title: 'Secondary diagnoses', accessor: data => data.secondaryDiagnoses },
];

function parametersToSqlWhere(parameters) {
  const {
    fromDate,
    toDate,
    practitioner,
    patientBillingType,
    // location, -- handled elsewhere
    // department, -- handled elsewhere
  } = parameters;

  const queryFromDate = toDateTimeString(
    startOfDay(fromDate ? parseISO(fromDate) : subDays(new Date(), 30)),
  );
  const queryToDate = toDate && toDateTimeString(endOfDay(parseISO(toDate)));

  return {
    encounterType: ENCOUNTER_TYPES.ADMISSION,
    ...(patientBillingType && { patientBillingTypeId: patientBillingType }),
    ...(practitioner && { examinerId: practitioner }),
    startDate: {
      [Op.gte]: queryFromDate,
      ...(queryToDate && { [Op.lte]: queryToDate }),
    },
  };
}

const stringifyDiagnoses = (diagnoses, shouldBePrimary) =>
  diagnoses
    .filter(({ isPrimary }) => isPrimary === shouldBePrimary)
    .map(({ Diagnosis }) => `${Diagnosis.code} ${Diagnosis.name}`)
    .join('; ');

const getLocationGroupName = location => location?.locationGroup?.name || 'Unknown';

const getAllNotes = async (models, encounterIds) => {
  const locationChangeNotePages = await models.NotePage.findAll({
    include: [
      {
        model: models.NoteItem,
        as: 'noteItems',
        where: {
          content: {
            [Op.like]: 'Changed location from%',
          },
        },
      },
    ],
    where: {
      recordId: encounterIds,
      noteType: NOTE_TYPES.SYSTEM,
    },
  });

  const departmentChangeNotePages = await models.NotePage.findAll({
    include: [
      {
        model: models.NoteItem,
        as: 'noteItems',
        where: {
          content: {
            [Op.like]: 'Changed department from%',
          },
        },
      },
    ],
    where: {
      recordId: encounterIds,
      noteType: NOTE_TYPES.SYSTEM,
    },
  });

  const locationChangeNotes = await Promise.all(
    locationChangeNotePages.map(l => l.getCombinedNoteObject(models)),
  );
  const departmentChangeNotes = await Promise.all(
    departmentChangeNotePages.map(d => d.getCombinedNoteObject(models)),
  );

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
    return [{ to: placeName, date: startDate }];
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

  return history;
};
const formatPlaceHistory = (history, placeType) =>
  history
    .map(
      ({ to, date }) =>
        `${to} (${upperFirst(placeType)} assigned: ${format(date, 'dd/MM/yy h:mm a')})`,
    )
    .join('; ');

const filterResults = async (models, results, parameters) => {
  const { locationGroup, department } = parameters;
  const locations =
    locationGroup &&
    (await models.Location.findAll({
      where: {
        locationGroupId: locationGroup,
      },
    }));
  const locationNames = locations?.map(({ name }) => name);

  const { name: requiredDepartment } = (await models.Department.findByPk(department)) ?? {};

  const locationFilteredResults = locationGroup
    ? results.filter(result => result.locationHistory.some(({ to }) => locationNames.includes(to)))
    : results;

  const departmentFilteredResults = requiredDepartment
    ? locationFilteredResults.filter(result =>
        result.departmentHistory.map(({ to }) => to).includes(requiredDepartment),
      )
    : locationFilteredResults;

  return departmentFilteredResults;
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
        'patientBillingType',
        {
          model: models.Location,
          as: 'location',
          include: ['locationGroup'],
        },
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

  const resultsWithHistory = results.map(result => ({
    ...result,
    locationHistory: getPlaceHistoryFromNotes(locationChangeNotes, result, 'location'),
    departmentHistory: getPlaceHistoryFromNotes(departmentChangeNotes, result, 'department'),
  }));

  const filteredResults = await filterResults(models, resultsWithHistory, parameters);

  return filteredResults.map(result => ({
    ...result,
    locationGroupName: getLocationGroupName(result.location),
    locationHistoryString: formatPlaceHistory(result.locationHistory, 'location'),
    departmentHistoryString: formatPlaceHistory(result.departmentHistory, 'department'),
    primaryDiagnoses: stringifyDiagnoses(result.diagnoses, true),
    secondaryDiagnoses: stringifyDiagnoses(result.diagnoses, false),
  }));
}

export async function dataGenerator({ models }, parameters) {
  const queryResults = await queryAdmissionsData(models, parameters);
  return generateReportFromQueryData(queryResults, reportColumnTemplate);
}

export const permission = 'Encounter';
