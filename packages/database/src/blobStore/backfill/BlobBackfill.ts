import { Readable } from 'node:stream';
import { QueryTypes, type Sequelize } from 'sequelize';

import { pauseAudit } from '../../utils/audit/pauseAudit';
import type { BlobStore } from '../BlobStore';

// Tables whose rows hold binary content directly. Both gain a hash and give up
// their bytes; nothing else in the schema stores blobs inline.
export const REFERENCE_TABLES = ['attachments', 'assets'] as const;
export type ReferenceTable = (typeof REFERENCE_TABLES)[number];

export interface BackfillProgress {
  /** Reference rows still holding bytes, by table. */
  rows: Record<string, number>;
  /** Changelog entries still holding bytes. */
  changelogEntries: number;
}

export interface BlobBackfillOptions {
  sequelize: Sequelize;
  blobStore: BlobStore;
  /**
   * Which reference tables this server backfills. Central owns both; a facility
   * holds only asset bytes (attachments there push inline and are handled by
   * the outbox), so it passes just `['assets']`. Defaults to both.
   */
  tables?: readonly ReferenceTable[];
}

// spec: BKFL
// Moves legacy in-database content into the blob store. Every step is
// idempotent and derives its own work from the data, so a run that dies part
// way through resumes simply by running again: a row still holding bytes has
// not been moved, and admission by hash absorbs a repeat.
//
// A single blob's bytes are handled whole rather than in slices. Attachment and
// asset content is bounded by the upload limit and the rest of the system
// already loads it whole; batching bounds the job's footprint by processing one
// row at a time, not by splitting a row. Reading or writing a bytea in slices
// would in fact be quadratic, since Postgres re-materialises the whole value per
// slice.
export class BlobBackfill {
  readonly #sequelize: Sequelize;
  readonly #blobStore: BlobStore;
  readonly #tables: readonly ReferenceTable[];

  constructor({ sequelize, blobStore, tables = REFERENCE_TABLES }: BlobBackfillOptions) {
    this.#sequelize = sequelize;
    this.#blobStore = blobStore;
    this.#tables = tables;
  }

  /** The reference tables this instance backfills. */
  get tables(): readonly ReferenceTable[] {
    return this.#tables;
  }

