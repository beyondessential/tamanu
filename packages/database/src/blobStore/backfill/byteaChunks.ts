import { Readable } from 'node:stream';
import { QueryTypes, type Sequelize } from 'sequelize';

// A single row's content can be far larger than the batch around it, so bytea
// moves between Postgres and Node in slices rather than as one value. Sized to
// stay well inside the driver's per-message comfort while keeping the number of
// round trips per blob low.
export const CHUNK_BYTES = 4 * 1024 * 1024;

interface ByteaSource {
  sequelize: Sequelize;
  /** SQL expression yielding the bytea, in terms of the bindings below. */
  expression: string;
  /** SQL predicate selecting the single source row. */
  where: string;
  bind: Record<string, unknown>;
}

/**
 * Stream a bytea value out of Postgres a slice at a time. `substring` on a
 * bytea is server-side, so only the slice crosses the wire and Node never
 * holds the whole value.
 */
export function readByteaStream({ sequelize, expression, where, bind }: ByteaSource): Readable {
  let offset = 0;
  return new Readable({
    read() {
      // Postgres `substring` is 1-indexed.
      sequelize
        .query<{ chunk: Buffer | null }>(
          `SELECT substring(${expression} from $offset for $length) AS chunk FROM ${where}`,
          {
            bind: { ...bind, offset: offset + 1, length: CHUNK_BYTES },
            type: QueryTypes.SELECT,
            plain: true,
          },
        )
        .then(row => {
          const chunk = row?.chunk;
          if (!chunk || chunk.length === 0) {
            this.push(null);
            return;
          }
          offset += chunk.length;
          this.push(chunk);
        })
        .catch(error => this.destroy(error as Error));
    },
  });
}

/**
 * Write a stream into a bytea column by appending slice by slice, so rollback
 * re-inflates a row without ever holding its whole content in memory. The
 * column is seeded empty and appended to, which means a failure part way
 * through leaves a short value; callers set the hash to null only once the
 * append completes, so a partial row is never mistaken for a restored one.
 */
export async function writeByteaFromStream({
  sequelize,
  table,
  column,
  id,
  source,
}: {
  sequelize: Sequelize;
  table: string;
  column: string;
  id: string;
  source: Readable;
}): Promise<number> {
  await sequelize.query(`UPDATE ${table} SET ${column} = ''::bytea WHERE id = $id`, {
    bind: { id },
  });

  let size = 0;
  for await (const chunk of source) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    if (buffer.length === 0) continue;
    await sequelize.query(
      `UPDATE ${table} SET ${column} = ${column} || $chunk WHERE id = $id`,
      { bind: { id, chunk: buffer } },
    );
    size += buffer.length;
  }
  return size;
}
