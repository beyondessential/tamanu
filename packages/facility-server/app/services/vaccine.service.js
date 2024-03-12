/** @typedef {import('sequelize').Sequelize} Sequelize */

import { QueryTypes } from 'sequelize';

/**
 *
 * @param {Sequelize} sequelize
 * @param {string} patientId
 * @returns {Promise<{ patientId?: string, scheduledVaccineId?: string, vaccineId?: string, dueDate?: Date, status?: string}[]>}
 *
 */
export const getPatientScheduledVaccines = async (sequelize, patientId) => {
  const result = await sequelize.query(
    `
    with patient_scheduled_vaccines as (
        select
             p.id patient_id,
             sv.id scheduled_vaccine_id,
             sv.vaccine_id,
            case
                when sv.weeks_from_birth_due is null then null
                else ((p.date_of_birth::date) + concat(sv.weeks_from_birth_due ,' week')::interval)
            end vaccine_due,
             sv.weeks_from_last_vaccination_due
        from patients p
        cross join scheduled_vaccines sv
        where p.deleted_at is null
        and p.visibility_status = 'current'
        and p.id = :patientId
        and sv.deleted_at is null
        and sv.visibility_status = 'current'
        -- remove any vaccines without due date
        and (sv.weeks_from_birth_due is not null or sv.weeks_from_last_vaccination_due is not null)
    ),
    patient_administered_vaccines as (
        select e.patient_id, av.scheduled_vaccine_id, av.date administered_date
        from administered_vaccines av
        join encounters e on e.deleted_at is null and e.id = av.encounter_id
        where av.deleted_at is null
        and av.status = 'GIVEN'
    ),
    patient_last_administered_vaccines as (
        select pav.patient_id, psv.vaccine_id, max(pav.administered_date) last_administered_date
        from patient_administered_vaccines pav
        join patient_scheduled_vaccines psv on pav.patient_id = psv.patient_id and pav.scheduled_vaccine_id = psv.scheduled_vaccine_id
        group by pav.patient_id, psv.vaccine_id
    ),
    patient_next_vaccine_details as (
        select
        psv.patient_id ,
        psv.scheduled_vaccine_id,
        psv.vaccine_id,
        psv.vaccine_due,
        --prioritize vaccine_due (weeks_from_birth_due) if defined
        --otherwise use weeks_from_last_vaccination_due
        case
            when psv.vaccine_due is not null then psv.vaccine_due
            else((plav.last_administered_date::date) + concat(psv.weeks_from_last_vaccination_due ,' week')::interval)
        end next_due,
        rank (*) over (partition by psv.patient_id, psv.vaccine_id, pav.scheduled_vaccine_id  order by psv.vaccine_due) = 1 as is_next
        from patient_scheduled_vaccines psv
        left join patient_administered_vaccines pav on pav.patient_id = psv.patient_id and pav.scheduled_vaccine_id = psv.scheduled_vaccine_id
        left join patient_last_administered_vaccines plav on plav.patient_id = psv.patient_id and plav.vaccine_id = psv.vaccine_id
        where pav.scheduled_vaccine_id is null
    ),
    patient_next_vaccines as (
        select pnvd.patient_id, pnvd.scheduled_vaccine_id, pnvd.vaccine_id, extract (day from greatest(pnvd.vaccine_due, pnvd.next_due) - now()) due_date
        from patient_next_vaccine_details pnvd
        where pnvd.is_next = true
    )
    select *,
        (SELECT status FROM vaccine_status_threshold vst WHERE vst.threshold < pnx.due_date ORDER BY vst.threshold DESC LIMIT 1)
    from patient_next_vaccines pnx
    order by pnx.due_date ASC
    `,
    {
      replacements: { patientId },
      type: QueryTypes.SELECT,
    },
  );
  return result;
};
