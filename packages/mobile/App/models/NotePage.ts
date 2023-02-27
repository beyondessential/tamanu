import { Entity, Column } from 'typeorm/browser';
import { OneToMany } from 'typeorm';

import { DateTimeStringColumn } from './DateColumns';
import { ISO9075_DATE_SQLITE_DEFAULT } from './columnDefaults';

import { ID, INoteItem, INotePage, NoteRecordType, NoteType, DateString } from '~/types';
import { SYNC_DIRECTIONS } from './types';

import { BaseModel } from './BaseModel';
import { NoteItem } from './NoteItem';

@Entity('notePage')
export class NotePage extends BaseModel implements INotePage {
  static syncDirection = SYNC_DIRECTIONS.PUSH_TO_CENTRAL;

  @Column({ type: 'varchar', nullable: false })
  noteType: NoteType;

  @DateTimeStringColumn({ nullable: false, default: ISO9075_DATE_SQLITE_DEFAULT })
  date: DateString;

  // Can't link to record
  // @ManyToOne(
  //   () => Encounter,
  //   encounter => encounter.labRequests,
  // )
  // encounter: Encounter;
  // @RelationId(({ encounter }) => encounter)
  // encounterId: string;

  @Column({ type: 'varchar', nullable: false })
  recordType: NoteRecordType;
  @Column({ type: 'varchar', nullable: false })
  recordId: ID;

  @OneToMany(
    () => NoteItem,
    noteItem => noteItem.notePage,
  )
  noteItems: INoteItem[]

  static getTableNameForSync(): string {
    return 'note_page'; // unusual camel case table here on mobile
  }

  // static async getForPatient(patientId: string): Promise<LabRequest[]> {
  //   return this.getRepository()
  //     .createQueryBuilder('labRequest')
  //     .leftJoinAndSelect('labRequest.encounter', 'encounter')
  //     .where('encounter.patient = :patientId', { patientId })
  //     .leftJoinAndSelect('labRequest.labTestCategory', 'labTestCategory')
  //     .getMany();
  // }

  // static async createWithTests(data: IDataRequiredToCreateLabRequest): Promise<BaseModel> {
  //   const { labTestTypeIds = [] } = data;
  //   if (!labTestTypeIds.length) {
  //     throw new Error('A request must have at least one test');
  //   }

  //   const labRequest = await this.createAndSaveOne(data);

  //   // then create tests
  //   await Promise.all(
  //     labTestTypeIds.map(labTestTypeId =>
  //       LabTest.createAndSaveOne({
  //         labTestType: labTestTypeId,
  //         labRequest: labRequest.id,
  //       }),
  //     ),
  //   );

  //   return labRequest;
  // }
}
