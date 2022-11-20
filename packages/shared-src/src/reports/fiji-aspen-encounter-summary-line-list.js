import { endOfDay, startOfDay, parseISO } from 'date-fns';
import { toDateTimeString } from '../utils/dateTime';
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
  {
    title: 'Time seen following triage/Wait time (hh:mm)',
    accessor: data => data.waitTimeFollowingTriage,
  },
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

const reportColumnTemplate = FIELDS.map(field =>
  typeof field === 'string'
    ? {
        title: field,
        accessor: data => data[field],
      }
    : field,
);

const query = `
with
  notes_info as (
    select
      record_id,
      string_agg(
        concat(
          'Note type: ', note_type,
          ', Content: ', "content",
          ', Note date: ', to_char(ni."date"::timestamp, 'DD-MM-YYYY HH12' || CHR(58) || 'MI AM')
        ),
        '; '
      ) aggregated_notes
    from note_pages np
    join note_items ni on ni.note_page_id = np.id
    group by record_id
  ),
  lab_test_info as (
    select 
      lab_request_id,
      json_agg(ltt.name) tests
    from lab_tests lt
    join lab_test_types ltt on ltt.id = lt.lab_test_type_id 
    group by lab_request_id 
  ),
  lab_request_info as (
    select 
      encounter_id,
      json_agg(
        json_build_object(
          'Test', tests
        )) "Lab requests"
    from lab_requests lr
    join lab_test_info lti
    on lti.lab_request_id  = lr.id
    group by encounter_id
  ),
  procedure_info as (
    select
      encounter_id,
      string_agg(
        concat(
          proc.name,
          ', Date: ', to_char(date::timestamp, 'DD-MM-YYYY'),
          ', Location: ', loc.name,
          ', Notes: ', p.note,
          ', Completed notes: ', completed_note
        ),
        '; '
      ) "Procedures"
    from "procedures" p
    left join reference_data proc ON proc.id = procedure_type_id
    left join locations loc on loc.id = location_id
    group by encounter_id 
  ),
  medications_info as (
    select
      encounter_id,
      string_agg(
        concat(
          medication.name,
          ', Discontinued: ', case when discontinued then 'true' else 'false' end,
          ', Discontinuing reason: ', coalesce(discontinuing_reason, 'null')
        ),
        '; '
      ) "Medications"
    from encounter_medications em
    join reference_data medication on medication.id = em.medication_id
    group by encounter_id
  ),
  diagnosis_info as (
    select
      encounter_id,
      string_agg(
        concat(
          diagnosis.name,
          ', Is primary?: ', case when is_primary then 'primary' else 'secondary' end,
          ', Certainty: ', certainty
        ),
        '; '
      ) "Diagnosis"
    from encounter_diagnoses ed
    join reference_data diagnosis on diagnosis.id = ed.diagnosis_id
    where certainty not in ('disproven', 'error')
    group by encounter_id
  ),
  vaccine_info as (
    select
      encounter_id,
      string_agg(
        concat(
          drug.name,
          ', Label: ', sv.label,
          ', Schedule: ', sv.schedule
        ),
        '; '
      ) "Vaccinations"
    from administered_vaccines av
    join scheduled_vaccines sv on sv.id = av.scheduled_vaccine_id 
    join reference_data drug on drug.id = sv.vaccine_id 
    group by encounter_id
  ),
  area_locations as (
    select 
      id 
    from locations 
    where location_group_id = :location_group_id
  ),
  imaging_areas_by_request as (
    select
      imaging_request_id,
      array_agg(coalesce(area.name, '__UNKNOWN__AREA__') order by area.name) areas_to_be_imaged
    from imaging_request_areas ira
    left join reference_data area on area.id =  ira.area_id
    group by imaging_request_id
  ),
  imaging_info as (
    select
      ir.encounter_id,
      string_agg(
        concat(
          ir.imaging_type,
          ', Areas to be imaged: ', array_to_string(areas_to_be_imaged, '; '),
          ', Notes: ', aggregated_notes
        ),
        '; '
      ) "Imaging requests"
    from imaging_requests ir
    left join notes_info ni on ni.record_id = ir.id
    left join imaging_areas_by_request iabr on iabr.imaging_request_id = ir.id 
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
          'Note date', to_char(ni."date"::timestamp, 'DD-MM-YYYY HH12' || CHR(58) || 'MI AM')
        ) order by ni.date desc
      ) "Notes"
    from note_pages np
    join note_items ni on ni.note_page_id = np.id
    where note_type != 'system'
    group by record_id
  ),
  note_history as (
    select
      record_id encounter_id,
      matched_vals[1] place,
      matched_vals[2] "from",
      matched_vals[3] "to",
      ni.date,
      ni.id
    from note_pages np
    join note_items ni on ni.note_page_id = np.id
    join (
      select
        id,
        regexp_matches(content, 'Changed (.*) from (.*) to (.*)') matched_vals
      from note_items
    ) matched_vals
    on matched_vals.id = ni.id 
    where note_type = 'system'
    and ni.content ~ 'Changed (.*) from (.*) to (.*)'
  ),
  place_history_if_changed as (
    select 
      e.id encounter_id,
      nh.place,
      concat(
        case when max(area_name) is not null then (max(area_name) || ', ') else '' end,
        max(first_from), --first "from" from note
        ', Assigned time: ', to_char(e.start_date::timestamp, 'DD-MM-YYYY HH12' || CHR(58) || 'MI AM')
      ) || '; ' ||
      string_agg(
        concat(
          case when (lgt.name is not null) then (lgt.name || ', ') else '' end,
          "to",
          ', Assigned time: ', to_char(nh.date::timestamp, 'DD-MM-YYYY HH12' || CHR(58) || 'MI AM')
        ),
        '; '
        ORDER BY nh.date
      ) place_history,
      jsonb_build_array(case when nh.place = 'location' then e.location_id else e.department_id end) || jsonb_agg(case when nh.place = 'location' then lf.id else d.id end) place_id_list -- Duplicates here are ok, but not required, as it will be used for searching
    from note_history nh
    join encounters e on nh.encounter_id = e.id
    left join locations lf on lf.name = "from"
    left join departments d on d.name = "from"
    left join locations lt on lt.name = "to"
    left join location_groups lgt on lt.location_group_id = lgt.id
    join (
      with history_partition as (
        select nh2.id, first_value("from") over(
    			partition by encounter_id, place
    			order by nh2."date"
    		) first_from from note_history nh2
      )
    	select
    		encounter_id,
    		place,
        lg.name as area_name,
    		history_partition.first_from as first_from
        from note_history nh2
        join history_partition on nh2.id = history_partition.id
        join locations l2 on l2.name = first_from
        join location_groups lg on l2.location_group_id = lg.id
    ) first_val_table on nh.encounter_id = first_val_table.encounter_id and first_val_table.place = nh.place
    group by e.id, e.start_date, nh.place
  ),
  place_info as (
    select
      e.id encounter_id,
      places.column1 place,
      coalesce(
        place_history,
        concat(
          case when places.column1 = 'location' then concat(case when lg.name is not null then (lg.name || ', ') else '' end, l.name) else d.name end,
          ', Assigned time: ', to_char(e.start_date::timestamp, 'DD-MM-YYYY HH12' || CHR(58) || 'MI AM')
        )
      ) place_history,
      coalesce(
        place_id_list,
        jsonb_build_array(case when places.column1 = 'location' then l.id else d.id end)
      ) place_id_list
    from encounters e
    cross join (values ('location'), ('department')) places
    left join locations l on l.id = e.location_id
    left join location_groups lg on l.location_group_id = lg.id
    left join departments d on d.id = e.department_id
    left join place_history_if_changed ph on ph.encounter_id = e.id and ph.place = places.column1
  ),
  triage_info as (
    select
      encounter_id,
      hours::text || CHR(58) || remaining_minutes::text "waitTimeFollowingTriage"
    from triages t,
    lateral (
      select
        case when t.closed_time is null
          then (extract(EPOCH from now()) - extract(EPOCH from t.triage_time::timestamp))/60
          else (extract(EPOCH from t.closed_time::timestamp) - extract(EPOCH from t.triage_time::timestamp))/60
        end total_minutes
    ) total_minutes,
    lateral (select floor(total_minutes / 60) hours) hours,
    lateral (select floor(total_minutes - hours*60) remaining_minutes) remaining_minutes
  )
select
  p.display_id "Patient ID",
  p.first_name "First name",
  p.last_name "Last name",
  to_char(p.date_of_birth::date, 'DD-MM-YYYY') "Date of birth",
  extract(year from age(p.date_of_birth::timestamp)) "Age",
  p.sex "Sex",
  billing.name "Patient billing type",
  e.id "Encounter ID",
  to_char(e.start_date::timestamp, 'DD-MM-YYYY HH12' || CHR(58) || 'MI AM') "Encounter start date",
  to_char(e.end_date::timestamp, 'DD-MM-YYYY HH12' || CHR(58) || 'MI AM') "Encounter end date",
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
  t.score "Triage category",
  ti."waitTimeFollowingTriage",
  di2.place_history "Department",
  li.place_history "Location",
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
left join triage_info ti on ti.encounter_id = e.id
left join place_info li on li.encounter_id = e.id and li.place = 'location'
left join place_info di2 on di2.encounter_id = e.id and di2.place = 'department'
where e.end_date is not null
and coalesce(billing.id, '-') like coalesce(:billing_type, '%%')
and CASE WHEN :department_id IS NOT NULL THEN di2.place_id_list::jsonb ? :department_id ELSE true end 
and CASE WHEN :location_group_id IS NOT NULL THEN li.place_id_list::jsonb ?| (select array_agg(id) from area_locations) ELSE true end 
AND CASE WHEN :from_date IS NOT NULL THEN e.start_date::timestamp >= :from_date::timestamp ELSE true END
AND CASE WHEN :to_date IS NOT NULL THEN e.start_date::timestamp <= :to_date::timestamp ELSE true END
order by e.start_date desc;
`;

const getData = async (sequelize, parameters) => {
  const { fromDate, toDate, patientBillingType, department, locationGroup } = parameters;

  const queryFromDate = fromDate && toDateTimeString(startOfDay(parseISO(fromDate)));
  const queryToDate = toDate && toDateTimeString(endOfDay(parseISO(toDate)));

  return sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      from_date: queryFromDate ?? null,
      to_date: queryToDate ?? null,
      billing_type: patientBillingType ?? null,
      department_id: department ?? null,
      location_group_id: locationGroup ?? null,
      imaging_area_labels: JSON.stringify({
        xRay: 'X-Ray',
        ctScan: 'CT Scan',
        ecg: 'Electrocardiogram (ECG)',
        mri: 'MRI',
        ultrasound: 'Ultrasound',
        holterMonitor: 'Holter Monitor',
        echocardiogram: 'Echocardiogram',
        mammogram: 'Mammogram',
        endoscopy: 'Endoscopy',
        fluroscopy: 'Fluroscopy',
        angiogram: 'Angiogram',
        colonoscopy: 'Colonoscopy',
        vascularStudy: 'Vascular Study',
        stressTest: 'Treadmill',
      }),
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
