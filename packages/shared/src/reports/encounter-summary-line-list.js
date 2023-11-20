import config from 'config';
import { endOfDay, startOfDay, parseISO } from 'date-fns';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants';
import { toDateTimeString } from '../utils/dateTime';
import { generateReportFromQueryData } from './utilities';

const BASE_FIELDS = [
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
  'Discharge Disposition',
  'Triage Encounter',
  'Inpatient Encounter',
  'Outpatient Encounter',
  'Triage category',
  'Arrival Mode',
  {
    title: 'Time seen following triage/Wait time (hh:mm)',
    accessor: data => data.waitTimeFollowingTriage,
  },
  'Department',
  'Assigned Department',
  'Location',
  'Assigned Location',
  'Reason for encounter',
  'Diagnosis',
  'Medications',
  'Vaccinations',
  'Procedures',
  'Lab requests',
  'Imaging requests',
  'Notes',
];

const getReportColumnTemplate = async (sequelize, includedPatientFieldIds) => {
  const includedPatientFields = await sequelize.query(
    `select id, name from patient_field_definitions where id in (:field_ids)`,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: {
        field_ids: includedPatientFieldIds?.length ? includedPatientFieldIds : null,
      },
    },
  );
  const additionalFields = includedPatientFields.map(({ id, name }) => ({
    title: name,
    accessor: data => data[id],
  }));
  const fields = [...BASE_FIELDS, ...additionalFields];

  return fields.map(field =>
    typeof field === 'string'
      ? {
          title: field,
          accessor: data => data[field],
        }
      : field,
  );
};

