import { Readable } from 'node:stream';
import { describe, expect, it, vi } from 'vitest';

import { CHUNK_BYTES, readByteaStream, writeByteaFromStream } from '../../src/blobStore/backfill/byteaChunks';

async function readAll(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

// Stands in for Postgres slicing a bytea: honours the 1-indexed offset and
// length the reader asks for, and reports how it was called.
function makeSlicingSequelize(content: Buffer) {
  const calls: Array<{ offset: number; length: number }> = [];
  return {
    calls,
    sequelize: {
      query: vi.fn(async (_sql: string, { bind }: { bind: { offset: number; length: number } }) => {
        calls.push({ offset: bind.offset, length: bind.length });
        const start = bind.offset - 1;
        const chunk = content.subarray(start, start + bind.length);
        return { chunk: chunk.length > 0 ? chunk : null };
      }),
    } as any,
  };
}

describe('readByteaStream', () => {
  it('streams content back in order across several slices', async () => {
    const content = Buffer.alloc(CHUNK_BYTES * 2 + 1234, 7);
    content.write('start', 0);
    content.write('end', content.length - 3);
    const { sequelize, calls } = makeSlicingSequelize(content);

    const result = await readAll(
      readByteaStream({ sequelize, expression: 'data', where: 'attachments WHERE id = $id', bind: { id: 'a' } }),
    );

    expect(result.equals(content)).toBe(true);
    // Three full-size asks plus the one that comes back empty and ends it.
    expect(calls.map(c => c.offset)).toEqual([1, CHUNK_BYTES + 1, CHUNK_BYTES * 2 + 1, content.length + 1]);
    expect(calls.every(c => c.length === CHUNK_BYTES)).toBe(true);
  });

  it('never holds more than one slice at a time', async () => {
    const content = Buffer.alloc(CHUNK_BYTES * 3, 1);
    const { sequelize } = makeSlicingSequelize(content);

    let largestChunk = 0;
    const stream = readByteaStream({
      sequelize,
      expression: 'data',
      where: 'attachments WHERE id = $id',
      bind: { id: 'a' },
    });
    for await (const chunk of stream) {
      largestChunk = Math.max(largestChunk, (chunk as Buffer).length);
    }

    expect(largestChunk).toBe(CHUNK_BYTES);
  });

  it('yields nothing for empty content', async () => {
    const { sequelize } = makeSlicingSequelize(Buffer.alloc(0));

    const result = await readAll(
      readByteaStream({ sequelize, expression: 'data', where: 'assets WHERE id = $id', bind: { id: 'a' } }),
    );

    expect(result.length).toBe(0);
  });

  it('surfaces a query failure as a stream error', async () => {
    const sequelize = {
      query: vi.fn(async () => {
        throw new Error('connection lost');
      }),
    } as any;

    await expect(
      readAll(readByteaStream({ sequelize, expression: 'data', where: 'assets WHERE id = $id', bind: { id: 'a' } })),
    ).rejects.toThrow('connection lost');
  });
});

describe('writeByteaFromStream', () => {
  it('seeds the column empty then appends each slice', async () => {
    const statements: string[] = [];
    const appended: Buffer[] = [];
    const sequelize = {
      query: vi.fn(async (sql: string, options?: { bind?: { chunk?: Buffer } }) => {
        statements.push(sql.trim());
        if (options?.bind?.chunk) appended.push(options.bind.chunk);
        return [[], 1];
      }),
    } as any;

    const size = await writeByteaFromStream({
      sequelize,
      table: 'attachments',
      column: 'data',
      id: 'a',
      source: Readable.from([Buffer.from('one'), Buffer.from('two')]),
    });

    expect(size).toBe(6);
    expect(statements[0]).toContain("= ''::bytea");
    expect(statements.slice(1).every(sql => sql.includes('|| $chunk'))).toBe(true);
    expect(Buffer.concat(appended).toString()).toBe('onetwo');
  });

  it('leaves an empty column for empty content', async () => {
    const statements: string[] = [];
    const sequelize = {
      query: vi.fn(async (sql: string) => {
        statements.push(sql.trim());
        return [[], 1];
      }),
    } as any;

    const size = await writeByteaFromStream({
      sequelize,
      table: 'assets',
      column: 'data',
      id: 'a',
      source: Readable.from([]),
    });

    expect(size).toBe(0);
    expect(statements).toHaveLength(1);
  });
});
