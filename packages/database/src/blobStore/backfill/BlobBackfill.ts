import { QueryTypes, type Sequelize } from 'sequelize';

import { pauseAudit } from '../../utils/audit/pauseAudit';
import type { BlobStore } from '../BlobStore';
import { readByteaStream, writeByteaFromStream } from './byteaChunks';

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
}

// spec: BKFL
// Moves legacy in-database content into the blob store. Every step is
// idempotent and derives its own work from the data, so a run that dies part
// way through resumes simply by running again: a row still holding bytes has
// not been moved, and admission by hash absorbs a repeat.
export class BlobBackfill {
  readonly #sequelize: Sequelize;
  readonly #blobStore: BlobStore;

  constructor({ sequelize, blobStore }: BlobBackfillOptions) {
    this.#sequelize = sequelize;
    this.#blobStore = blobStore;
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
        replacements: { tableNames: [...REFERENCE_TABLES], batchSize },
        type: QueryTypes.SELECT,
      },
    );

    let rewritten = 0;
    for (const { id } of rows) {
      const source = readByteaStream({
        sequelize: this.#sequelize,
        // Entries hold the bytea as Postgres renders it into JSON: the hex
        // format, `\x` then two characters per byte.
        expression: `decode(substring(record_data->>'data' from 3), 'hex')`,
        where: 'logs.changes WHERE id = $id',
        bind: { id },
      });
      const { hash } = await this.#blobStore.put(source);

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
    for (const tableName of REFERENCE_TABLES) {
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
        replacements: { tableNames: [...REFERENCE_TABLES] },
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
    const rows = await this.#sequelize.query<{ hash: string }>(
      `
        SELECT DISTINCT referenced.hash FROM (
          SELECT hash FROM attachments WHERE hash IS NOT NULL
          UNION
          SELECT hash FROM assets WHERE hash IS NOT NULL
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
        replacements: { tableNames: [...REFERENCE_TABLES] },
        type: QueryTypes.SELECT,
      },
    );
    return rows.map(row => row.hash);
  }

  /**
   * Re-inflate the database from the store, reversing a backfill at any stage.
   * The bytes land before the hash is dropped, so a row interrupted part way
   * through still reads as backfilled and is restored again on the next pass.
   */
  async rollbackReferenceRows(tableName: ReferenceTable, batchSize: number): Promise<number> {
    const rows = await this.#sequelize.query<{ id: string; hash: string }>(
      `
        SELECT id, hash FROM ${tableName}
        WHERE hash IS NOT NULL AND data IS NULL
        ORDER BY id
        LIMIT :batchSize
      `,
      { replacements: { batchSize }, type: QueryTypes.SELECT },
    );

    let restored = 0;
    for (const { id, hash } of rows) {
      const source = await this.#blobStore.get(hash);
      await writeByteaFromStream({
        sequelize: this.#sequelize,
        table: tableName,
        column: 'data',
        id,
        source,
      });
      const updated = await this.#sequelize.transaction(async () => {
        await pauseAudit(this.#sequelize);
        return await this.#sequelize.query<{ id: string }>(
          `UPDATE ${tableName} SET hash = NULL WHERE id = $id RETURNING id`,
          { bind: { id }, type: QueryTypes.SELECT },
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
        replacements: { tableNames: [...REFERENCE_TABLES], batchSize },
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
    const source = readByteaStream({
      sequelize: this.#sequelize,
      expression: 'data',
      where: `${tableName} WHERE id = $id`,
      bind: { id },
    });
    return await this.#blobStore.put(source);
  }

  // A changelog entry's snapshot is one JSON value, so its content has to be
  // whole to go back in; bounded by the largest single blob, not the batch.
  async #readWholeBlob(hash: string): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of await this.#blobStore.get(hash)) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
