import { Brackets, Column, RelationId, Entity, ManyToOne } from 'typeorm';
import { get as getAtPath, merge, set as setAtPath } from 'lodash';

import { BaseModel } from './BaseModel';
import { Facility } from './Facility';
import { SYNC_DIRECTIONS } from './types';
import { IFacility } from '../types';
import { SETTINGS_SCOPES } from '~/constants';
import { readConfig } from '~/services/config';
import { parseOrKeep } from '~/utils/parseOrKeep';

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

  /**
   * IMPORTANT: Duplicated from shared-src/models/Setting.js
   * Please update both places when modify
   */
  static async get(key = '', facilityId = null, scopeOverride = null) {
    const determineScope = () => {
      if (scopeOverride) {
        return scopeOverride;
      }
      if (facilityId) {
        return SETTINGS_SCOPES.FACILITY;
      }
      return null;
    };

    const scope = determineScope();

    const settingsQueryBuilder = this.getRepository()
      .createQueryBuilder('setting')
      .where(
        new Brackets((qb) => {
          qb.where('facilityId = :facilityId', { facilityId }).orWhere('facilityId IS NULL');
        }),
      );

    if (key) {
      settingsQueryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('key = :key', { key }).orWhere('key LIKE :keyLike', { keyLike: `${key}.%` });
        }),
      );
    }

    if (scope) {
      settingsQueryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('scope = :scope', { scope });
        }),
      );
    }

    settingsQueryBuilder
      .orderBy('key', 'ASC')
      // we want facility keys to come last so they override global keys
      .addOrderBy("COALESCE(facilityId, '###')", 'ASC');

    const settings = await settingsQueryBuilder.getMany();

    const settingsObject = {};
    for (const currentSetting of settings) {
      setAtPath(settingsObject, currentSetting.key, parseOrKeep(currentSetting.value));
    }

    if (key === '') {
      return settingsObject;
    }

    // just return the object or value below the requested key
    // e.g. if schedules.outPatientDischarger was requested, the return object will look like
    // {  schedule: '0 11 * * *', batchSize: 1000 }
    // rather than
    // { schedules: { outPatientDischarger: { schedule: '0 11 * * *', batchSize: 1000 } } }
    return getAtPath(settingsObject, key);
  }

  static async getByKey(key = '') {
    const facilityId = await readConfig('facilityId', '');
    const settingWithFacilityScope = await this.get('', facilityId);
    const settingWithGlobalScope = await this.get('');
    const settings = merge(settingWithGlobalScope, settingWithFacilityScope);
    return getAtPath(settings, key);
  }

  static sanitizePulledRecordData(rows) {
    return rows.map((row) => {
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
