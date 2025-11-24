import { Op } from 'sequelize';
import { endOfDay, parseISO, startOfDay, subDays } from 'date-fns';
import upperFirst from 'lodash/upperFirst';

import {
  DIAGNOSIS_CERTAINTY,
  ENCOUNTER_TYPES,
  NOTE_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { ageInYears, format, toDateTimeString } from '@tamanu/utils/dateTime';
import { generateReportFromQueryData } from './utilities';

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
  { title: 'Admitting Clinician', accessor: data => data.examiner?.displayName },
  {
    title: 'Admission Date',
    accessor: data => format(data.startDate, 'dd/MM/yyyy h:mm:ss a'),
  },
  {
    title: 'Discharge Date',
    accessor: data => data.endDate && format(data.endDate, 'dd/MM/yyyy h:mm:ss a'),
  },
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

const getAllNotes = async (models, encounterIds) => {
  const locationChangeNotes = await models.Note.findAll({
    where: {
      content: {
        [Op.like]: '%Changed location from%',
      },
      recordId: encounterIds,
      noteType: NOTE_TYPES.SYSTEM,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    },
  });

  const departmentChangeNotes = await models.Note.findAll({
    where: {
      content: {
        [Op.like]: '%Changed department from%',
      },
      recordId: encounterIds,
      noteType: NOTE_TYPES.SYSTEM,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    },
  });

  return { locationChangeNotes, departmentChangeNotes };
};

// Note - hard to figure out departments with a ' to ' in them:
// Changed department from Department x to Department to be
// Could be: "Department x"/"Department to be" or "Department x to Department"/"be"
// Note format: • Changed location from 'X' to 'Y' (using curly quotes U+2018 and U+2019)
const locationExtractorPattern =
  /(?:^|\n)•\s*Changed location from ['\u2018](?<from>.*?)['\u2019] to ['\u2018](?<to>.*?)['\u2019]/;
const departmentExtractorPattern =
  /(?:^|\n)•\s*Changed department from ['\u2018](?<from>.*?)['\u2019] to ['\u2018](?<to>.*?)['\u2019]/;

const patternsForPlaceTypes = {
  department: departmentExtractorPattern,
  location: locationExtractorPattern,
};

const getPlaceHistoryFromNotes = (models, changeNotes, encounterData, placeType) => {
  const relevantNotes = changeNotes
    .filter(({ recordId }) => recordId === encounterData.id)
    .sort(({ date }) => date);

  if (!relevantNotes.length) {
    const { [placeType]: place, startDate } = encounterData;
    const placeName = models.Location.formatFullLocationName(place);
    return [{ to: placeName, date: startDate }];
  }

  const matcher = patternsForPlaceTypes[placeType];

  // Extract all matches from multi-line notes
  const extractMatches = content => {
    const matches = [];
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(matcher);
      if (match && match.groups) {
        matches.push(match.groups);
      }
    }
    return matches;
  };

  // Get the first "from" value from the earliest note
  const firstMatches = extractMatches(relevantNotes[0].content);
  const firstFrom = firstMatches.length > 0 ? firstMatches[0].from : null;

  if (!firstFrom) {
    // Fallback if regex doesn't match
    const { [placeType]: place, startDate } = encounterData;
    const placeName = models.Location.formatFullLocationName(place);
    return [{ to: placeName, date: startDate }];
  }

  const history = [
    {
      to: firstFrom,
      date: encounterData.startDate,
    },
    ...relevantNotes.flatMap(({ content, date }) => {
      const matches = extractMatches(content);
      return matches.map(({ to }) => ({ to, date }));
    }),
  ];

  return history;
};

const formatHistory = (history, placeType) => {
  const items = history.map(({ to, date }) => {
    return `${to} (${upperFirst(placeType)} assigned: ${format(date, 'dd/MM/yy h:mm a')})`;
  });
  return items.join('; ');
};

const filterResults = async (models, results, parameters) => {
  const { locationGroup, department } = parameters;

  const locations =
    locationGroup &&
    (await models.Location.findAll({
      where: {
        locationGroupId: locationGroup,
      },
    }));

  const { name: locationGroupName } = locationGroup
    ? await models.LocationGroup.findOne({
        where: {
          id: locationGroup,
        },
      })
    : {};

  const locationNames = locations?.map(({ name }) => name);

  const { name: requiredDepartment } = (await models.Department.findByPk(department)) ?? {};

  const locationFilteredResults = locationGroup
    ? results.filter(result =>
        result.locationHistory.some(({ to }) => {
          const { group, location } = models.Location.parseFullLocationName(to);
          return group ? group === locationGroupName : locationNames.includes(location);
        }),
      )
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
    locationHistory: getPlaceHistoryFromNotes(models, locationChangeNotes, result, 'location'),
    departmentHistory: getPlaceHistoryFromNotes(
      models,
      departmentChangeNotes,
      result,
      'department',
    ),
  }));

  const filteredResults = await filterResults(models, resultsWithHistory, parameters);

  return Promise.all(
    filteredResults.map(async result => {
      const locationHistoryString = formatHistory(result.locationHistory, 'location');
      return {
        ...result,
        locationHistoryString,
        departmentHistoryString: formatHistory(result.departmentHistory, 'department'),
        primaryDiagnoses: stringifyDiagnoses(result.diagnoses, true),
        secondaryDiagnoses: stringifyDiagnoses(result.diagnoses, false),
      };
    }),
  );
}

export async function dataGenerator({ models }, parameters) {
  const queryResults = await queryAdmissionsData(models, parameters);
  return generateReportFromQueryData(queryResults, reportColumnTemplate);
}
