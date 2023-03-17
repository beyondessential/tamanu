import { Column, Like, RelationId } from 'typeorm';
import { Entity, ManyToOne } from 'typeorm/browser';
import { get as getAtPath, set as setAtPath } from 'lodash';

import { BaseModel } from './BaseModel';
import { Facility } from './Facility';
import { SYNC_DIRECTIONS } from './types';
import { IFacility } from '../types';

@Entity('setting')
export class Setting extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ nullable: false })
  key: string;

  @Column({ nullable: false })
  value: string;

  @ManyToOne(() => Facility)
  facility: IFacility;

  @RelationId(({ facility }) => facility)
  facilityId: string;

  /**
   * Duplicated from shared-src/models/Setting.js
   * Please update both places when modify
   */
  static async get(key = '', facilityId = null) {
    const settings = await this.find({
      where: {
        key: Like(key),
      },
    });

    const settingsObject = {};
    for (const currentSetting of settings) {
      setAtPath(settingsObject, currentSetting.key, JSON.parse(currentSetting.value));
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
}
