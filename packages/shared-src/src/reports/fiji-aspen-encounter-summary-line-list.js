import { generateReportFromQueryData } from './utilities';

const FIELDS = [
  'Patient ID',
  'First name',
  'Last name',
  'Date of birth',
  'Age',
  'Sex',
  'Patient billing type',
  'Encounter ID',
  'Encounter start date',
  'Encounter end date',
  'Encounter type',
  'Triage category',
  'Time seen following triage/Wait time',
  'Department',
  'Location',
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
  notes_info as (
    select
      record_id,
      json_agg(
        json_build_object(
          'Note type', note_type,
          'Content', "content",
          'Note date', to_char("date", 'YYYY-MM-DD HH12' || CHR(58) || 'MI AM')
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
          'Name', ltt.name,
          'Notes', 'TODO'
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
          'Tests', tests,
          'Notes', to_json(aggregated_notes)
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
          'Name', proc.name,
          'Code', proc.code,
          'Date', to_char(date, 'yyyy-dd-mm'),
          'Location', loc.name,
          'Notes', p.note,
          'Completed notes', completed_note
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
          'Name', medication.name,
          'Discontinued', coalesce(discontinued, false),
          'Discontinuing reason', discontinuing_reason
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
          'Name', diagnosis.name,
          'Code', diagnosis.code,
          'Is primary?', case when is_primary then 'primary' else 'secondary' end,
          'Certainty', certainty
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
          'Name', drug.name,
          'Label', sv.label,
          'Schedule', sv.schedule
        ) 
      ) "Vaccinations"
    from administered_vaccines av
    join scheduled_vaccines sv on sv.id = av.scheduled_vaccine_id 
    join reference_data drug on drug.id = sv.vaccine_id 
    group by encounter_id
  ),
  single_image_info as (
    select
      ir.encounter_id,
      json_build_object(
        'Name', image_type.name,
        'Area to be imaged', area_notes.aggregated_notes,
        'Notes', non_area_notes.aggregated_notes
      ) "data"
    from imaging_requests ir
    join reference_data image_type on image_type.id = ir.imaging_type_id
    left join (
      select 
        record_id,
        json_agg(note) aggregated_notes
      from notes_info
      cross join json_array_elements(aggregated_notes) note
      where note->>'note_type' != 'abc' --cross join ok here as only 1 record will be matched
      group by record_id
    ) non_area_notes
    on non_area_notes.record_id = ir.id 
    left join (
      select 
        record_id,
        string_agg(note->>'content', 'ERROR - SHOULD ONLY BE ONE AREA TO BE IMAGED') aggregated_notes
      from notes_info
      cross join json_array_elements(aggregated_notes) note
      where note->>'note_type' = 'abc' --cross join ok here as only 1 record will be matched
      group by record_id
    ) area_notes
    on area_notes.record_id = ir.id
  ),
  imaging_info as (
    select
      encounter_id,
      json_agg("data") "Imaging requests"
    from single_image_info
    group by encounter_id
  ),
  encounter_notes_info as (
  -- Note this will include non-encounter notes - but they won't join anywhere because we use uuids
    select
      record_id encounter_id,
      json_agg(
        json_build_object(
          'Note type', note_type,
          'Content', "content",
          'Note date', to_char("date", 'YYYY-MM-DD HH12' || CHR(58) || 'MI AM')
        ) 
      ) "Notes"
    from notes
    where note_type != 'system'
    group by record_id
  ),
  note_history as (
    select
      record_id encounter_id,
      matched_vals[1] place,
      matched_vals[2] "from",
      matched_vals[3] "to",
      date
    from notes n,
      lateral (select regexp_matches("content", 'Changed (.*) from (.*) to (.*)') matched_vals) matched_vals,
      lateral (select matched_vals[1] place) place,
      lateral (select matched_vals[2] "from") "from",
      lateral (select matched_vals[3] "to") "to"
    where note_type = 'system'
    and record_type = 'encounter'
    and "content" ~ 'Changed (.*) from (.*) to (.*)'
  ),
  department_info as (
    select 
      e.id encounter_id,
      case when count("from") = 0
        then json_build_array(json_build_object(
          'Department', d.name,
          'Assigned time', to_char(e.start_date, 'YYYY-MM-DD HH12' || CHR(58) || 'MI AM')
        ))
        else json_build_array(
          json_build_object(
            'Department', first_from, --first "from" from note
            'Assigned time', to_char(e.start_date, 'YYYY-MM-DD HH12' || CHR(58) || 'MI AM')
          ),
          json_agg(
            json_build_object(
              'Department', "to",
              'Assigned time', to_char(nh.date, 'YYYY-MM-DD HH12' || CHR(58) || 'MI AM')
            ) ORDER BY nh.date
          )
        )
      end department_history,
      json_agg(d2.id) dept_id_list
    from encounters e
    left join departments d on e.department_id = d.id
    left join note_history nh
    on nh.encounter_id = e.id
    left join (
      select
        nh2.encounter_id enc_id,
        "from" first_from,
        date
      from note_history nh2
      order by date
      limit 1
    ) first_from
    on e.id = first_from.enc_id
    left join departments d2 -- note: this may contain duplicates
    on d2.name = nh."to" or d2.name = nh."from" or d2.id = d.id
    where place = 'department' or place is null
    group by e.id, d.name, e.start_date, first_from
  ),
  location_info as (
    select 
      e.id encounter_id,
      case when count("from") = 0
        then json_build_array(json_build_object(
          'Location', l.name,
          'Assigned time', to_char(e.start_date, 'YYYY-MM-DD HH12' || CHR(58) || 'MI AM')
        ))
        else json_build_array(
          json_build_object(
            'Location', first_from, --first "from" from note
            'Assigned time', to_char(e.start_date, 'YYYY-MM-DD HH12' || CHR(58) || 'MI AM')
          ),
          json_agg(
            json_build_object(
              'Location', "to",
              'Assigned time', to_char(nh.date, 'YYYY-MM-DD HH12' || CHR(58) || 'MI AM')
            ) ORDER BY nh.date
          )
        )
      end location_history,
      json_agg(l2.id) loc_id_list
    from encounters e
    left join locations l on e.location_id = l.id
    left join note_history nh
    on nh.encounter_id = e.id
    left join (
      select
        nh2.encounter_id enc_id,
        "from" first_from,
        date
      from note_history nh2
      order by date
      limit 1
    ) first_from
    on e.id = first_from.enc_id
    left join locations l2 -- note: this may contain duplicates
    on l2.name = nh."to" or l2.name = nh."from" or l2.id = l.id
    where place = 'location' or place is null
    group by e.id, l.name, e.start_date, first_from
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
  case when t.closed_time is null 
    then age(t.triage_time)
    else age(t.closed_time, t.triage_time)
  end "Time seen following triage/Wait time",
  di2.department_history "Department",
  li.location_history "Location",
  e.reason_for_encounter "Reason for encounter",
  di."Diagnosis",
  mi."Medications",
  vi."Vaccinations",
  pi."Procedures",
  lri."Lab requests",
  ii."Imaging requests",
  ni."Notes"
from patients p
join encounters e on e.patient_id = p.id
left join reference_data billing on billing.id = e.patient_billing_type_id
left join medications_info mi on e.id = mi.encounter_id
left join vaccine_info vi on e.id = vi.encounter_id
left join diagnosis_info di on e.id = di.encounter_id
left join procedure_info pi on e.id = pi.encounter_id
left join lab_request_info lri on lri.encounter_id = e.id
left join imaging_info ii on ii.encounter_id = e.id
left join encounter_notes_info ni on ni.encounter_id = e.id
left join triages t on t.encounter_id = e.id
left join location_info li on li.encounter_id = e.id
left join department_info di2 on di2.encounter_id = e.id
where e.end_date is not null
and coalesce(billing.id, '-') like coalesce(:billing_type, '%%')
and CASE WHEN :department_id IS NOT NULL THEN dept_id_list::jsonb ? :department_id ELSE true end 
and CASE WHEN :location_id IS NOT NULL THEN loc_id_list::jsonb ? :location_id ELSE true end 
AND CASE WHEN :from_date IS NOT NULL THEN e.start_date::date >= :from_date::date ELSE true END
AND CASE WHEN :to_date IS NOT NULL THEN e.start_date::date <= :to_date::date ELSE true END
order by e.start_date desc;
`;

const getData = async (sequelize, parameters) => {
  const { fromDate, toDate, patientBillingType, department, location } = parameters;

  return sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      from_date: fromDate ?? null,
      to_date: toDate ?? null,
      billing_type: patientBillingType ?? null,
      department_id: department ?? null,
      location_id: location ?? null,
    },
  });
};

const formatJsonValue = value => {
  if (Array.isArray(value)) {
    return value.map(formatJsonValue).join('; ');
  }
  if (typeof value === 'object' && !(value instanceof Date) && value !== null) {
    return Object.entries(value)
      .map(([k, v]) => `${k}: ${formatJsonValue(v)}`)
      .join(', ');
  }
  return value;
};

const formatRow = row =>
  Object.entries(row).reduce((acc, [k, v]) => ({ ...acc, [k]: formatJsonValue(v) }), {});

export const dataGenerator = async ({ sequelize }, parameters = {}) => {
  const results = await getData(sequelize, parameters);

  const formattedResults = results.map(formatRow);

  return generateReportFromQueryData(formattedResults, reportColumnTemplate);
};

export const permission = 'Encounter';