const getQuery = includedPatientFieldIds => `
with
  notes_info as (
    select
      record_id,
      string_agg(
        concat(
          'Note type: ', note_type,
          ', Content: ', "content",
          ', Note date: ', to_char(n."date"::timestamp, 'DD-MM-YYYY HH12' || CHR(58) || 'MI AM')
        ),
        '; '
      ) aggregated_notes
    from notes n
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
    where lr.status NOT IN(:lab_request_statuses) 
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
    where ir.status NOT IN ('deleted', 'cancelled', 'entered_in_error')
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
        ) order by ni.date asc
      ) "Notes"
    from notes n
    where note_type != 'system'
    group by record_id
  ),
  note_history as (
    select
      record_id encounter_id,
      matched_vals[1] change_type,
      matched_vals[2] "from",
      matched_vals[3] "to",
      n.date,
      n.id
    from notes n
    join (
      select
        id,
        regexp_matches(content, 'Changed (.*) from (.*) to (.*)') matched_vals
      from notes
    ) matched_vals
    on matched_vals.id = n.id 
    where note_type = 'system'
    and n.content ~ 'Changed (.*) from (.*) to (.*)'
  ),
  first_from_table as (
    select
      encounter_id,
      change_type,
      max(first_from) first_from
    from (
      select
        *,
        first_value("from") over (
            partition by encounter_id, change_type
            order by nh2."date"
        ) first_from
      from note_history nh2
    ) first_from_table
    group by encounter_id, change_type
  ),
  place_history_if_changed as (
    select
      e.id encounter_id,
      nh.change_type place,
      max(first_from) || '; ' || string_agg("to", '; ' ORDER BY nh.date) place_history,
      concat('Assigned time: ', to_char(e.start_date::timestamp, 'DD-MM-YYYY HH12' || CHR(58) || 'MI AM')
      ) || '; ' ||
      string_agg(
        concat(
          'Assigned time: ', to_char(nh.date::timestamp, 'DD-MM-YYYY HH12' || CHR(58) || 'MI AM')
        ),
        '; '
        ORDER BY nh.date
      ) assigned_time_history
    from note_history nh
    join encounters e on nh.encounter_id = e.id
    join first_from_table fft on nh.encounter_id = fft.encounter_id and fft.change_type = nh.change_type
    where nh.change_type in ('location', 'department')
    group by e.id, e.start_date, nh.change_type
  ),
  all_place_ids as (
    select
      e.id encounter_id,
      nh.change_type place,
      jsonb_build_array(
        case when nh.change_type = 'location' then e.location_id else e.department_id end) 
        || jsonb_agg(case when nh.change_type = 'location' then coalesce(lg.id, l.id) else d.id end
      ) place_id_list -- Duplicates here are ok, but not required, as it will be used for searching
    from note_history nh
      join lateral (
        select regexp_matches(nh."from", '([^,]*(?=,\\s))?(?:,\\s)?(.*)') location_matches
      ) as location_matches on true
    join encounters e on nh.encounter_id = e.id
    left join departments d on d.name = "from"
    left join location_groups lg on lg.name = location_matches[1]
    left join locations l on l.name = location_matches[2]
    where change_type in ('location', 'department')
    group by e.id, nh.change_type
  ),
  place_info as (
    select
      e.id encounter_id,
      places.column1 place,
      coalesce(
        place_history,
        case when places.column1 = 'location' then concat(case when lg.name is not null then (lg.name || ', ') else '' end, l.name) else d.name end
      ) place_history,
      coalesce(
        assigned_time_history,
        concat('Assigned time: ', to_char(e.start_date::timestamp, 'DD-MM-YYYY HH12' || CHR(58) || 'MI AM'))
      ) assigned_time_history,
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
    left join all_place_ids place_ids on place_ids.encounter_id = e.id and place_ids.place = places.column1
  ),
  encounter_type_history as (
    select
      e.id encounter_id,
      case "from"
        when 'triage' then  'Triage'
        when 'observation' then  'Active ED patient'
        when 'emergency' then  'Emergency short stay'
        when 'admission' then  'Hospital admission'
        when 'clinic' then 'Clinic'
        when 'imaging' then 'Imaging'
        when 'surveyResponse' then 'Form response'
        else e.encounter_type
      end encounter_type,
      case "from"
        when 'triage' then  'Triage Encounter'
        when 'observation' then  'Triage Encounter'
        when 'emergency' then  'Triage Encounter'
        when 'admission' then  'Inpatient Encounter'
        when 'clinic' then 'Outpatient Encounter'
        when 'imaging' then 'Inpatient Encounter'
        when 'surveyResponse' then 'Inpatient Encounter'
        else 'Inpatient Encounter' -- TODO: check this logic
      end encounter_type_category,
      "date"
    from encounters e
      join lateral (
      select
        "from",
        "date"
      from note_history nh
      where nh.encounter_id = e.id
      and change_type = 'type'
      union all
      select e.encounter_type, e.end_date
    ) type_history on true 
  ),
  encounter_type_info as (
    select distinct
        encounter_id,
        encounter_type_category,
        first_value(encounter_type) over(partition by encounter_id, encounter_type_category order by "date" desc) most_recent_type_for_category
    from encounter_type_history
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
  ),
  additional_field_info as (
    select
      p.id patient_id,
      d.id field_id,
      d.name,
      v.value
    from patients p,
     patient_field_definitions d
	    join lateral (
	      select value
	      from patient_field_values v
	      where v.definition_id = d.id
	        and v.patient_id = p.id
	      -- TODO: order by logical clock
	      order by updated_at desc limit 1
	    ) v on true
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
  discharge_disposition.name "Discharge Disposition",
  tti.most_recent_type_for_category "Triage Encounter",
  iti.most_recent_type_for_category "Inpatient Encounter",
  oti.most_recent_type_for_category "Outpatient Encounter",
  t.score "Triage category",
  arrival_mode.name "Arrival Mode",
  ti."waitTimeFollowingTriage",
  di2.place_history "Department",
  di2.assigned_time_history "Assigned Department",
  li.place_history "Location",
  li.assigned_time_history "Assigned Location",
  e.reason_for_encounter "Reason for encounter",
  di."Diagnosis",
  mi."Medications",
  vi."Vaccinations",
  pi."Procedures",
  lri."Lab requests",
  ii."Imaging requests",
  ni."Notes"
${includedPatientFieldIds.map(fieldId => `,"afi_${fieldId}".value "${fieldId}"`).join('\n')}
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
left join triage_info ti on ti.encounter_id = e.id
left join place_info li on li.encounter_id = e.id and li.place = 'location'
left join place_info di2 on di2.encounter_id = e.id and di2.place = 'department'
left join encounter_type_info tti on tti.encounter_id = e.id and tti.encounter_type_category = 'Triage Encounter'
left join encounter_type_info iti on iti.encounter_id = e.id and iti.encounter_type_category = 'Inpatient Encounter'
left join encounter_type_info oti on oti.encounter_id = e.id and oti.encounter_type_category = 'Outpatient Encounter'
left join discharges discharge on discharge.encounter_id = e.id
left join reference_data discharge_disposition on discharge_disposition.id = discharge.disposition_id
left join triages t on t.encounter_id = e.id
left join reference_data arrival_mode on arrival_mode.id = t.arrival_mode_id
${includedPatientFieldIds
  .map(
    fieldId =>
      `left join additional_field_info "afi_${fieldId}" on "afi_${fieldId}".patient_id = p.id and "afi_${fieldId}".field_id = '${fieldId}'`,
  )
  .join('\n')}
where e.end_date is not null
and coalesce(billing.id, '-') like coalesce(:billing_type, '%%')
and case when :department_id is not null then di2.place_id_list::jsonb ? :department_id else true end 
and case when :location_group_id is not null then li.place_id_list::jsonb ?| (select array_append(array_agg(id), :location_group_id) from area_locations) else true end 
and case when :from_date is not null then e.start_date::timestamp >= :from_date::timestamp else true end
and case when :to_date is not null then e.start_date::timestamp <= :to_date::timestamp else true end
order by e.start_date desc;
`;

const getData = async (sequelize, parameters, includedPatientFieldIds) => {
  const { fromDate, toDate, patientBillingType, department, locationGroup } = parameters;

  const queryFromDate = fromDate && toDateTimeString(startOfDay(parseISO(fromDate)));
  const queryToDate = toDate && toDateTimeString(endOfDay(parseISO(toDate)));

  return sequelize.query(getQuery(includedPatientFieldIds), {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      from_date: queryFromDate ?? null,
      to_date: queryToDate ?? null,
      billing_type: patientBillingType ?? null,
      department_id: department ?? null,
      location_group_id: locationGroup ?? null,
      lab_request_statuses: [
        LAB_REQUEST_STATUSES.DELETED,
        LAB_REQUEST_STATUSES.ENTERED_IN_ERROR,
        LAB_REQUEST_STATUSES.CANCELLED,
      ],
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
  // Note this could be reading from facility config OR central server config
  const includedPatientFieldIds =
    config?.reportConfig?.['encounter-summary-line-list']?.includedPatientFieldIds;

  const results = await getData(sequelize, parameters, includedPatientFieldIds);
  const formattedResults = results.map(formatRow);

  const reportColumnTemplate = await getReportColumnTemplate(sequelize, includedPatientFieldIds);
  return generateReportFromQueryData(formattedResults, reportColumnTemplate);
};
