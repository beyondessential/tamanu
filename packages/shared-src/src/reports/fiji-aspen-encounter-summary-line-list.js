import { generateReportFromQueryData } from './utilities';

const FIELDS = [
  'NHN',
  'First name',
  'Last name',
  'Date of birth',
  'Sex',
  'Patient billing type',
  'Encounter start date',
  'Encounter end date',
  'Encounter type',
  'Reason for encounter',
  'Diagnosis',
  'Medications',
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
			max(rd.name) "Patient billing type"
		from patient_additional_data adc
		join reference_data rd on rd.id = patient_billing_type_id
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
	lab_request_info as (
		select 
			encounter_id,
			string_agg(ltt.name, ';') as "Lab requests"
		from lab_requests lr
		join lab_tests lt on lt.lab_request_id = lr.id
		join lab_test_types ltt 
		on ltt.id = lt.lab_test_type_id
		group by encounter_id
	),
	procedure_info as (
		select
			encounter_id,
			string_agg(proc.name || ', ' || proc.code, ';') as "Procedures"
		from "procedures" p2 
		left join reference_data proc ON proc.id = p2.procedure_type_id
		group by encounter_id 
	),
	medications_info as (
		select
			encounter_id,
			string_agg(medication.name, ';') as "Medications"
		from encounter_medications em
		join reference_data medication on medication.id = em.medication_id
		group by encounter_id
	),
	diagnosis_info as (
		select
			encounter_id,
			string_agg(diagnosis.name || ', ' || diagnosis.code || ', primary' || CHR(58) || is_primary || ', ' || certainty, ';') as "Diagnosis"
		from encounter_diagnoses ed
		join reference_data diagnosis on diagnosis.id = ed.diagnosis_id
		group by encounter_id
	),
	imaging_info as (
		select
			encounter_id,
			string_agg(image_type.name, ';') as "Imaging requests"
		from imaging_requests ir
		join reference_data image_type on image_type.id = ir.imaging_type_id 
		group by encounter_id
	),
	notes_info as (
		select
			record_id as encounter_id,
			string_agg(n.note_type || CHR(58) || ' ' || n."content" , ';') as "Notes"
		from notes n
		group by record_id
	)
select
	p.display_id "NHN",
	p.first_name "First name",
	p.last_name "Last name",
	to_char(p.date_of_birth, 'YYYY-MM-DD') "Date of birth",
	p.sex "Sex",
	bt."Patient billing type",
	to_char(e.start_date, 'YYYY-MM-DD HH24' || CHR(58) || 'MI') "Encounter start date",
	to_char(e.end_date, 'YYYY-MM-DD HH24' || CHR(58) || 'MI') "Encounter end date",
	e.encounter_type "Encounter type",
	e.reason_for_encounter "Reason for encounter",
	di."Diagnosis",
	mi."Medications",
	pi."Procedures",
	lri."Lab requests",
	ii."Imaging requests",
	ni."Notes"
from patients_considered p
join encounters e on e.patient_id = p.id
left join billing_type bt on bt.patient_id = p.id
left join medications_info mi on e.id = mi.encounter_id
left join diagnosis_info di on e.id = di.encounter_id
left join procedure_info pi on e.id = pi.encounter_id
left join lab_request_info lri on lri.encounter_id = e.id
left join imaging_info ii on ii.encounter_id = e.id
left join notes_info ni on ni.encounter_id = e.id
where e.end_date is not null
and coalesce(bt."Patient billing type", '-') like coalesce(:billing_type, '%%')
and e.start_date::date >= coalesce(:from_date::date, '1000-01-01'::date)
and e.start_date::date <= coalesce(:to_date::date, '9999-12-31'::date)
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
