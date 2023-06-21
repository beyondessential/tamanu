import { subDays } from 'date-fns';
import { toDateString } from '../utils/dateTime';
import { generateReportFromQueryData } from './utilities';

const FIELDS = [
  'Patient ID',
  'Patient first name',
  'Patient last name',
  'DOB',
  'Age',
  'Sex',
  'Village',
  'Nationality',
  'Ethnicity',
  'Mother',
  'Father',
  'Time of birth',
  'Gestational age (weeks)',
  'Place of birth',
  'Name of health facility (if selected)',
  'Attendant at birth',
  'Name of attendant',
  'Delivery type',
  'Single/Plural birth',
  'Birth weight (kg)',
  'Birth length (cm)',
  'Apgar score at 1 min',
  'Apgar score at 5 min',
  'Apgar score at 10 min',
];

const reportColumnTemplate = FIELDS.map(field => ({
  title: field,
  accessor: data => data[field],
}));

const query = `
select
  p.display_id as "Patient ID",
  p.first_name as "Patient first name",
  p.last_name as "Patient last name",
  to_char(p.date_of_birth::date, 'dd-mm-yyyy') as "DOB",
  case
    when p.date_of_death is null
    then case
      when p.date_of_birth::date = CURRENT_DATE
      then '0 days'
      else date_trunc('day', Age(p.date_of_birth::date))::text
    end
    else date_trunc('day', Age(p.date_of_death::date, p.date_of_birth::date))::text
  end as "Age",
  p.sex as "Sex",
  rd_village.name as "Village",
  rd_nationality.name as "Nationality",
  rd_ethnicity.name as "Ethnicity",
  case
    when p_mother.id is not null
    then concat(p_mother.first_name, ' ', p_mother.last_name, ' (', p_mother.display_id, ')')
  end as "Mother",
  case
    when p_father.id is not null
    then concat(p_father.first_name, ' ', p_father.last_name, ' (', p_father.display_id, ')')
  end as "Father",
  to_char(pbd.time_of_birth::timestamp, 'HH12:MI AM') as "Time of birth",
  pbd.gestational_age_estimate as "Gestational age (weeks)",
  pbd.registered_birth_place as "Place of birth",
  f."name" as "Name of health facility (if selected)",
  pbd.attendant_at_birth as "Attendant at birth",
  pbd.name_of_attendant_at_birth as "Name of attendant",
  pbd.birth_delivery_type as "Delivery type",
  pbd.birth_type as "Single/Plural birth",
  pbd.birth_weight as "Birth weight (kg)",
  pbd.birth_length as "Birth length (cm)",
  pbd.apgar_score_one_minute as "Apgar score at 1 min",
  pbd.apgar_score_five_minutes as "Apgar score at 5 min",
  pbd.apgar_score_ten_minutes as "Apgar score at 10 min"
from
  patient_birth_data pbd
  left join patients p on pbd.patient_id = p.id
  left join reference_data rd_village on rd_village.id = p.village_id
  left join patient_additional_data pad on pad.patient_id = p.id
  left join reference_data rd_nationality on rd_nationality.id = pad.nationality_id
  left join reference_data rd_ethnicity on rd_ethnicity.id = pad.ethnicity_id
  left join patients p_mother on p_mother.id = pad.mother_id
  left join patients p_father on p_father.id = pad.father_id
  left join facilities f on f.id = pbd.birth_facility_id
where
  p.id not in (
    '4d719b6f-af55-42ac-99b3-5a27cadaab2b',
    '2d574680-e0fc-4956-a37e-121ccb434995',
    'c11229a7-b95c-4416-a3ad-560cd75d8f21',
    'cebdd9a4-2744-4ad2-9919-98dc0b15464c'
  )
  and case when :from_date is not null then p.date_of_birth::date >= :from_date::date else true end
  and case when :to_date is not null then p.date_of_birth::date <= :to_date::date else true end
  and case when :village_id is not null then p.village_id = :village_id else true end
order by p.date_of_birth::date, pbd.time_of_birth::timestamp::time;
`;

const getData = async (sequelize, parameters) => {
  const { fromDate, toDate, village } = parameters;

  return sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      from_date: fromDate || toDateString(subDays(new Date(), 30)),
      to_date: toDate ?? null,
      village_id: village ?? null,
    },
  });
};

export const dataGenerator = async ({ sequelize }, parameters = {}) => {
  const results = await getData(sequelize, parameters);

  return generateReportFromQueryData(results, reportColumnTemplate);
};

export const permission = 'PatientBirthData';