  /**
   * Admit a batch of rows' content and swap each row over to its hash. The
   * bytes reach the store before the row changes, so a crash in between leaves
   * a row that is simply moved again.
   */
  async moveReferenceRows(tableName: ReferenceTable, batchSize: number): Promise<number> {
    const ids = await this.#pendingRowIds(tableName, batchSize);

    let moved = 0;
    for (const id of ids) {
      const { hash } = await this.#admitRowContent(tableName, id);
      // Guarded on hash IS NULL so a concurrent run that moved this row first
      // cannot have its result overwritten; the hash is identical either way,
      // but the guard keeps the count honest.
      const updated = await this.#sequelize.transaction(async () => {
        // A backfilled row differs from its predecessor only in where the
        // bytes live, so logging a near-duplicate entry per moved row would
        // bloat the changelog to no purpose.
        await pauseAudit(this.#sequelize);
        return await this.#sequelize.query<{ id: string }>(
          `
            UPDATE ${tableName} SET hash = $hash, data = NULL
            WHERE id = $id AND hash IS NULL
            RETURNING id
          `,
          { bind: { hash, id }, type: QueryTypes.SELECT },
        );
      });
      moved += updated.length;
    }
    return moved;
  }

  /**
   * Admit a batch of rows' content without touching the rows themselves, for a
   * server whose rows are owned elsewhere and arrive already updated. Content
   * addressing makes the two converge: the same bytes hash the same, so the
   * blob is already local when the updated row lands.
   */
  async seedReferenceRows(
    tableName: ReferenceTable,
    batchSize: number,
    offset = 0,
  ): Promise<number> {
    // Paged by offset, not by consuming the rows: seeding leaves them holding
    // their bytes, so the pending set does not shrink as it is walked. The set
    // shrinks only as central's updated rows arrive.
    const ids = await this.#pendingRowIds(tableName, batchSize, offset);
    for (const id of ids) {
      await this.#admitRowContent(tableName, id);
    }
    return ids.length;
  }

  /**
   * Relocate the content copies held in historical changelog entries. Content
   * that only ever existed in an entry — a superseded asset, say — is
   * preserved by admitting it before the entry gives up its bytes.
   */
  async rewriteChangelogEntries(batchSize: number): Promise<number> {
    const rows = await this.#sequelize.query<{ id: string }>(
      `
        SELECT id FROM logs.changes
        WHERE table_schema = 'public'
          AND table_name IN (:tableNames)
          AND record_data->>'data' IS NOT NULL
        ORDER BY id
        LIMIT :batchSize
      `,
      {
        replacements: { tableNames: [...this.#tables], batchSize },
        type: QueryTypes.SELECT,
      },
    );

    let rewritten = 0;
    for (const { id } of rows) {
      // Entries hold the bytea as Postgres renders it into JSON: the hex format,
      // `\x` then two characters per byte. Decode once, here, rather than inside
      // a streamed read, where the decode would repeat for every slice.
      const entry = await this.#sequelize.query<{ content: Buffer }>(
        `SELECT decode(substring(record_data->>'data' from 3), 'hex') AS content
         FROM logs.changes WHERE id = $id`,
        { bind: { id }, type: QueryTypes.SELECT, plain: true },
      );
      const { hash } = await this.#blobStore.put(Readable.from([entry!.content]));

      // logs.changes carries no triggers, so this rewrite logs nothing itself.
      const updated = await this.#sequelize.query<{ id: string }>(
        `
          UPDATE logs.changes
          SET record_data = jsonb_set(
            jsonb_set(record_data, '{hash}', to_jsonb($hash::text)),
            '{data}', 'null'::jsonb
          )
          WHERE id = $id AND record_data->>'data' IS NOT NULL
          RETURNING id
        `,
        { bind: { hash, id }, type: QueryTypes.SELECT },
      );
      rewritten += updated.length;
    }
    return rewritten;
  }

  /** What is left to do, for operator-visible progress. */
  async countRemaining(): Promise<BackfillProgress> {
    const rows: Record<string, number> = {};
    for (const tableName of this.#tables) {
      const row = await this.#sequelize.query<{ count: string }>(
        `SELECT count(*) AS count FROM ${tableName} WHERE data IS NOT NULL`,
        { type: QueryTypes.SELECT, plain: true },
      );
      rows[tableName] = Number(row?.count ?? 0);
    }

    const entries = await this.#sequelize.query<{ count: string }>(
      `
        SELECT count(*) AS count FROM logs.changes
        WHERE table_schema = 'public'
          AND table_name IN (:tableNames)
          AND record_data->>'data' IS NOT NULL
      `,
      {
        replacements: { tableNames: [...this.#tables] },
        type: QueryTypes.SELECT,
        plain: true,
      },
    );

    return { rows, changelogEntries: Number(entries?.count ?? 0) };
  }

  /**
   * Whether every hash this server references is backed by content it holds.
   * Completion is this, not merely the absence of remaining bytes.
   */
  async findUnbackedHashes(): Promise<string[]> {
    // Table names are the typed reference-table literals, never user input.
    const rowHashSelects = this.#tables
      .map(tableName => `SELECT hash FROM ${tableName} WHERE hash IS NOT NULL`)
      .join('\n          UNION\n          ');
    const rows = await this.#sequelize.query<{ hash: string }>(
      `
        SELECT DISTINCT referenced.hash FROM (
          ${rowHashSelects}
          UNION
          SELECT record_data->>'hash' AS hash FROM logs.changes
          WHERE table_schema = 'public'
            AND table_name IN (:tableNames)
            AND record_data->>'hash' IS NOT NULL
        ) AS referenced
        LEFT JOIN blobs ON blobs.hash = referenced.hash AND blobs.deleted_at IS NULL
        WHERE blobs.hash IS NULL
      `,
      {
        replacements: { tableNames: [...this.#tables] },
        type: QueryTypes.SELECT,
      },
    );
    return rows.map(row => row.hash);
  }

  /**
   * Re-inflate the database from the store, reversing a backfill at any stage.
   * A row that carries a hash has not been rolled back yet, whatever its data
   * column holds, so selection keys only on the hash: bytes and hash move
   * together in one update, leaving no state a resumed pass would skip.
   */
  async rollbackReferenceRows(tableName: ReferenceTable, batchSize: number): Promise<number> {
    const rows = await this.#sequelize.query<{ id: string; hash: string }>(
      `
        SELECT id, hash FROM ${tableName}
        WHERE hash IS NOT NULL
        ORDER BY id
        LIMIT :batchSize
      `,
      { replacements: { batchSize }, type: QueryTypes.SELECT },
    );

    let restored = 0;
    for (const { id, hash } of rows) {
      const content = await this.#readWholeBlob(hash);
      // One update sets the bytes and drops the hash together, so the row is
      // never observable carrying both or neither, and no append rewrites a
      // growing value slice by slice.
      const updated = await this.#sequelize.transaction(async () => {
        await pauseAudit(this.#sequelize);
        return await this.#sequelize.query<{ id: string }>(
          `UPDATE ${tableName} SET data = $data, hash = NULL WHERE id = $id RETURNING id`,
          { bind: { id, data: content }, type: QueryTypes.SELECT },
        );
      });
      restored += updated.length;
    }
    return restored;
  }

  /** Reverse the changelog rewrite, restoring byte snapshots from their hashes. */
  async rollbackChangelogEntries(batchSize: number): Promise<number> {
    const rows = await this.#sequelize.query<{ id: string; hash: string }>(
      `
        SELECT id, record_data->>'hash' AS hash FROM logs.changes
        WHERE table_schema = 'public'
          AND table_name IN (:tableNames)
          AND record_data->>'hash' IS NOT NULL
          AND record_data->>'data' IS NULL
        ORDER BY id
        LIMIT :batchSize
      `,
      {
        replacements: { tableNames: [...this.#tables], batchSize },
        type: QueryTypes.SELECT,
      },
    );

    let restored = 0;
    for (const { id, hash } of rows) {
      const content = await this.#readWholeBlob(hash);
      const updated = await this.#sequelize.query<{ id: string }>(
        `
          UPDATE logs.changes
          SET record_data = jsonb_set(
            jsonb_set(record_data, '{data}', to_jsonb($data::text)),
            '{hash}', 'null'::jsonb
          )
          WHERE id = $id
          RETURNING id
        `,
        { bind: { id, data: `\\x${content.toString('hex')}` }, type: QueryTypes.SELECT },
      );
      restored += updated.length;
    }
    return restored;
  }

  async #pendingRowIds(
    tableName: ReferenceTable,
    batchSize: number,
    offset = 0,
  ): Promise<string[]> {
    const rows = await this.#sequelize.query<{ id: string }>(
      `
        SELECT id FROM ${tableName}
        WHERE data IS NOT NULL AND hash IS NULL
        ORDER BY id
        LIMIT :batchSize OFFSET :offset
      `,
      { replacements: { batchSize, offset }, type: QueryTypes.SELECT },
    );
    return rows.map(row => row.id);
  }

  async #admitRowContent(tableName: ReferenceTable, id: string) {
    const row = await this.#sequelize.query<{ data: Buffer }>(
      `SELECT data FROM ${tableName} WHERE id = $id`,
      { bind: { id }, type: QueryTypes.SELECT, plain: true },
    );
    return await this.#blobStore.put(Readable.from([row!.data]));
  }

  // A restored value goes back as one bytea, so it is read whole; bounded by a
  // single blob's size, which the upload limit caps.
  async #readWholeBlob(hash: string): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of await this.#blobStore.get(hash)) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
