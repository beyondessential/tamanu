/* eslint-disable no-param-reassign */

import { endOfDay, parseISO, startOfDay } from 'date-fns';
import { Op } from 'sequelize';
import { toDateTimeString } from '../utils/dateTime';
import { generateReportFromQueryData } from './utilities';

const reportColumnTemplate = [
  {
    title: 'Patient First Name',
    accessor: referral => referral.initiatingEncounter.patient.firstName,
  },
  {
    title: 'Patient Last Name',
    accessor: referral => referral.initiatingEncounter.patient.lastName,
  },
  {
    title: 'National Health Number',
    accessor: referral => referral.initiatingEncounter.patient.displayId,
  },
  {
    title: 'Diagnoses',
    accessor: referral => {
      if (referral.initiatingEncounter.diagnoses && referral.initiatingEncounter.diagnoses.length) {
        return referral.initiatingEncounter.diagnoses
          .map(d => {
            if (d.Diagnosis && d.Diagnosis.name) {
              return d.Diagnosis.name;
            }
            return '';
          })
          .join(', ');
      }

      return undefined;
    },
  },
  {
    title: 'Referring Doctor',
    accessor: referral => referral.initiatingEncounter.examiner.displayName,
  },
  {
    title: 'Department',
    accessor: referral => referral.initiatingEncounter.referredToDepartment?.name || '',
  },
  { title: 'Date', accessor: referral => referral.initiatingEncounter.startDate },
];

function parametersToSqlWhere(parameters) {
  if (parameters.fromDate) {
    parameters.fromDate = toDateTimeString(startOfDay(parseISO(parameters.fromDate)));
  }
  if (parameters.toDate) {
    parameters.toDate = toDateTimeString(endOfDay(parseISO(parameters.toDate)));
  }
  const whereClause = Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce(
      (where, [key, value]) => {
        switch (key) {
          case 'village':
            where['$initiatingEncounter.patient.village_id$'] = value;
            break;
          case 'practitioner':
            where.referredById = value;
            break;
          case 'fromDate':
            if (!where['$initiatingEncounter.start_date$']) {
              where['$initiatingEncounter.start_date$'] = {};
            }
            where['$initiatingEncounter.start_date$'][Op.gte] = value;
            break;
          case 'toDate':
            if (!where['$initiatingEncounter.start_date$']) {
              where['$initiatingEncounter.start_date$'] = {};
            }
            where['$initiatingEncounter.start_date$'][Op.lte] = value;
            break;
          default:
            break;
        }
        return where;
      },
      {
        completing_encounter_id: {
          [Op.is]: null,
        },
      },
    );
  return whereClause;
}

async function queryReferralsData(models, parameters) {
  const result = await models.Referral.findAll({
    include: [
      {
        model: models.Encounter,
        as: 'initiatingEncounter',
        include: [
          {
            model: models.Patient,
            as: 'patient',
            include: [{ model: models.ReferenceData, as: 'village' }],
          },
          {
            model: models.EncounterDiagnosis,
            as: 'diagnoses',
          },
        ],
      },
    ],
    where: parametersToSqlWhere(parameters),
  });
  return result;
}

export async function dataGenerator({ models }, parameters) {
  const queryResults = await queryReferralsData(models, parameters);
  return generateReportFromQueryData(queryResults, reportColumnTemplate);
}
