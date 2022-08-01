import {
  Entity,
  Column,
  ManyToOne,
  RelationId,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm/browser';
import { OneToMany } from 'typeorm';
import { BaseModel } from './BaseModel';
import {
  IDataRequiredToCreateLabRequest,
  ILabRequest,
  LabRequestStatus,
} from '~/types';
import { Encounter } from './Encounter';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { LabTest } from './LabTest';
import { User } from './User';

const ISO9075_SQLITE_DEFAULT = 'strftime("%Y-%m-%d %H:%M:%S", CURRENT_TIMESTAMP)';
@Entity('labRequest')
export class LabRequest extends BaseModel implements ILabRequest {
  // Default needs to be declared inside anonymous function otherwise it will
  // simply use the value returned on init.
  // https://github.com/typeorm/typeorm/issues/877#issuecomment-772051282
  @Column({ nullable: false, default: () => ISO9075_SQLITE_DEFAULT })
  sampleTime: string;

  @Column({ nullable: false, default: () => ISO9075_SQLITE_DEFAULT })
  requestedDate: string;

  @Column({ nullable: true, default: false })
  urgent?: boolean;

  @Column({ nullable: true, default: false })
  specimenAttached?: boolean;

  @Column({
    type: 'varchar',
    nullable: true,
    default: LabRequestStatus.RECEPTION_PENDING,
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

  @ManyToOne(() => Encounter, (encounter) => encounter.labRequests)
  encounter: Encounter;
  @RelationId(({ encounter }) => encounter)
  encounterId: string;

  @ManyToOne(() => User, (user) => user.labRequests)
  requestedBy: User;
  @RelationId(({ requestedBy }) => requestedBy)
  requestedById: string;

  @ReferenceDataRelation()
  labTestCategory: ReferenceData;
  @RelationId(({ labTestCategory }) => labTestCategory)
  labTestCategoryId: string;

  @ReferenceDataRelation()
  labTestPriority: ReferenceData;
  @RelationId(({ labTestPriority }) => labTestPriority)
  labTestPriorityId: string;

  @OneToMany(() => LabTest, (labTest) => labTest.labRequest)
  tests: LabTest[];

  @BeforeInsert()
  @BeforeUpdate()
  async markEncounterForUpload() {
    await this.markParentForUpload(Encounter, 'encounter');
  }

  static async getForPatient(patientId: string): Promise<LabRequest[]> {
    return this.getRepository()
      .createQueryBuilder('labRequest')
      .leftJoinAndSelect('labRequest.encounter', 'encounter')
      .where('encounter.patient = :patientId', { patientId })
      .leftJoinAndSelect('labRequest.labTestCategory', 'labTestCategory')
      .getMany();
  }

  static async createWithTests(
    data: IDataRequiredToCreateLabRequest,
  ): Promise<BaseModel> {
    const { labTestTypeIds = [] } = data;
    if (!labTestTypeIds.length) {
      throw new Error('A request must have at least one test');
    }

    const labRequest = await this.createAndSaveOne(data);

    // then create tests
    await Promise.all(
      labTestTypeIds.map((labTestTypeId) => LabTest.createAndSaveOne({
        labTestType: labTestTypeId,
        labRequest: labRequest.id,
      })),
    );

    return labRequest;
  }
}
