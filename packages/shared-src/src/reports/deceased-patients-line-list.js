import { subDays } from 'date-fns';
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
  'Place of Death',
  'Department',
  'Location',
  'Date and time of death',
  'Attending clinician',
  'Cause of death',
  'Time between onset of cause and death',
  'Due to (or as a consequence of) 1',
  'Due to (or as a consequence of) 2',
  'Other contributing conditions 1',
  'Other contributing conditions 2',
  'Other contributing conditions 3',
  'Other contributing conditions 4',
  'Surgery performed in the last 4 weeks',
  'Date of surgery',
  'Reason for surgery',
  'Manner of death',
  'Date of external cause',
  'Location of external cause',
  'If female, was the woman pregnant',
  'Did the pregnancy contribute to the death',
  'Fetal or infant death',
  'Stillbirth',
  'Birth weight (g)',
  'Number of completed weeks of pregnancy',
  'Age of mother',
  'Condition in mother affecting the fetus or newborn',
  'Death within 24 hours of birth',
  'Number of hours survived',
];

const reportColumnTemplate = FIELDS.map(field => ({
  title: field,
  accessor: data => data[field],
}));

const query = `
with
	other_causes as (
		select id,
			max(case when rnum = 1 then time_after_onset end) as "Time between onset of cause and death",
       		max(case when rnum = 1 then name end) as "Other contributing conditions 1",
       		max(case when rnum = 2 then name end) as "Other contributing conditions 2",
       		max(case when rnum = 3 then name end) as "Other contributing conditions 3",
       		max(case when rnum = 4 then name end) as "Other contributing conditions 4"
		from (
			select pdd.id,
				dc.time_after_onset,
				rd.name,
				row_number() OVER (PARTITION BY pdd.id ORDER BY dc.created_at) as rnum
			from patient_death_data pdd
			left join contributing_death_causes dc on dc.patient_death_data_id = pdd.id
			left join reference_data rd on rd.id=dc.condition_id
			where dc.id not in (SELECT DISTINCT unnest(string_to_array(pdd2.primary_cause_condition_id || '#' || pdd2.antecedent_cause1_condition_id || '#' || pdd2.antecedent_cause2_condition_id, '#')) FROM patient_death_data pdd2 )
			order by pdd.id, rnum
    ) as d
    group by d.id
	)
select distinct on (p.date_of_death, p.id)
  p.display_id as "Patient ID",
  p.first_name  as "Patient first name",
  p.last_name as "Patient last name",
  p.date_of_birth as "DOB",
  age(p.date_of_death,p.date_of_birth) as "Age",
  p.sex as "Sex",
  village.name as "Village",
  nationality.name as "Nationality",
  case
    when pdd.facility_id is not null
    then f.name
    else 'Died outside health facility'
		end as "Place of Death",
  department.name as "Department",
  loc.name as "Location",
  to_char(p.date_of_death::timestamp, 'dd/mm/yyyy HH12:MI AM') as "Date and time of death",
  u.display_name as "Attending clinician",
  rd4.name as "Cause of death",
  os."Time between onset of cause and death",
  rd5.name as "Due to (or as a consequence of) 1",
  rd6.name as "Due to (or as a consequence of) 2",
  os."Other contributing conditions 1",
  os."Other contributing conditions 2",
  os."Other contributing conditions 3",
  os."Other contributing conditions 4",
  pdd.recent_surgery as "Surgery performed in the last 4 weeks",
  to_char(pdd.last_surgery_date::timestamp::date, 'dd/mm/yyyy') as "Date of surgery",
  rd3.name as "Reason for surgery",
  pdd.manner as "Manner of death",
  to_char(pdd.external_cause_date::timestamp::date, 'dd/mm/yyyy') as "Date of external cause",
  pdd.external_cause_location as "Location of external cause",
  pdd.was_pregnant as "If female, was the woman pregnant",
  pdd.pregnancy_contributed as "Did the pregnancy contribute to the death",
  pdd.fetal_or_infant as "Fetal or infant death",
  pdd.stillborn as "Stillbirth",
  pdd.birth_weight as "Birth weight (g)",
  pdd.carrier_pregnancy_weeks as "Number of completed weeks of pregnancy",
  pdd.carrier_age as "Age of mother",
  rd7.name as "Condition in mother affecting the fetus or newborn",
  pdd.within_day_of_birth as "Death within 24 hours of birth",
  pdd.hours_survived_since_birth as "Number of hours survived"
from
  patient_death_data pdd
  left join patients p on p.id = pdd.patient_id
  left join reference_data village on village.id = p.village_id
  left join patient_additional_data pad2 on pad2.patient_id = p.id
  left join reference_data nationality on nationality.id = pad2.nationality_id
  left join encounters e on e.patient_id = p.id
  left join departments department on department.id = e.department_id
  left join locations loc on loc.id = e.location_id
  left join users u ON u.id = pdd.clinician_id
  left join reference_data rd4 on rd4.id=pdd.primary_cause_condition_id
  left join reference_data rd5 on rd5.id=pdd.antecedent_cause1_condition_id
  left join reference_data rd6 on rd6.id=pdd.antecedent_cause2_condition_id
  left join facilities f on f.id=pdd.facility_id
  left join other_causes os on os.id=pdd.id
  left join reference_data rd3 on rd3.id=pdd.last_surgery_reason_id
  left join reference_data rd7 on rd7.id=pdd.carrier_existing_condition_id
where
  to_char(e.end_date::timestamp::date, 'dd/mm/yyyy') = to_char(p.date_of_death::timestamp::date, 'dd/mm/yyyy')
  and case when :from_date is not null then e.start_date::date >= :from_date::date else true end
  and case when :to_date is not null then e.start_date::date <= :to_date::date else true end
  and case when :cause_of_death is not null then rd4.id = :cause_of_death else true end
  and case when :antecedent_cause is not null then (rd5.id = :antecedent_cause OR rd6.id = :antecedent_cause) else true end
  and case when :other_contributing_condition is not null then os.id = :other_contributing_condition else true end
  and case when :manner_of_death is not null then pdd.manner = :manner_of_death else true end
order by p.date_of_death, p.id, e.end_date;
`;

const getData = async (sequelize, parameters) => {
  const {
    fromDate = subDays(new Date(), 30),
    toDate,
    causeOfDeath,
    antecedentCause,
    otherContributingCondition,
    mannerOfDeath,
  } = parameters;

  return sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      from_date: fromDate ?? null,
      to_date: toDate ?? null,
      cause_of_death: causeOfDeath ?? null,
      antecedent_cause: antecedentCause ?? null,
      other_contributing_condition: otherContributingCondition ?? null,
      manner_of_death: mannerOfDeath ?? null,
    },
  });
};

export const dataGenerator = async ({ sequelize }, parameters = {}) => {
  const results = await getData(sequelize, parameters);

  return generateReportFromQueryData(results, reportColumnTemplate);
};

export const permission = 'PatientDeathData';
