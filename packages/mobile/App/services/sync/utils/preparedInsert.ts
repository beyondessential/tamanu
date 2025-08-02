import { Repository } from "typeorm";
import { DataToPersist } from "../types";

/** 
 * Much faster than typeorm bulk insert or save
 * Prepare a raw query and execute it with the values
 */
export const preparedInsert = async (repository: Repository<any>, rows: DataToPersist[]) => {
    const tableName = repository.metadata.tableName;
    const columns = Object.keys(rows[0]);
    const columnNames = columns.map(col => `"${col}"`).join(', ');
    const placeholders = columns.map(() => '?').join(', ');
    const valuesPlaceholders = rows.map(() => `(${placeholders})`).join(', ');

    const query = `INSERT INTO ${tableName} (${columnNames}) VALUES ${valuesPlaceholders}`;
    const values = rows.flatMap(row => columns.map(col => row[col]));

    await repository.query(query, values);
};
