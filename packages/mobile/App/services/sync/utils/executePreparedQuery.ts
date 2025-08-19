import { Repository } from 'typeorm';
import { DataToPersist } from '../types';

const getTableName = (repository: Repository<any>): string => repository.metadata.tableName;
const getColumns = (rows: DataToPersist[]): string[] => Object.keys(rows[0]);
const quote = (identifier: string): string => `"${identifier}"`;

/**
 * Much faster than typeorm bulk insert or save
 * Prepare a raw query and execute it with the values
 */
export const executePreparedInsert = async (repository: Repository<any>, rows: DataToPersist[]) => {
  if (!rows.length) return;

  const tableName = getTableName(repository);
  const columns = getColumns(rows);
  const columnNames = columns.map(quote).join(', ');
  const placeholders = columns.map(() => '?').join(', ');
  const valuesPlaceholders = rows.map(() => `(${placeholders})`).join(', ');

  const query = `INSERT INTO ${tableName} (${columnNames}) VALUES ${valuesPlaceholders}`;
  const values = rows.flatMap(row => columns.map(col => row[col]));

  await repository.query(query, values);
};

/**
 * Prepare a raw update query and execute it with the values
 */
export const executePreparedUpdate = async (repository: Repository<any>, rows: DataToPersist[]) => {
  if (!rows.length) return;

  const tableName = getTableName(repository);
  const columns = getColumns(rows);
  const updatableColumns = columns.filter(col => col !== 'id');

  const setFragments = updatableColumns.map(col => {
    const cases = rows.map(() => 'WHEN ? THEN ?').join(' ');
    return `${quote(col)} = CASE ${quote('id')} ${cases} ELSE ${quote(col)} END`;
  });

  const whereInPlaceholders = rows.map(() => '?').join(', ');
  const query = `UPDATE ${tableName} SET ${setFragments.join(', ')} WHERE ${quote('id')} IN (${whereInPlaceholders})`;

  const values = rows.flatMap(row => [row.id, ...updatableColumns.map(col => row[col])]);

  await repository.query(query, values);
};
