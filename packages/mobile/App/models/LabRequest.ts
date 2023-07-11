import { Entity, Column, ManyToOne, RelationId } from 'typeorm/browser';
import { OneToMany } from 'typeorm';
import { BaseModel } from './BaseModel';
import { IDataRequiredToCreateLabRequest, ILabRequest, LabRequestStatus } from '~/types';
import { SYNC_DIRECTIONS } from './types';
import { Encounter } from './Encounter';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { LabTest } from './LabTest';
import { User } from './User';
import { ISO9075_SQLITE_DEFAULT } from './columnDefaults';
import { DateTimeStringColumn } from './DateColumns';
import { Department } from './Department';

const HIDDEN_STATUSES = ['deleted', 'entered-in-error', 'cancelled'];

@Entity('labRequest')
export class LabRequest extends BaseModel implements ILabRequest {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @DateTimeStringColumn({ nullable: false, default: ISO9075_SQLITE_DEFAULT })
  sampleTime: string;

  @DateTimeStringColumn({ nullable: false, default: ISO9075_SQLITE_DEFAULT })
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

  @ManyToOne(
    () => Encounter,
    encounter => encounter.labRequests,
  )
  encounter: Encounter;
  @RelationId(({ encounter }) => encounter)
  encounterId: string;

  @ManyToOne(
    () => User,
    user => user.labRequests,
  )
  requestedBy: User;
  @RelationId(({ requestedBy }) => requestedBy)
  requestedById: string;

  @ManyToOne(() => Department)
  department?: Department;
  @RelationId(({ department }) => department)
  departmentId: string;

  @ReferenceDataRelation()
  labTestCategory: ReferenceData;
  @RelationId(({ labTestCategory }) => labTestCategory)
  labTestCategoryId: string;

  @ReferenceDataRelation()
  labSampleSite: ReferenceData;
  @RelationId(({ labSampleSite }) => labSampleSite)
  labSampleSiteId: string;

  @ReferenceDataRelation()
  labTestPriority: ReferenceData;
  @RelationId(({ labTestPriority }) => labTestPriority)
  labTestPriorityId: string;

  @ManyToOne(
    () => User,
    user => user.collectedLabRequests,
  )
  collectedBy: User;
  @RelationId(({ collectedBy }) => collectedBy)
  collectedById: string;

  @ReferenceDataRelation()
  specimenType: ReferenceData;
  @RelationId(({ specimenType }) => specimenType)
  specimenTypeId: string;

  @OneToMany(
    () => LabTest,
    labTest => labTest.labRequest,
  )
  tests: LabTest[];

  static getTableNameForSync(): string {
    return 'lab_requests'; // unusual camel case table here on mobile
  }

  static async getForPatient(patientId: string): Promise<LabRequest[]> {
    return this.getRepository()
      .createQueryBuilder('labRequest')
      .orderBy('labRequest.requestedDate', 'DESC')
      .leftJoinAndSelect('labRequest.encounter', 'encounter')
      .where('encounter.patient = :patientId', { patientId })
      .andWhere('labRequest.status NOT IN (:...status)', { status: HIDDEN_STATUSES })
      .leftJoinAndSelect('labRequest.labTestCategory', 'labTestCategory')
      .leftJoinAndSelect('labRequest.labSampleSite', 'labSampleSite')
      .getMany();
  }

  static async createWithTests(data: IDataRequiredToCreateLabRequest): Promise<BaseModel> {
    const { labTestTypeIds = [] } = data;
    if (!labTestTypeIds.length) {
      throw new Error('A request must have at least one test');
    }

    const labRequest = await this.createAndSaveOne(data);

    // then create tests
    await Promise.all(
      labTestTypeIds.map(labTestTypeId => LabTest.createAndSaveOne({
        labTestType: labTestTypeId,
        labRequest: labRequest.id,
      })),
    );

    return labRequest;
  }
}
