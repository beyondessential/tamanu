import { QueryTypes } from 'sequelize';
import config from 'config';

const REPORT_QUERY = `
with

notes_info as (
  select
    record_id,
    json_agg(
      json_build_object(
        'noteType', note_type,
        'content', "content",
        'noteDate', "date"::timestamp at time zone $timezone_string
      ) 
    ) aggregated_notes
  from notes
  where record_id = $encounter_id
  group by record_id
),

lab_test_info as (
  select 
    lab_request_id,
    json_agg(
      json_build_object(
        'name', ltt.name
      )
    ) tests
  from lab_tests lt
  left join lab_test_types ltt on ltt.id = lt.lab_test_type_id
  left join lab_requests lq on lq.id = lt.lab_request_id
  where lq.encounter_id = $encounter_id
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
  left join lab_test_info lti -- include lab requests with no tests (hyperthetical)
  on lti.lab_request_id  = lr.id
  left join notes_info ni on ni.record_id = lr.id
  where encounter_id = $encounter_id
  group by encounter_id
),

procedure_info as (
  select
    encounter_id,
    json_agg(
      json_build_object(
        'name', proc.name,
        'code', proc.code,
        'date', date::timestamp at time zone $timezone_string,
        'location', loc.name,
        'notes', p.note,
        'completedNotes', completed_note
      ) order by date desc
    ) "Procedures"
  from "procedures" p
  left join reference_data proc ON proc.id = procedure_type_id
  left join locations loc on loc.id = location_id
  where encounter_id = $encounter_id
  group by encounter_id
),

medications_info as (
  select
    encounter_id,
    json_agg(
      json_build_object(
        'name', medication.name,
        'discontinued', coalesce(discontinued, false),
        'discontinuedDate', discontinued_date,
        'discontinuingReason', discontinuing_reason
      ) order by date desc
    ) "Medications"
  from encounter_medications em
  join reference_data medication on medication.id = em.medication_id
  where encounter_id = $encounter_id
  group by encounter_id
),

diagnosis_info as (
  select
    encounter_id,
    json_agg(
      json_build_object(
        'name', diagnosis.name,
        'code', diagnosis.code,
        'isPrimary', is_primary,
        'certainty', certainty
      ) order by date desc
    ) "Diagnosis"
  from encounter_diagnoses ed
  join reference_data diagnosis on diagnosis.id = ed.diagnosis_id
  where certainty not in ('disproven', 'error')
  and encounter_id = $encounter_id
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
      ) order by date desc
    ) "Vaccinations"
  from administered_vaccines av
  join scheduled_vaccines sv on sv.id = av.scheduled_vaccine_id 
  join reference_data drug on drug.id = sv.vaccine_id
  where encounter_id = $encounter_id
  group by encounter_id
),

imaging_areas_by_request as (
  select
    imaging_request_id,
    json_agg(coalesce(area.name, '__UNKNOWN__AREA__') order by area.name) areas_to_be_imaged
  from imaging_request_areas ira
  left join imaging_requests ir on ir.id = ira.imaging_request_id
  left join reference_data area on area.id =  ira.area_id
  where encounter_id = $encounter_id
  group by imaging_request_id
),

imaging_info as (
  select
    ir.encounter_id,
    json_agg(
      json_build_object(
        'name', ir.imaging_type,
        'areasToBeImaged', areas_to_be_imaged,
        'notes', to_json(aggregated_notes)
      )
    ) "Imaging requests"
  from imaging_requests ir
  left join notes_info ni on ni.record_id = ir.id::varchar
  left join imaging_areas_by_request iabr on iabr.imaging_request_id = ir.id 
  where encounter_id = $encounter_id
  group by encounter_id
),

-- Note this will include non-encounter notes - but they won't join anywhere because we use uuids
encounter_notes_info as (
  select
    record_id encounter_id,
    json_agg(
      json_build_object(
        'noteType', note_type,
        'content', "content",
        'noteDate', "date"::timestamp at time zone $timezone_string
      ) order by n.date desc
    ) "Notes"
  from notes n
  where note_type != 'system'
  and record_id = $encounter_id
  group by record_id
),

note_history as (
  select
    record_id encounter_id,
    matched_vals[1] place,
    matched_vals[2] "from",
    matched_vals[3] "to",
    n.date
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

department_info as (
  select 
    e.id encounter_id,
    case when count("from") = 0
      then json_build_array(json_build_object(
        'department', d.name,
        'assignedTime', e.start_date::timestamp at time zone $timezone_string
      ))
      else 
        array_to_json(json_build_object(
          'department', first_from, --first "from" from note
          'assignedTime', e.start_date::timestamp at time zone $timezone_string
        ) ||
        array_agg(
          json_build_object(
            'department', "to",
            'assignedTime', nh.date::timestamp at time zone $timezone_string
          ) ORDER BY nh.date
        ))
    end department_history
  from encounters e
  left join departments d on e.department_id = d.id
  left join note_history nh
  on nh.encounter_id = e.id and nh.place = 'department'
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
  where e.id = $encounter_id
  group by e.id, d.name, e.start_date, first_from
),

location_info as (
  select 
    e.id encounter_id,
    case when count("from") = 0
      then json_build_array(json_build_object(
        'location', coalesce(lg.name || ', ', $encounter_id ) || l.name,
        'assignedTime', e.start_date::timestamp at time zone $timezone_string
      ))
      else
        json_build_array(json_build_object(
          'location', coalesce(lg.name || ', ', $encounter_id ) || l.name,
          'assignedTime', MAX(nh.date::timestamp at time zone $timezone_string)
        ))
    end location_history
  from encounters e
  left join locations l on e.location_id = l.id
  left join location_groups lg on l.location_group_id = lg.id
  left join note_history nh
  on nh.encounter_id = e.id and nh.place = 'location'
  where e.id = $encounter_id
  group by e.id, l.name, lg.name, e.start_date
),

triage_info as (
  select
    encounter_id,
    hours::text || CHR(58) || remaining_minutes::text "waitTimeFollowingTriage"
  from triages t,
  lateral (
    select
      case when t.closed_time is null
        then (extract(EPOCH from now()) - extract(EPOCH from t.triage_time::timestamp))/60 -- NOTE: Timezone bug here, where now() is server timezone but triage_time is local timezone
        else (extract(EPOCH from t.closed_time::timestamp) - extract(EPOCH from t.triage_time::timestamp))/60
      end total_minutes
  ) total_minutes,
  lateral (select floor(total_minutes / 60) hours) hours,
  lateral (select floor(total_minutes - hours*60) remaining_minutes) remaining_minutes
  where encounter_id = $encounter_id
),

discharge_disposition_info as (
  select
    encounter_id,
    json_build_object(
      'code', disposition.code,
      'name', disposition.name
    ) "encounterDischargeDisposition"
  from encounters e
  join discharges d on d.id =
   (SELECT id
        FROM discharges
        WHERE encounter_id = $encounter_id
        order by updated_at desc
        LIMIT 1)
  join reference_data disposition on disposition.id = d.disposition_id
  where encounter_id = $encounter_id
),

encounter_history_info as (
  select
    encounter_id,
    json_agg(
      json_build_object(
        'type', case encounter_type
                  when 'admission' then 'AR-DRG'
                  when 'imaging' then 'AR-DRG'
                  when 'emergency' then 'URG/UDG'
                  when 'observation' then 'URG/UDG'
                  when 'triage' then 'URG/UDG'
                  when 'surveyResponse' then 'URG/UDG'
                  when 'clinic' then 'SOPD'
                  else encounter_type
                end,
        'startDate', date::timestamp at time zone $timezone_string
      ) order by date
    ) "Encounter history"
  from encounter_history
  where encounter_id = $encounter_id
  group by encounter_id
)

SELECT
p.display_id "patientId",
p.first_name "firstName",
p.last_name "lastName",
p.date_of_birth "dateOfBirth",
extract(year from age(p.date_of_birth::date)) "age",
p.sex "sex",
billing.name "patientBillingType",
e.id "encounterId",
e.start_date::timestamp at time zone $timezone_string "encounterStartDate",
e.end_date::timestamp at time zone $timezone_string "encounterEndDate",
e.end_date::timestamp at time zone $timezone_string "dischargeDate",
ehi."Encounter history" "encounterType",
birth_data.birth_weight "weight",
0 "hoursOfVentilation",
0 "leaveDays",
case e.encounter_type
    when 'triage' then  'Triage'
    when 'observation' then  'Active ED patient'
    when 'emergency' then  'Emergency short stay'
    when 'admission' then  'Hospital admission'
    when 'clinic' then 'Clinic'
    when 'imaging' then 'Imaging'
    when 'surveyResponse' then 'Form response'
    else e.encounter_type
end "visitType",
ddi."encounterDischargeDisposition" "episodeEndStatus",
ddi."encounterDischargeDisposition",
t.score "triageCategory",
ti."waitTimeFollowingTriage" "waitTime",
di2.department_history "departments",
li.location_history "locations",
e.reason_for_encounter "reasonForEncounter",
di."Diagnosis" diagnoses,
mi."Medications" medications,
vi."Vaccinations" vaccinations,
pi."Procedures" as "procedures",
lri."Lab requests" "labRequests",
ii."Imaging requests" "imagingRequests",
ni."Notes" notes

from patients p
join encounters e on e.patient_id = p.id
left join reference_data billing on billing.id = e.patient_billing_type_id
left join patient_birth_data birth_data on birth_data.patient_id = p.id
left join medications_info mi on e.id = mi.encounter_id
left join vaccine_info vi on e.id = vi.encounter_id
left join diagnosis_info di on e.id = di.encounter_id
left join procedure_info pi on e.id = pi.encounter_id
left join lab_request_info lri on lri.encounter_id = e.id
left join imaging_info ii on ii.encounter_id = e.id
left join encounter_notes_info ni on ni.encounter_id = e.id
left join triages t on t.encounter_id = e.id
left join triage_info ti on ti.encounter_id = e.id
left join location_info li on li.encounter_id = e.id
left join department_info di2 on di2.encounter_id = e.id
left join discharge_disposition_info ddi on ddi.encounter_id = e.id
left join encounter_history_info ehi on e.id = ehi.encounter_id

WHERE e.id = $encounter_id
`;

export const getMaterialisedValues = async (sequelize, upstreamId) => {
  const COUNTRY_TIMEZONE = config?.countryTimeZone;

  const [upstream] = await sequelize.query(REPORT_QUERY, {
    type: QueryTypes.SELECT,
    bind: {
      encounter_id: upstreamId,
      billing_type: null,
      timezone_string: COUNTRY_TIMEZONE,
    },
  });

  return upstream;
};
