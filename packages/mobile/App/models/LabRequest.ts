import {
  Entity,
  Column,
  ManyToOne,
  RelationId,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm/browser';

import { BaseModel } from './BaseModel';
import {
  IDataRequiredToCreateLabRequest,
  ILabRequest,
  LabRequestStatus
} from '~/types';
import { Encounter } from './Encounter';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { OneToMany } from 'typeorm';
import { LabTest } from './LabTest';
import { User } from './User';

@Entity('labRequest')
export class LabRequest extends BaseModel implements ILabRequest {
  // https://github.com/typeorm/typeorm/issues/877#issuecomment-772051282 (+ timezones??)
  @Column({ nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  sampleTime: Date;

  @Column({ nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  requestedDate: Date;

  @Column({ nullable: true, default: false })
  urgent?: boolean;

  @Column({ nullable: true, default: false })
  specimenAttached?: boolean;

  @Column({
    type: 'varchar',
    nullable: true,
    default: LabRequestStatus.RECEPTION_PENDING
  })
  status?: LabRequestStatus;

  @Column({ type: 'varchar', nullable: true })
  senaiteId?: string;

  @Column({ type: 'varchar', nullable: true })
  sampleId?: string;

  @Column({ type: 'varchar', nullable: false })
  displayId: string;

  @Column({ type: 'varchar', nullable: true })
  note?: string;

  @ManyToOne(
    () => Encounter,
    encounter => encounter.labRequests
  )
  encounter: Encounter;
  @RelationId(({ encounter }) => encounter)
  encounterId: string;

  @ManyToOne(
    () => User,
    user => user.labRequests
  )
  requestedBy: User;
  @RelationId(({ requestedBy }) => requestedBy)
  requestedById: string;

  @ReferenceDataRelation()
  category: ReferenceData;
  @RelationId(({ category }) => category)
  labTestCategoryId: string;

  @OneToMany(
    () => LabTest,
    labTest => labTest.labRequest
  )
  tests: LabTest[];

  @BeforeInsert()
  @BeforeUpdate()
  async markEncounterForUpload() {
    await this.markParent(Encounter, 'encounter', 'markedForUpload');
  }

  static async getForPatient(patientId: string): Promise<LabRequest[]> {
    return this.getRepository()
      .createQueryBuilder('labRequest')
      .leftJoin('labRequest.encounter', 'encounter')
      .where('encounter.patient = :patientId', { patientId })
      .leftJoinAndSelect('labRequest.category', 'category')
      .getMany();
  }

  static async createWithTests(data: IDataRequiredToCreateLabRequest) {
    const { labTestTypeIds = [] } = data;
    if (!labTestTypeIds.length) {
      throw new Error('A request must have at least one test');
    }

    const labRequest = await this.createAndSaveOne(data);

    // then create tests
    await Promise.all(
      labTestTypeIds.map(labTestTypeId =>
        LabTest.createAndSaveOne({
          labTestType: labTestTypeId,
          labRequest: labRequest.id
        })
      )
    );

    return labRequest;
  }

  static getListReferenceAssociations() {
    return ['requestedBy', 'category'];
  }
}
