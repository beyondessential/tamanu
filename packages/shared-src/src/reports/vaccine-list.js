import { Op } from 'sequelize';
import { subDays, format } from 'date-fns';
import { generateReportFromQueryData } from './utilities';

export const reportColumnTemplate = [
  {
    title: 'Patient Name',
    accessor: data => data.patientName,
  },
  { title: 'UID', accessor: data => data.uid },
  { title: 'DOB', accessor: data => data.dob },
  { title: 'Sex', accessor: data => data.sex },
  { title: 'Village', accessor: data => data.village },
  { title: 'Vaccine name', accessor: data => data.vaccineName },
  { title: 'Vaccine status', accessor: data => data.vaccineStatus },
  { title: 'Schedule', accessor: data => data.schedule },
  { title: 'Vaccine date', accessor: data => data.vaccineDate },
  { title: 'Batch', accessor: data => data.batch },
  { title: 'Vaccinator', accessor: data => data.vaccinator },
];

function parametersToSqlWhere(parameters) {
  const newParameters = { ...parameters };
  if (!newParameters.fromDate) {
    newParameters.fromDate = subDays(new Date(), 30).toISOString();
  }

  const whereClause = Object.entries(newParameters)
    .filter(([, val]) => val)
    .reduce((where, [key, value]) => {
      const newWhere = { ...where };
      switch (key) {
        case 'village':
          newWhere['$encounter->patient.village_id$'] = value;
          break;
        case 'fromDate':
          if (!newWhere.date) {
            newWhere.date = {};
          }
          newWhere.date[Op.gte] = value;
          break;
        case 'toDate':
          if (!newWhere.date) {
            newWhere.date = {};
          }
          newWhere.date[Op.lte] = value;
          break;
        case 'category':
          newWhere['$scheduledVaccine.category$'] = value;
          break;
        case 'vaccine':
          newWhere['$scheduledVaccine.label$'] = value;
          break;
        default:
          break;
      }
      return newWhere;
    }, {});

  return whereClause;
}

export async function queryCovidVaccineListData(models, parameters) {
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
          {
            model: models.User,
            as: 'examiner',
          },
        ],
      },
      {
        model: models.ScheduledVaccine,
        as: 'scheduledVaccine',
      },
      {
        model: models.User,
        as: 'recorder',
      },
    ],
    where: parametersToSqlWhere(parameters),
    order: [
      [
        { model: models.Encounter, as: 'encounter' },
        { model: models.Patient, as: 'patient' },
        'id',
        'ASC',
      ],
      ['date', 'ASC'],
    ],
  });
  const administeredVaccines = result.map(r => r.get({ plain: true }));

  const reportData = [];
  for (const vaccine of administeredVaccines) {
    if (!vaccine.encounter?.patientId) {
      continue;
    }
    const {
      encounter: {
        patient: { id: patientId, displayId, firstName, lastName, dateOfBirth, village, sex },
        examiner: { displayName: examinerName },
      },
      date,
      status,
      batch,
      scheduledVaccine: { schedule, label: vaccineName },
      recorder,
    } = vaccine;

    const vaccinator = vaccine.givenBy ?? recorder?.displayName ?? examinerName;

    const record = {
      patientId,
      patientName: `${firstName} ${lastName}`,
      uid: displayId,
      dob: format(dateOfBirth, 'dd-MM-yyyy'),
      sex,
      village: village?.name,
      vaccineName,
      schedule,
      vaccineStatus: status === 'GIVEN' ? 'Yes' : 'No',
      vaccineDate: format(date, 'dd-MM-yyyy'),
      batch: status === 'GIVEN' ? batch : '',
      vaccinator: status === 'GIVEN' ? vaccinator : '',
    };

    reportData.push(record);
  }

  return reportData;
}

export async function dataGenerator({ models }, parameters) {
  const queryResults = await queryCovidVaccineListData(models, parameters);
  return generateReportFromQueryData(queryResults, reportColumnTemplate);
}

export const permission = 'PatientVaccine';





ScheduledVaccin



3eaf878e-02f8-49ee-a351-af5d4e6c0404 | 2022-05-09 19:28:14.459-07 | 2022-05-09 19:28:14.459-07 |            | Campaign | COVID-19 Covishield  | Dose 1   |                      |     1 | drug-COVID-19-Covishield          |                  
c04d8e3e-c96d-4891-997f-b93ef5fa784c | 2022-05-09 19:28:14.459-07 | 2022-05-09 19:28:14.459-07 |            | Campaign | COVID-19 Covishield  | Dose 2   |                      |     2 | drug-COVID-19-Covishield          |                  
382dc076-9d62-45f4-833e-b89824865908 | 2022-02-03 04:14:11.234-08 | 2022-03-24 22:03:12.523-07 |            | Campaign | COVID-19 Pfizer      | Dose 2   |                      |     2 | drug-COVID-19-Pfizer              |                               3
bfb54189-8934-4b69-aaf4-eead6563d48e | 2022-02-07 21:55:07.993-08 | 2022-03-24 22:03:12.538-07 |            | Campaign | COVID-19-AstraZeneca | Booster  |                      |     3 | drug-COVID-19-Astra-ZenecaBooster |                  
3a67c411-1bed-418b-9336-35efa64da14d | 2022-02-06 12:53:07.866-08 | 2022-03-24 22:03:12.538-07 |            | Campaign | COVID-19 Pfizer      | Booster  |                      |     3 | drug-COVID-19-PfizerBooster       |                  
ab780935-84d9-4114-bd4b-e8b6329cff74 | 2021-09-02 00:09:44.64-07  | 2022-03-24 22:03:12.538-07 |            | Campaign | COVID-19-AstraZeneca | Dose 2   |                      |     2 | drug-COVID-19-Astra-Zeneca        |                               6
e5813cff-51d2-4ae8-a30e-3c60332880db | 2022-02-03 04:14:11.234-08 | 2022-03-24 22:03:12.538-07 |            | Campaign | COVID-19 Pfizer      | Dose 1   |                      |     1 | drug-COVID-19-Pfizer              |                  
f1722cb8-7eb1-4127-aba4-eccfff867117 | 2021-09-02 00:09:44.64-07  | 2022-03-24 22:03:12.538-07 |            | Campaign | COVID-19-AstraZeneca | Dose 1   |                      |     1 | drug-COVID-19-Astra-Zeneca        |   

SELECT
 av.created_at, av.updated_at, av.batch, sv.label
FROM scheduled_vaccines sv JOIN administered_vaccines av ON sv.id = av.scheduled_vaccine_id
WHERE sv.label LIKE 'COVID%'
  AND av.batch IN ('2', '3', '4', '5', '6', '7', '8')
  AND av.status = 'GIVEN'
ORDER BY av.created_at DESC
LIMIT 5;
\

SELECT
 av.created_at, av.updated_at, av.batch, sv.label, count(*),
FROM scheduled_vaccines sv JOIN administered_vaccines av ON sv.id = av.scheduled_vaccine_id
WHERE sv.label LIKE 'COVID%'
  AND av.batch IN ('2', '3', '4', '5', '6', '7', '8')
  AND av.status = 'GIVEN'


  SELECT
 av.created_at, av.updated_at, av.batch, sv.label
FROM scheduled_vaccines sv JOIN administered_vaccines av ON sv.id = av.scheduled_vaccine_id
WHERE sv.label LIKE 'COVID%'
AND av.batch IN ('2', '3', '4', '5', '6', '7', '8')
  AND av.status = 'GIVEN'
  ORDER BY created_at DESC
LIMIT 5;