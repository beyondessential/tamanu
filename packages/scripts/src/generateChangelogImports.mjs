#!/usr/bin/env node

import { dbConfig } from './dbConfig.js';

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

async function getTables() {
  const { client } = await dbConfig('central-server');
  try {
    const { rows } = await client.query(`
  SELECT
    t.table_name as table
  FROM information_schema.tables t
  LEFT JOIN information_schema.triggers triggers
    ON t.table_name = triggers.event_object_table
    AND t.table_schema = triggers.event_object_schema
  WHERE
    t.table_schema = 'public'
    AND t.table_type != 'VIEW'
    AND triggers.trigger_name = substring(concat('record_', lower(t.table_name), '_changelog'), 0, 64) -- Has changelog trigger
    GROUP BY t.table_name -- Group to ensure unique results
  `);
    return rows.map(row => row.table).filter(table => !EXCLUDED.includes(table));
  } finally {
    await client.end();
  }
}

async function generate() {
  return (await getTables())
    .map(table =>
      `
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
        .replaceAll(/^ {4}/gm, ''),
    )
    .join('\n\n');
}

const sql = await generate();
console.log(sql);
