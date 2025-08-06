#!/usr/bin/env node

import { readFile } from 'fs/promises';

const EXCLUDED = [
  // not useful to log
  'SequelizeMeta',
  'socket_io_attachments',

  // deprecated
  'note_items',
  'note_pages',
  'notes_legacy',
  'vitals',

  // write-once tables
  'attachments',
  'encounter_history',
  'lab_request_attachments',
  'lab_request_logs',
  'notes',
  'vital_logs',
];

const START = 'begin;\nselect now() as started;\n\n';
const END =
  '\n\nselect now() as started;\ncommit;\nselect now() as ended;\nselect count(*) from logs.changes;';

function generate(tables) {
  return (
    START +
    tables
      .map(table =>
        `\\echo ${table}
        insert into logs.changes (
          table_oid, table_schema, table_name,
          logged_at, record_created_at, record_updated_at, record_deleted_at,
          updated_at_sync_tick, updated_by_user_id, record_id,
          record_data
        )
        select
          'public.${table}'::regclass::oid as table_oid,
          'public' as table_schema,
          '${table}' as table_name,

          t.updated_at as logged_at,
          coalesce(t.created_at, t.updated_at) as record_created_at,
          coalesce(t.updated_at, t.created_at) as record_updated_at,
          t.deleted_at as record_deleted_at,

          t.updated_at_sync_tick as updated_at_sync_tick,
          uuid_nil() as updated_by_user_id,
          t.id::text as record_id,

          to_jsonb(t) as record_data
        from public.${table} t;
        `
          .trim()
          .replaceAll(/^ {8}/gm, ''),
      )
      .join('\n\n') +
    END
  );
}

const manifest = JSON.parse(await readFile('manifest.json', 'utf-8'));
const tables = Object.values(manifest.sources)
  .filter(
    ({ schema, name, config: { meta } }) =>
      schema === 'public' &&
      !EXCLUDED.includes(name) &&
      meta.triggers?.some(
        trigger => trigger.startsWith('record_') && trigger.endsWith('_changelog'),
      ),
  )
  .map(({ name }) => name);
const sql = generate(tables);
console.log(sql);
