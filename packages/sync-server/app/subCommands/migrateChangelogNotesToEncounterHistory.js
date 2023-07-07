import { Command } from 'commander';

import { log } from 'shared/services/logging';

import { initDatabase } from '../database';
import { sleepAsync } from '../../../shared/src/utils/sleepAsync';

export async function migrateChangelogNotesToEncounterHistory({
  limit = Number.MAX_SAFE_INTEGER,
} = {}) {
  log.info(`Migrating changelog notes with batch size ${limit} ...`);

  const store = await initDatabase({ testMode: false });
  const { sequelize } = store;

  try {
    let fromId = '';

    while (fromId != null) {
      const [[{ maxId }]] = await sequelize.query(
        `
        with
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
            where note_type = 'system'
            and record_type = 'Encounter'
            and np.record_id > :fromId
            order by np.record_id, ni.date
            limit :limit
        ),

        encounter_changed_notes_system as (
            select * 
            from all_encounter_notes_system
            where content like 'Changed%'
        ),

        unique_location_names_in_location_groups as (
            select name, location_group_id, facility_id
            from locations
            group by facility_id, location_group_id, name
            having count(*) = 1
        ),

        unique_location_names_in_facility as (
            select name, facility_id
            from locations
            group by facility_id, name
            having count(*) = 1
        ),

        unique_department_names as (
            select name, facility_id
            from departments
            group by facility_id, name
            having count(*) = 1
        ),

        unique_user_names as (
            select display_name
            from users
            group by display_name
            having count(*) = 1
        ),

        -- Generate a encounter_history structure record for each changelog
        change_log_historical_partial as (
            select
                e.id as encounter_id,
                case when lag(e.start_date) over w isnull then e.start_date
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
            left join encounters e on e.id = n.record_id
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
                            l.name)
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
                            d.name)
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
                            u.display_name)
                end as examiner_name
            from change_log_historical_partial log
            left join encounters e on e.id = log.encounter_id
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
            left join encounters e on notes.record_id = e.id
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
            from encounters e
            left join all_encounter_notes_system n on e.id = n.record_id
            left join locations l on l.id = e.location_id
            left join departments d on d.id = e.department_id
            where n.id isnull or content not like 'Changed%'
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
            -- Changelog when encounters are changed in between
            select
                record_id,
                date,
                department_id,
                location_id,
                examiner_id,
                encounter_type
            from change_log_latest
            union
            -- Changelog when encounters are changed to the latest
            select
                log.encounter_id as record_id,
                log.start_datetime as date,
                case when exists (select name 
                                from unique_department_names uniques
                                where name = d.name
                                and d.facility_id = uniques.facility_id)
                        then 
                            d.id
                        else 
                            'department-Placeholder'
                    end as department_id,
                case when (lg.id notnull and 
                            log.location_group_name <> 'non_determined_location_group_name' and
                            exists (select uniques.name 
                                    from unique_location_names_in_location_groups uniques 
                                    where uniques.name = l.name 
                                    and lg.id = uniques.location_group_id)) 
                        or 
                            exists (select name 
                                from unique_location_names_in_facility uniques
                            where name = l.name
                                and l.facility_id = uniques.facility_id)
                        then l.id
                    else
                        'location-Placeholder'
                    end as location_id,
                case when exists (select display_name 
                                from unique_user_names
                                where display_name = u.display_name)
                        then 
                            u.id
                        else 
                            'user-Placeholder'
                    end as examiner_id,
                log.encounter_type
            from change_log_historical_complete log
            left join departments d on d.name = log.department_name and
                                    d.facility_id = log.encounter_facility_id
            left join location_groups lg on lg.name = log.location_group_name and
                                        lg.facility_id = log.encounter_facility_id
            left join locations l on l.name = log.location_name and
                                    case when lg.id notnull and log.location_group_name <> 'non_determined_location_group_name' then l.location_group_id = lg.id else true end and
                                    l.facility_id = log.encounter_facility_id
            left join users u on u.display_name = log.examiner_name
            where d.facility_id = log.encounter_facility_id
            and l.facility_id = log.encounter_facility_id
            -- This is to filter the case where there are multiple location 
            -- with the same names out of the changelog, same as departments and users
            group by 
                record_id,
                date,
                department_id,
                location_id,
                examiner_id,
                encounter_type
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
            where record_id not in (select encounter_id from encounter_history)
            returning encounter_id
        )
        select max(encounter_id) as "maxId"
        from inserted;
    `,
        {
          replacements: {
            fromId,
            limit,
          },
        },
      );

      fromId = maxId;

      log.info(`Migrated changelog of ${limit} encounters...`);

      sleepAsync(50);
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
  .option('-l, --limit <number>', 'Batching size for migrating changelog notes')
  .action(migrateChangelogNotesToEncounterHistory);
