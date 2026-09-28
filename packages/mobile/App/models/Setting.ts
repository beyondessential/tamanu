import { get as getAtPath, set as setAtPath } from 'es-toolkit/compat';
import { Brackets, Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { readConfig } from '~/services/config';
import { parseOrKeep } from '~/utils/parseOrKeep';
import type { IFacility } from '../types';
import { BaseModel } from './BaseModel';
import { Facility } from './Facility';
import { SYNC_DIRECTIONS } from './types';

@Entity('settings')
export class Setting extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ nullable: false })
  key: string;

  @Column({ nullable: true })
  value: string;

  @Column({ nullable: false })
  scope: string;

  @ManyToOne(() => Facility)
  facility: IFacility;

  @RelationId(({ facility }) => facility)
  facilityId: string;

  static async getByKey<T = unknown>(key: string): Promise<T | undefined> {
    if (!key) throw new Error('Setting.getByKey requires a key');

    const facilityId = await readConfig('facilityId', '');

    const settings = await Setting.getRepository()
      .createQueryBuilder('setting')
      .where(
        new Brackets(qb => {
          qb.where('key = :key', { key }).orWhere('key LIKE :keyLike', { keyLike: `${key}.%` });
        }),
      )
      .andWhere(
        new Brackets(qb => {
          qb.where('facilityId = :facilityId', { facilityId }).orWhere('facilityId IS NULL');
        }),
      )
      .orderBy('key', 'ASC')
      // we want facility keys to come last so they override global keys
      .addOrderBy("COALESCE(facilityId, '###')", 'ASC')
      .getMany();

    const settingsObject = {};
    for (const currentSetting of settings) {
      setAtPath(settingsObject, currentSetting.key, parseOrKeep(currentSetting.value));
    }

    return getAtPath(settingsObject, key);
  }

  static sanitizePulledRecordData(rows) {
    return rows.map(row => {
      const sanitizedRow = {
        ...row,
      };

      // Convert updatedAtByField to JSON STRING
      // because updatedAtByField's type is string in mobile
      // (Sqlite does not support JSON type)
      if (row.data.value) {
        sanitizedRow.data.value = JSON.stringify(sanitizedRow.data.value);
      }

      return sanitizedRow;
    });
  }
}
