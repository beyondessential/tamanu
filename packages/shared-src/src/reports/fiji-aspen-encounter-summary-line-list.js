import { generateReportFromQueryData } from './utilities';

const FIELDS = [
  'Patient ID',
  'First name',
  'Last name',
  'Date of birth',
  'Age',
  'Sex',
  'Patient billing type',
  'Encounter start date',
  'Encounter end date',
  'Encounter type',
  'Reason for encounter',
  'Diagnosis',
  'Medications',
  'Vaccinations',
  'Procedures',
  'Lab requests',
  'Imaging requests',
  'Notes',
];

const reportColumnTemplate = FIELDS.map(field => ({
  title: field,
  accessor: data => data[field],
}));

const query = `
with 
	billing_type as (
		select 
			patient_id,
			max(patient_billing_type_id) patient_billing_type_id
		from patient_additional_data adc
		group by patient_id
	),
	patients_considered as (
		select
			id, 
			display_id,
			first_name,
			last_name,
			date_of_birth,
			sex 
		from patients
	),
	notes_info as (
		select
			record_id,
			json_agg(
				json_build_object(
					'note_type', note_type,
					'content', "content"
				) 
			) aggregated_notes
		from notes
		group by record_id
	),
	lab_test_info as (
		select 
			lab_request_id,
			json_agg(
				json_build_object(
					'name', ltt.name,
					'notes', 'TODO'
				)
			) tests
		from lab_tests lt
		join lab_test_types ltt on ltt.id = lt.lab_test_type_id 
		group by lab_request_id 
	),
	lab_request_info as (
		select 
			encounter_id,
			json_agg(
				json_build_object(
					'tests', tests,
					'notes', to_json(aggregated_notes)
				)) "Lab requests"
		from lab_requests lr
		join lab_test_info lti
		on lti.lab_request_id  = lr.id
		left join notes_info ni on ni.record_id = lr.id
		group by encounter_id
	),
	procedure_info as (
		select
			encounter_id,
			json_agg(
				json_build_object(
					'name', proc.name,
					'code', proc.code,
					'date', to_char(date, 'yyyy-dd-mm'),
					'location', loc.name,
					'notes', p.note,
					'completed_notes', completed_note
				) 
			) "Procedures"
		from "procedures" p
		left join reference_data proc ON proc.id = procedure_type_id
		left join locations loc on loc.id = location_id
		group by encounter_id 
	),
	medications_info as (
		select
			encounter_id,
			json_agg(
				json_build_object(
					'name', medication.name,
					'discontinued', coalesce(discontinued, false),
					'discontinuing_reason', discontinuing_reason
				) 
			) "Medications"
		from encounter_medications em
		join reference_data medication on medication.id = em.medication_id
		group by encounter_id
	),
	diagnosis_info as (
		select
			encounter_id,
			json_agg(
				json_build_object(
					'name', diagnosis.name,
					'code', diagnosis.code,
					'is_primary', case when is_primary then 'primary' else 'secondary' end,
					'certainty', certainty
				) 
			) "Diagnosis"
		from encounter_diagnoses ed
		join reference_data diagnosis on diagnosis.id = ed.diagnosis_id
		where certainty not in ('disproven', 'error')
		group by encounter_id
	),
	vaccine_info as (
		select
			encounter_id,
			json_agg(
				json_build_object(
					'name', drug.name,
					'label', sv.label,
					'schedule', sv.schedule
				) 
			) "Vaccinations"
		from administered_vaccines av
		join scheduled_vaccines sv on sv.id = av.scheduled_vaccine_id 
		join reference_data drug on drug.id = sv.vaccine_id 
		group by encounter_id
	),
	imaging_info as (
		select
			encounter_id,
			json_agg(
				json_build_object(
					'name', image_type.name,
					'notes', 'TODO'
				) 
			) "Imaging requests"
		from imaging_requests ir
		join reference_data image_type on image_type.id = ir.imaging_type_id 
		group by encounter_id
	),
	encounter_notes_info as (
	-- Note this will include non-encounter notes - but they won't join anywhere because we use uuids
		select
			record_id as encounter_id,
			aggregated_notes "Notes"
		from notes_info
	)
select
	p.display_id "Patient ID",
	p.first_name "First name",
	p.last_name "Last name",
	to_char(p.date_of_birth, 'YYYY-MM-DD') "Date of birth",
	extract(year from age(p.date_of_birth)) "Age",
	p.sex "Sex",
	billing.name "Patient billing type",
	e.id "Encounter ID",
	to_char(e.start_date, 'YYYY-MM-DD HH24' || CHR(58) || 'MI') "Encounter start date",
	to_char(e.end_date, 'YYYY-MM-DD HH24' || CHR(58) || 'MI') "Encounter end date",
	case e.encounter_type
		when 'triage' then  'Triage'
		when 'observation' then  'Active ED patient'
		when 'emergency' then  'Emergency short stay'
		when 'admission' then  'Hospital admission'
		when 'clinic' then 'Clinic'
		when 'imaging' then 'Imaging'
		when 'surveyResponse' then 'Survey response'
		else e.encounter_type
	end "Encounter type",
	case t.score
		when '1' then  'Emergency'
		when '2' then  'Priority'
		when '3' then  'Non-urgent'
		else t.score
	end "Triage category",
	e.reason_for_encounter "Reason for encounter",
	di."Diagnosis",
	mi."Medications",
	vi."Vaccinations",
	pi."Procedures",
	lri."Lab requests",
	ii."Imaging requests",
	ni."Notes"
from patients_considered p
join encounters e on e.patient_id = p.id
left join billing_type bt on bt.patient_id = p.id
left join reference_data billing on billing.id = bt.patient_billing_type_id
left join medications_info mi on e.id = mi.encounter_id
left join vaccine_info vi on e.id = vi.encounter_id
left join diagnosis_info di on e.id = di.encounter_id
left join procedure_info pi on e.id = pi.encounter_id
left join lab_request_info lri on lri.encounter_id = e.id
left join imaging_info ii on ii.encounter_id = e.id
left join encounter_notes_info ni on ni.encounter_id = e.id
left join triages t on t.encounter_id = e.id
where e.end_date is not null
--and json_array_length("Lab requests" -> 0 -> 'tests') > 1
and coalesce(billing.id, '-') like coalesce(:billing_type, '%%')
AND CASE WHEN :from_date IS NOT NULL THEN e.start_date::date >= :from_date::date ELSE true END
AND CASE WHEN :to_date IS NOT NULL THEN e.start_date::date <= :to_date::date ELSE true END
order by e.start_date desc;
`;

const getData = async (sequelize, parameters) => {
  const { fromDate, toDate, patientBillingType } = parameters;

  return sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      from_date: fromDate ?? null,
      to_date: toDate ?? null,
      billing_type: patientBillingType ?? null,
    },
  });
};

export const dataGenerator = async ({ sequelize }, parameters = {}) => {
  const results = await getData(sequelize, parameters);

  return generateReportFromQueryData(results, reportColumnTemplate);
};

export const permission = 'Encounter';
