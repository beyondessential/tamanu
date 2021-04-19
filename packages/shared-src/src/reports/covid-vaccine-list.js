import { Op } from 'sequelize';
import moment from 'moment';
import { generateReportFromQueryData } from './utilities';

const reportColumnTemplate = [
  {
    title: 'Patient Name',
    accessor: data => data.patientName,
  },
  { title: 'UID', accessor: data => data.uid },
  { title: 'DOB', accessor: data => data.dob },
  { title: 'Village', accessor: data => data.village },
  { title: 'First dose given', accessor: data => data.dose1 },
  { title: 'First dose date', accessor: data => data.dose1Date },
  { title: 'Second dose given', accessor: data => data.dose2 },
  { title: 'Second dose date', accessor: data => data.dose2Date },
  { title: 'Vaccine Name', accessor: data => data.vaccineLabel },
];

function parametersToSqlWhere(parameters) {
  if (!parameters.fromDate) {
    parameters.fromDate = moment()
      .subtract(30, 'days')
      .toISOString();
  }

  const whereClause = Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce(
      (where, [key, value]) => {
        switch (key) {
          case 'village':
            where['$encounter->patient.village_id$'] = value;
            break;
          case 'fromDate':
            if (!where.date) {
              where.date = {};
            }
            where.date[Op.gte] = value;
            break;
          case 'toDate':
            if (!where.date) {
              where.date = {};
            }
            where.date[Op.lte] = value;
            break;
          default:
            break;
        }
        return where;
      },
      {
        '$scheduledVaccine.label$': {
          [Op.in]: ['COVAX', 'COVID-19-AZ'],
        },
      },
    );

  return whereClause;
}

async function queryCovidVaccineListData(models, parameters) {
  const result = await models.AdministeredVaccine.findAll({
    include: [
      {
        model: models.Encounter,
        as: 'encounter',
        include: [
          {
            model: models.Patient,
            as: 'patient',
            include: [{ model: models.ReferenceData, as: 'village' }],
          },
        ],
      },
      {
        model: models.ScheduledVaccine,
        as: 'scheduledVaccine',
      },
    ],
    where: parametersToSqlWhere(parameters),
  });
  const administeredVaccines = result.map(r => r.get({ plain: true }));
  const patients = administeredVaccines.reduce(function(acc, vaccine) {
    if (!vaccine.encounter?.patientId) {
      return acc;
    }
    const {
      encounter: {
        patientId,
        patient: { displayId, firstName, lastName, dateOfBirth, village },
      },
      date,
      scheduledVaccine: { schedule, label },
    } = vaccine;
    if (!acc[patientId]) {
      acc[patientId] = {
        patientName: `${firstName} ${lastName}`,
        uid: displayId,
        dob: dateOfBirth.toLocaleDateString(),
        village: village?.name,
        dose1: 'No',
        dose2: 'No',
        vaccineLabel: label,
      };
    }
    if (schedule === 'Dose 1') {
      acc[patientId].dose1 = 'Yes';
      acc[patientId].dose1Date = date.toLocaleDateString();
    }
    if (schedule === 'Dose 2') {
      acc[patientId].dose2 = 'Yes';
      acc[patientId].dose2Date = date.toLocaleDateString();
    }
    return acc;
  }, {});
  return Object.values(patients);
}

export async function dataGenerator(models, parameters) {
  const queryResults = await queryCovidVaccineListData(models, parameters);
  return generateReportFromQueryData(queryResults, reportColumnTemplate);
}

export const permission = 'PatientVaccine';
