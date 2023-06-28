import { Command } from 'commander';

import { log } from 'shared/services/logging';

import { initDatabase } from '../database';

export async function migrateSystemNotesToEncounterHistory() {
  log.info('Migrating imaging requests...');

  const store = await initDatabase({ testMode: false });
  const { sequelize } = store;

  try {
    await sequelize.query(`
        with
        notes_system as (
            select
                np.id,
                np.record_id,
                np.note_type,
                ni.date,
                ni.content
            from note_pages np
            left join note_items ni on ni.note_page_id = np.id
            where note_type = 'system'
            order by np.record_id, ni.date
        ),
        change_log_historical_partial as (
            select
                e.id as encounter_id,
                case when lag(e.start_date) over w isnull then e.start_date
                    else lag(n.date) over w
                end as start_datetime,
                case when n.content like 'Changed type%' then split_part(right(n.content, -18), ' to ', 1)
                    when lag(n.content) over w like 'Changed type%' then split_part(right(lag(n.content) over w, -18), ' to ', 2)
                end as encounter_type,
                case when n.content like 'Changed location%' then
                        case when split_part(right(n.content, -22), ' to ', 1) like '%, %' then
                            split_part(split_part(right(n.content, -22), ' to ', 1), ', ', 2)
                        else
                            split_part(right(n.content, -22), ' to ', 1)
                        end
                    when lag(n.content) over w like 'Changed location%' then
                        case when split_part(right(n.content, -22), ' to ', 2) like '%,%' then
                            split_part(right(lag(n.content) over w, -22), ' to ', 2)
                        else
                            split_part(split_part(right(lag(n.content) over w, -22), ' to ', 2), ', ', 2)
                        end
                end as location,
                case when n.content like 'Changed department%' then split_part(right(n.content, -24), ' to ', 1)
                    when lag(n.content) over w like 'Changed department%' then split_part(right(lag(n.content) over w, -24), ' to ', 2)
                end as department,
                case when n.content like 'Changed supervising clinician%' then split_part(right(n.content, -35), ' to ', 1)
                    when lag(n.content) over w like 'Changed supervising clinician%' then split_part(right(lag(n.content) over w, -35), ' to ', 2)
                end as examiner,
                n.content
            from notes_system n
            left join encounters e on e.id = n.record_id
            left join locations l on l.id = e.location_id
            left join departments d on d.id = e.department_id
            left join users u on u.id = e.examiner_id
            where n.content like 'Changed%'
            window w as (partition by e.id order by n.date)
        ),
        change_log_complete as (
            select
                encounter_id,
                start_datetime,
                l.facility_id as encounter_facility_id,
                case when log.encounter_type notnull then log.encounter_type
                    else coalesce(
                            (ARRAY_REMOVE(array_agg(log.encounter_type) 
                                over (partition by encounter_id
                                    order by start_datetime desc
                                    rows between
                                    1 following and
                                    unbounded following), null))[1],
                            (ARRAY_REMOVE(array_agg(log.encounter_type)
                                over (partition by encounter_id
                                    order by start_datetime
                                    rows between
                                    1 following and
                                    unbounded following), null))[1],
                            e.encounter_type)
                end as encounter_type,

                case when location notnull then location
                    else coalesce(
                            (ARRAY_REMOVE(array_agg(location) 
                                over (partition by encounter_id
                                    order by start_datetime desc
                                    rows between
                                    1 following and
                                    unbounded following), null))[1],
                            (ARRAY_REMOVE(array_agg(location)
                                over (partition by encounter_id
                                    order by start_datetime
                                    rows between
                                    1 following and
                                    unbounded following), null))[1],
                            l.name)
                end as location,

                case when department notnull then department
                    else coalesce(
                            (ARRAY_REMOVE(array_agg(department) 
                                over (partition by encounter_id
                                    order by start_datetime desc
                                    rows between
                                    1 following and
                                    unbounded following), null))[1],
                            (ARRAY_REMOVE(array_agg(department)
                                over (partition by encounter_id
                                    order by start_datetime
                                    rows between
                                    1 following and
                                    unbounded following), null))[1],
                            d.name)
                end as department,

                case when examiner notnull then examiner
                    else coalesce(
                            (ARRAY_REMOVE(array_agg(examiner) 
                                over (partition by encounter_id
                                    order by start_datetime desc
                                    rows between
                                    1 following and
                                    unbounded following), null))[1],
                            (ARRAY_REMOVE(array_agg(examiner)
                                over (partition by encounter_id
                                    order by start_datetime
                                    rows between
                                    1 following and
                                    unbounded following), null))[1],
                            u.display_name)
                end as examiner
            from change_log_historical_partial log
            left join encounters e on e.id = log.encounter_id
            left join locations l on l.id = e.location_id
            left join departments d on d.id = e.department_id
            left join facilities f on f.id = l.facility_id
            left join users u on u.id = e.examiner_id
        ),
        change_log_latest as (
            select
                DISTINCT ON(record_id)
                content,
                date,
                department_id,
                location_id,
                examiner_id,
                encounter_type,
                record_id
            from notes_system notes
            left join encounters e on notes.record_id = e.id
            left join locations l on l.id = e.location_id
            left join departments d on d.id = e.department_id
            where content like 'Changed%'
            and l.facility_id = d.facility_id
            order by record_id, date desc
        ),
        change_log_with_id as (
            select
                record_id,
                date,
                department_id,
                location_id,
                examiner_id,
                encounter_type
            from change_log_latest
            union
            select
                log.encounter_id,
                log.start_datetime as date,
                d.id as department_id,
                l.id as location_id,
                u.id as examiner_id,
                log.encounter_type
            from change_log_complete log
            left join departments d on d.name = log.department and
                                        d.facility_id = log.encounter_facility_id
            left join locations l on l.name = log.location and
                                    l.facility_id = log.encounter_facility_id
            left join users u on u.display_name = log.examiner
            where d.facility_id = log.encounter_facility_id
            and l.facility_id = log.encounter_facility_id
            and l.name in (select name
                from locations
                where locations.facility_id = l.facility_id
                group by facility_id, name
                having count(*) = 1)
            and d.name in (select name
                from departments
                where departments.facility_id = d.facility_id
                group by facility_id, name
                having count(*) = 1)
            and u.display_name in (select display_name
                from users
                group by display_name
                having count(*) = 1)
            order by record_id, date
        )
        insert into encounter_history(
            encounter_id,
            date,
            department_id,
            location_id,
            examiner_id,
            encounter_type
        )
        select
            record_id,
            date,
            department_id,
            location_id,
            examiner_id,
            encounter_type
        from change_log_with_id
        where record_id not in (select encounter_id from encounter_history);
    `);

    process.exit(0);
  } catch (error) {
    console.log(`Command failed: ${error.stack}\n`);
    log.info(`Command failed: ${error.stack}\n`);
    process.exit(1);
  }
}

export const migrateSystemNotesToEncounterHistoryCommand = new Command(
  'migrateSystemNotesToEncounterHistory',
)
  .description('Migrates system notes to encounter history')
  .action(migrateSystemNotesToEncounterHistory);
