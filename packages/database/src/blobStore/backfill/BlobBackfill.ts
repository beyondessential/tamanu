import { Readable } from 'node:stream';
import { QueryTypes, type Sequelize } from 'sequelize';

import { pauseAudit } from '../../utils/audit/pauseAudit';
import type { BlobStore } from '../BlobStore';

export const REFERENCE_TABLES = ['attachments', 'assets'] as const;
export type ReferenceTable = (typeof REFERENCE_TABLES)[number];

export interface BackfillProgress {
  rows: Record<string, number>;
  changelogEntries: number;
}

export interface BlobBackfillOptions {
  sequelize: Sequelize;
  blobStore: BlobStore;
  /** A facility passes `['assets']`: its attachments push inline through the outbox. */
  tables?: readonly ReferenceTable[];
}

// spec: BKFL
// Every step derives its work from the data, so a run that dies resumes by running again. A row's
// bytes are handled whole: slicing a bytea is quadratic, since Postgres re-materialises the value
// per slice.
export class BlobBackfill {
  readonly #sequelize: Sequelize;
  readonly #blobStore: BlobStore;
  readonly #tables: readonly ReferenceTable[];

  constructor({ sequelize, blobStore, tables = REFERENCE_TABLES }: BlobBackfillOptions) {
    this.#sequelize = sequelize;
    this.#blobStore = blobStore;
    this.#tables = tables;
  }

  get tables(): readonly ReferenceTable[] {
    return this.#tables;
  }

  /**
   * Bytes reach the store before the row changes, so a crash in between leaves a row that is simply
   * moved again.
   */
  async moveReferenceRows(tableName: ReferenceTable, batchSize: number): Promise<number> {
    const ids = await this.#pendingRowIds(tableName, batchSize);

    let moved = 0;
    for (const id of ids) {
      const admitted = await this.#admitRowContent(tableName, id);
      if (!admitted) continue; // row deleted between select and read
      const { hash } = admitted;
      // Guarded on hash IS NULL so a concurrent run's count stays honest.
      const updated = await this.#sequelize.transaction(async () => {
        // Moving the bytes isn't worth a changelog entry per row.
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
   * For a server whose rows arrive already updated from elsewhere; content addressing makes the two
   * converge.
   */
  async seedReferenceRows(
    tableName: ReferenceTable,
    batchSize: number,
    offset = 0,
  ): Promise<number> {
    // Paged by offset: seeding leaves the rows holding their bytes, so the pending set doesn't
    // shrink as it's walked.
    const ids = await this.#pendingRowIds(tableName, batchSize, offset);
    for (const id of ids) {
      await this.#admitRowContent(tableName, id);
    }
    return ids.length;
  }

  /** Content that only ever existed in an entry is admitted before the entry gives up its bytes. */
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
      // Entries hold the bytea as Postgres renders it into JSON: `\x` then hex.
      const entry = await this.#sequelize.query<{ content: Buffer | null }>(
        `SELECT decode(substring(record_data->>'data' from 3), 'hex') AS content
         FROM logs.changes WHERE id = $id AND record_data->>'data' IS NOT NULL`,
        { bind: { id }, type: QueryTypes.SELECT, plain: true },
      );
      // Gone, or rewritten concurrently: skip rather than store an empty blob under the wrong hash.
      if (!entry?.content) continue;
      const { hash } = await this.#blobStore.put(Readable.from([entry.content]));

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

  async countRemaining(): Promise<BackfillProgress> {
    const rows: Record<string, number> = {};
    for (const tableName of this.#tables) {
      // Match the pending-row predicate exactly, or a row carrying both keeps the count above zero.
      const row = await this.#sequelize.query<{ count: string }>(
        `SELECT count(*) AS count FROM ${tableName} WHERE data IS NOT NULL AND hash IS NULL`,
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

  /** Completion is this, not merely the absence of remaining bytes. */
  async findUnbackedHashes(): Promise<string[]> {
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
   * Selection keys only on the hash: bytes and hash move together, so a resumed pass skips nothing.
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

  // Null when the row was hard-deleted between the batch select and this read (attachments delete
  // after push).
  async #admitRowContent(tableName: ReferenceTable, id: string) {
    const row = await this.#sequelize.query<{ data: Buffer | null }>(
      `SELECT data FROM ${tableName} WHERE id = $id`,
      { bind: { id }, type: QueryTypes.SELECT, plain: true },
    );
    if (!row?.data) {
      return null;
    }
    return await this.#blobStore.put(Readable.from([row.data]));
  }

  async #readWholeBlob(hash: string): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of await this.#blobStore.get(hash)) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
