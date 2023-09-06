import { Command } from 'commander';

import { sleepAsync } from '@tamanu/shared/utils/sleepAsync';
import { log } from 'shared/services/logging';

import { initDatabase } from '../database';

const LATEST_ENCOUNTER_FLAG = 'latest_encounter';

export async function migrateChangelogNotesToEncounterHistory(options = {}) {
  const { batchSize = Number.MAX_SAFE_INTEGER } = options;
  log.info(`Migrating changelog notes with options:`, options);

  const store = await initDatabase({ testMode: false });
  const { sequelize } = store;

  try {
    let fromId = '';

    while (fromId != null) {
      const [[{ maxId }]] = await sequelize.query(
        `
        with

        -- For batching by encounters
        batch_encounters as (
            select * from encounters
            where id > :fromId
            order by id
            limit :limit
        ),

        -- Get all the changelog notes with content starts by 'Changed%'
        all_encounter_notes_system as (
            select
                np.id,
                np.record_id,
                np.note_type,
                ni.date,
                ni.content
            from note_pages np
            left join note_items ni on ni.note_page_id = np.id
            join batch_encounters e on np.record_id = e.id
            where note_type = 'system'
            and record_type = 'Encounter'
            order by np.record_id, ni.date
        ),

        encounter_changed_notes_system as (
            select * 
            from all_encounter_notes_system
            where content like 'Changed%'
        ),

        -- Choose the locations unique within a location group that
        -- 1. If there are duplicated locations with the same name in a location group, and all of their visibility_status = current, choose the last updated_one
        -- 2. If there are duplicated locations with the same name in a location group, and there is 1 with visibility_status = current, choose the current one
        -- 3. If there are duplicated locations with the same name in a location group, and all of their visibility_status = historical, choose the last updated one
        unique_locations_by_location_group as (
            select id, name, location_group_id, facility_id
            from (
                select id, name, location_group_id, facility_id, visibility_status,
                  row_number() over (partition by name, location_group_id, facility_id
                                    order by case when visibility_status = 'current' then 0 else 1 end, updated_at desc) AS row_num
                FROM locations
            ) ordered
            where ordered.row_num = 1
        ),

        -- Choose the departments unique within a facility that
        -- 1. If there are duplicated departments with the same name in a facility, and all of their visibility_status = current, choose the last updated_one
        -- 2. If there are duplicated departments with the same name in a facility, and there is 1 with visibility_status = current, choose the current one
        -- 3. If there are duplicated departments with the same name in a facility, and all of their visibility_status = historical, choose the last updated one
        unique_departments_by_facility as (
            select id, name, facility_id
            from (
                select id, name, facility_id, visibility_status,
                  row_number() over (partition by name, facility_id
                                    order by case when visibility_status = 'current' then 0 else 1 end, updated_at desc) AS row_num
                FROM departments
            ) ordered
            where ordered.row_num = 1
        ),

        -- Choose the unique globally. If there are duplicated users with the same name, choose the last updated_one
        unique_users as (
            select id, display_name
            from (
                select id, display_name,
                  row_number() over (partition by display_name order by updated_at desc) AS row_num
                FROM users
            ) ordered
            where ordered.row_num = 1
        ),

        -- Generate a encounter_history structure record for each changelog
        change_log_historical_partial as (
            select
                e.id as encounter_id,
                -- For the encounter_history when the encounter is first created:
                -- 1. If encounter.start_date is before the first changelog.date, pick encounter.start_date as "date"
                -- 2. If encounter.start_date is after the first changelog's date, pick the changelog's date minus 1 day as "date"
                -- This is to preserve the order of the encounter history
                case 
                    when lag(e.start_date) over w isnull and e.start_date::timestamp > n.date::timestamp
                        then to_char(n.date::timestamp - interval '1 day', 'YYYY-MM-DD HH24:MI:SS')
                    when lag(e.start_date) over w isnull and e.start_date::timestamp < n.date::timestamp
                        then e.start_date
                    else lag(n.date) over w
                end as start_datetime,

                -- Encounter type column
                case when n.content like 'Changed type%' then split_part(right(n.content, -18), ' to ', 1)
                    when lag(n.content) over w like 'Changed type%' then split_part(right(lag(n.content) over w, -18), ' to ', 2)
                end as encounter_type,

                -- Location column
                case when n.content like 'Changed location%' then
                        -- Some historical location changelog did not include location group.
                        -- So checking for ',' to handle the case
                        case when split_part(right(n.content, -22), ' to ', 1) like '%, %' then
                            -- get the {from} location part before 'to' (index 1) = {location_group, location}, then get the location part after ',' (index 2)
                            split_part(split_part(right(n.content, -22), ' to ', 1), ', ', 2)
                        else
                            split_part(right(n.content, -22), ' to ', 1)
                        end
                    when lag(n.content) over w like 'Changed location%' then
                        -- Some historical location changelog did not include location group.
                        -- So checking for ',' to handle the case
                        case when split_part(right(lag(n.content) over w, -22), ' to ', 2) like '%,%' then
                            -- get the {to} location part before 'to' (index 2) = {location_group, location}, then get the location part after ',' (index 2)
                            split_part(split_part(right(lag(n.content) over w, -22), ' to ', 2), ', ', 2)
                        else
                            split_part(right(lag(n.content) over w, -22), ' to ', 2)
                        end
                end as location_name,

                -- Location group column
                case when n.content like 'Changed location%' then
                        -- Some historical location changelog did not include location group.
                        -- So checking for ',' to handle the case
                        case when split_part(right(n.content, -22), ' to ', 1) like '%, %' then
                            -- get the {from} location_group part after 'to' (index 1) = {location_group, location}, then get the location_group part before ',' (index 1)
                            split_part(split_part(right(n.content, -22), ' to ', 1), ', ', 1)
                        else
                            'non_determined_location_group_name'
                        end
                    when lag(n.content) over w like 'Changed location%' then
                        -- Some historical location changelog did not include location group.
                        -- So checking for ',' to handle the case
                        case when split_part(right(lag(n.content) over w, -22), ' to ', 2) like '%,%' then
                            -- get the {to} location_group part after 'to' (index 2) = {location_group, location}, then get the location_group part before ',' (index 1)
                            split_part(split_part(right(lag(n.content) over w, -22), ' to ', 2), ', ', 1)
                        else
                            'non_determined_location_group_name'
                        end
                end as location_group_name,

                -- Department column
                case when n.content like 'Changed department%' then split_part(right(n.content, -24), ' to ', 1)
                    when lag(n.content) over w like 'Changed department%' then split_part(right(lag(n.content) over w, -24), ' to ', 2)
                end as department_name,

                -- Examiner column
                case when n.content like 'Changed supervising clinician%' then split_part(right(n.content, -35), ' to ', 1)
                    when lag(n.content) over w like 'Changed supervising clinician%' then split_part(right(lag(n.content) over w, -35), ' to ', 2)
                end as examiner_name,
                n.content
            from encounter_changed_notes_system n
            left join batch_encounters e on e.id = n.record_id
            left join locations l on l.id = e.location_id
            left join departments d on d.id = e.department_id
            left join users u on u.id = e.examiner_id
            window w as (partition by e.id order by n.date)
        ),

        -- Traverse the change_log_historical_partial results and fill in
        -- the fields that are empty based on the following or preceding rows
        change_log_historical_complete as (
            select
                encounter_id,
                start_datetime,
                l.facility_id as encounter_facility_id,
                case when log.encounter_type notnull then log.encounter_type
                    -- Fill in empty encounter_type by working out the next non null encounter type in the subsequent changelog records,
                    -- Or the previous non null encounter_type in the previous changelog records
                    else coalesce(
                            -- Would have used last_value(ignore nulls) if Postgres supports it
                            -- So have to do this hack (array_remove(nulls)) to get the last non null value from the the range
                            (array_remove(array_agg(log.encounter_type) 
                                over (partition by encounter_id
                                    order by start_datetime desc
                                    rows between
                                    1 following and
                                    unbounded following), null))[1],
                            -- Would have used first_value(ignore nulls) if Postgres supports it
                            -- So have to do this hack (array_remove(nulls)) to get the first non null value from the the range
                            (array_remove(array_agg(log.encounter_type)
                                over (partition by encounter_id
                                    order by start_datetime
                                    rows between
                                    1 following and
                                    unbounded following), null))[1],
                            e.encounter_type)
                end as encounter_type,

                case when location_name notnull then location_name
                    else coalesce(
                            (array_remove(array_agg(location_name) 
                                over (partition by encounter_id
                                    order by start_datetime desc
                                    rows between
                                    1 following and
                                    unbounded following), null))[1],
                            (array_remove(array_agg(location_name)
                                over (partition by encounter_id
                                    order by start_datetime
                                    rows between
                                    1 following and
                                    unbounded following), null))[1],
                            -- Flag to indicate that we should use latest encounter's location here
                            -- Have to use a flag instead of just populating the ids here because this sub query is for extracting names from changelog only.
                            -- Having a mix of ids and names will cause more complexity later when extracting the ids from the names.
                            '${LATEST_ENCOUNTER_FLAG}')
                end as location_name,

                case when location_group_name notnull then location_group_name
                    else coalesce(
                            (array_remove(array_agg(location_group_name) 
                                over (partition by encounter_id
                                    order by start_datetime desc
                                    rows between
                                    1 following and
                                    unbounded following), null))[1],
                            (array_remove(array_agg(location_group_name)
                                over (partition by encounter_id
                                    order by start_datetime
                                    rows between
                                    1 following and
                                    unbounded following), null))[1])
                end as location_group_name,

                case when department_name notnull then department_name
                    else coalesce(
                            (array_remove(array_agg(department_name) 
                                over (partition by encounter_id
                                    order by start_datetime desc
                                    rows between
                                    1 following and
                                    unbounded following), null))[1],
                            (array_remove(array_agg(department_name)
                                over (partition by encounter_id
                                    order by start_datetime
                                    rows between
                                    1 following and
                                    unbounded following), null))[1],
                            '${LATEST_ENCOUNTER_FLAG}')
                end as department_name,

                case when examiner_name notnull then examiner_name
                    else coalesce(
                            (array_remove(array_agg(examiner_name) 
                                over (partition by encounter_id
                                    order by start_datetime desc
                                    rows between
                                    1 following and
                                    unbounded following), null))[1],
                            (array_remove(array_agg(examiner_name)
                                over (partition by encounter_id
                                    order by start_datetime
                                    rows between
                                    1 following and
                                    unbounded following), null))[1],
                            '${LATEST_ENCOUNTER_FLAG}')
                end as examiner_name
            from change_log_historical_partial log
            left join batch_encounters e on e.id = log.encounter_id
            left join locations l on l.id = e.location_id
            left join departments d on d.id = e.department_id
            left join facilities f on f.id = l.facility_id
            left join users u on u.id = e.examiner_id
        ),
        -- Generate encounter_history structure records for the latest change of the encounter
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
            from encounter_changed_notes_system notes
            join batch_encounters e on notes.record_id = e.id
            left join locations l on l.id = e.location_id
            left join departments d on d.id = e.department_id
            where l.facility_id = d.facility_id
            order by record_id, date desc
        ),
        -- Generate encounter_history structure records for encounter's state when they are first created
        changelog_encounter_created as (
            select
                DISTINCT ON(e.id)
                e.id as record_id,
                start_date as date,
                department_id,
                location_id,
                examiner_id,
                encounter_type
            from batch_encounters e
            left join encounter_changed_notes_system n on e.id = n.record_id
            left join locations l on l.id = e.location_id
            left join departments d on d.id = e.department_id
            where n.id isnull
            order by e.id, date
        ),
        change_log_with_id as (
            -- Changelog when encounters are first created
            select
                record_id,
                date,
                department_id,
                location_id,
                examiner_id,
                encounter_type
            from changelog_encounter_created
            union
        
            -- Changelog when encounters are changed to the latest
            select
                record_id,
                date,
                department_id,
                location_id,
                examiner_id,
                encounter_type
            from change_log_latest
            union

            -- Changelog when encounters are changed in between
            select distinct
                log.encounter_id as record_id,
                log.start_datetime as date,
                case 
                    when d.id notnull then d.id 
                    when log.department_name = '${LATEST_ENCOUNTER_FLAG}' then e.department_id
                end as department_id,
                case 
                    when l.id notnull then l.id 
                    when log.location_name = '${LATEST_ENCOUNTER_FLAG}' then e.location_id
                end as location_id,
                case 
                    when u.id notnull then u.id 
                    when log.examiner_name = '${LATEST_ENCOUNTER_FLAG}' then e.examiner_id
                end as examiner_id,
                log.encounter_type
            from change_log_historical_complete log
            left join unique_departments_by_facility d on d.name = log.department_name and
                                    d.facility_id = log.encounter_facility_id
            left join location_groups lg on lg.name = log.location_group_name and
                                        lg.facility_id = log.encounter_facility_id
            left join unique_locations_by_location_group l on l.name = log.location_name and
                                    case when lg.id notnull and log.location_group_name <> 'non_determined_location_group_name' then l.location_group_id = lg.id else true end and
                                    l.facility_id = log.encounter_facility_id
            left join unique_users u on u.display_name = log.examiner_name
            left join batch_encounters e on e.id = log.encounter_id
            where 
                case 
                    -- if we know that it should be latest encounter then don't bother verifying the facility_id
                    when log.department_name <> '${LATEST_ENCOUNTER_FLAG}' 
                        then d.facility_id = log.encounter_facility_id 
                    else true 
                end
            and case 
                    -- if we know that it should be latest encounter then don't bother verifying the facility_id
                    when log.location_name <> '${LATEST_ENCOUNTER_FLAG}' 
                        then l.facility_id = log.encounter_facility_id 
                else true
             end
            -- This is to filter the case where there are multiple location 
            -- with the same names out of the changelog, same as departments and users
            order by record_id, date
        ),
        inserted as (
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
            where not exists (select encounter_id from encounter_history where encounter_id = record_id)
            and location_id notnull and department_id notnull and examiner_id notnull
            returning encounter_id
        )
        select max(encounter_id) as "maxId"
        from inserted;
    `,
        {
          replacements: {
            fromId,
            limit: batchSize,
          },
        },
      );

      fromId = maxId;

      log.info(`Migrated changelog of ${batchSize} batch_encounters...`);

      await sleepAsync(50);
    }

    process.exit(0);
  } catch (error) {
    log.info(`Command failed: ${error.stack}\n`);
    process.exit(1);
  }
}

export const migrateChangelogNotesToEncounterHistoryCommand = new Command(
  'migrateChangelogNotesToEncounterHistory',
)
  .description('Migrates changelog notes to encounter history')
  .option('-b, --batchSize <number>', 'Batching size for migrating changelog notes')

  .action(migrateChangelogNotesToEncounterHistory);
