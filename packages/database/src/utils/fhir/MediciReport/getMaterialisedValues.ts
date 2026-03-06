import { QueryTypes, Sequelize } from 'sequelize';
import config from 'config';
import { NOTE_TYPES } from '@tamanu/constants';

const REPORT_QUERY = `
with

notes_info as (
  select
    record_id,
    json_agg(
      json_build_object(
        'revisedById', id,
        'noteTypeId', note_type_id,
        'content', "content",
        'noteDate', "date"::timestamp at time zone $timezone_string
      )
    ) aggregated_notes
  from notes
  where note_type_id <> '${NOTE_TYPES.SYSTEM}'
    and record_type in ('LabRequest','ImagingRequest')
    and deleted_at isnull
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
    and lr.deleted_at isnull
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
      and p.deleted_at isnull
  group by encounter_id
),

medications_info as (
  select
    ep.encounter_id,
    json_agg(
      json_build_object(
        'name', medication.name,
        'discontinued', coalesce(prescription.discontinued, false),
        'discontinuedDate', prescription.discontinued_date,
        'discontinuingReason', prescription.discontinuing_reason,
        'isSensitive', coalesce(rd.is_sensitive, false)
      ) order by prescription.date desc
    ) "Medications"
  from encounter_prescriptions ep
  join prescriptions prescription on prescription.id = ep.prescription_id
  join reference_data medication on medication.id = prescription.medication_id
  left join reference_drugs rd on rd.reference_data_id = medication.id
  where ep.encounter_id = $encounter_id
    and ep.deleted_at is null
    and prescription.deleted_at is null
  group by ep.encounter_id
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
  and ed.deleted_at isnull
  group by encounter_id
),

vaccine_info as (
  select
    encounter_id,
    json_agg(
      json_build_object(
        'name', drug.name,
        'label', sv.label,
        'doseLabel', sv.dose_label
      ) order by date desc
    ) "Vaccinations"
  from administered_vaccines av
  join scheduled_vaccines sv on sv.id = av.scheduled_vaccine_id
  join reference_data drug on drug.id = sv.vaccine_id
  where encounter_id = $encounter_id
    and av.deleted_at isnull
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
    and ir.deleted_at isnull
  group by encounter_id
),

-- select encounter notes and also the provide the edit chain of the notes
encounter_notes AS (
  SELECT
    *,
    CASE WHEN revised_by_id IS NULL THEN id ELSE revised_by_id END edit_chain -- assign edit_chain with the id of itself if it is the root note
  FROM notes n
  WHERE record_id = $encounter_id
),

latest_encounter_notes_info as (
  select
    record_id encounter_id,
    json_agg(
      json_build_object(
        'revisedById', edit_chain,
        'noteTypeId', note_type_id,
        'content', "content",
        'noteDate', "date"::timestamp at time zone $timezone_string
      ) order by n.date desc
    ) "Notes"
  from (
    SELECT DISTINCT ON (edit_chain)
    *
    FROM encounter_notes n
    ORDER BY edit_chain, date DESC
  ) n
  where note_type_id <> '${NOTE_TYPES.SYSTEM}'
  and record_id = $encounter_id
  and n.deleted_at isnull
  group by n.record_id
),

department_info as (
  select
        eh.encounter_id,
        json_agg(
          json_build_object('department', d.name,
                            'assignedTime', (case when eh.change_type is null
                                              then e.start_date::timestamp at time zone $timezone_string
                                              else eh.date::timestamp at time zone $timezone_string
                                              end)) order by eh.change_type nulls first, eh.date)
        as department_history
    from encounters e
    join encounter_history eh on eh.encounter_id = e.id
      and eh.deleted_at is null
    left join departments d on d.id = eh.department_id
    where change_type isnull or 'department' = ANY(change_type)
    and e.id = $encounter_id
    and e.deleted_at isnull
    group by eh.encounter_id
),

location_info as (
  select
    eh.encounter_id,
    json_agg(
      json_build_object('location', l.name,
                        'locationGroup', lg.name,
                        'facility', f.name,
                        'assignedTime', ((case when eh.change_type is null
                                            then e.start_date::timestamp at time zone $timezone_string
                                            else eh.date::timestamp at time zone $timezone_string end))) order by eh.change_type nulls first, eh.date)
    as location_history
  from encounters e
  join encounter_history eh on eh.encounter_id = e.id
  and eh.deleted_at is null
  left join locations l on eh.location_id = l.id
  left join location_groups lg on l.location_group_id = lg.id
  left join facilities f on l.facility_id = f.id
  where change_type isnull or 'location' = ANY(change_type)
  and e.id = $encounter_id
  and e.deleted_at isnull
  group by eh.encounter_id
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
  and t.deleted_at isnull
),

discharge_disposition_info as (
  select
    distinct on (encounter_id)
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
  and e.deleted_at isnull
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
  and deleted_at isnull
  group by encounter_id
)

SELECT
p.display_id "patientId",
p.first_name "firstName",
p.last_name "lastName",
p.date_of_birth "dateOfBirth",
extract(year from age(p.date_of_birth::date)) "age",
p.sex "sex",
billing.id "patientBillingId",
billing.name "patientBillingType",
e.id "encounterId",
(e.start_date::timestamp at time zone $timezone_string)::text "encounterStartDate",
(e.end_date::timestamp at time zone $timezone_string)::text "encounterEndDate",
(e.end_date::timestamp at time zone $timezone_string)::text "dischargeDate",
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
    when 'surveyResponse' then 'Survey response'
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
left join latest_encounter_notes_info ni on ni.encounter_id = e.id
left join triages t on t.encounter_id = e.id
left join triage_info ti on ti.encounter_id = e.id
left join location_info li on li.encounter_id = e.id
left join department_info di2 on di2.encounter_id = e.id
left join discharge_disposition_info ddi on ddi.encounter_id = e.id
left join encounter_history_info ehi on e.id = ehi.encounter_id

WHERE e.id = $encounter_id
`;

export const getMaterialisedValues = async (sequelize: Sequelize, upstreamId: string) => {
  const PRIMARY_TIME_ZONE = config?.primaryTimeZone;

  const [upstream] = await sequelize.query(REPORT_QUERY, {
    type: QueryTypes.SELECT,
    bind: {
      encounter_id: upstreamId,
      billing_type: null,
      timezone_string: PRIMARY_TIME_ZONE,
    },
  });

  return {
    lastUpdated: new Date(),
    ...upstream,
  };
};
