import { Entity, Column, ManyToOne, RelationId, BeforeInsert, BeforeUpdate } from 'typeorm/browser';

import { BaseModel } from './BaseModel';
import { ILabRequest, LabRequestStatus } from '~/types';
import { Encounter } from './Encounter';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { OneToMany } from 'typeorm';
import { LabTest } from './LabTest';
import { User } from './User';
// import { LAB_REQUEST_STATUSES } from 'shared/constants';

const LAB_REQUEST_STATUS_VALUES = [];//Object.values(LAB_REQUEST_STATUSES);

@Entity('labRequest')
export class LabRequest extends BaseModel implements ILabRequest {
  // https://github.com/typeorm/typeorm/issues/877#issuecomment-772051282 (+ timezones??)
  @Column({ nullable: false, default: () => "CURRENT_TIMESTAMP" })
  sampleTime: Date;

  @Column({ nullable: false, default: () => "CURRENT_TIMESTAMP" })
  requestedDate: Date;

  @Column({ nullable: true, default: false })
  urgent: boolean;
  
  @Column({ nullable: true, default: false })
  specimenAttached: boolean;
  
  @Column({ type: 'varchar', nullable: true, default: LabRequestStatus.RECEPTION_PENDING })
  status?: LabRequestStatus;
  
  @Column({ type: 'varchar', nullable: true })
  senaiteId?: String;
  //   type: Sequelize.STRING,
  
  @Column({ type: 'varchar', nullable: true })
  sampleId?: String;
  //   type: Sequelize.STRING,
  
  @Column({ type: 'varchar', nullable: true })
  note?: String;
  //   type: Sequelize.STRING,

  @ManyToOne(() => Encounter, encounter => encounter.labRequests)
  encounter: Encounter;
  @RelationId(({ encounter }) => encounter)
  encounterId?: string;
  
  @ManyToOne(() => User, user => user.labRequests)
  requestedBy: User;
  @RelationId(({ requestedBy }) => requestedBy)
  requestedById?: string;
  
  @ReferenceDataRelation()
  category: ReferenceData;
  @RelationId(({ category }) => category)
  labTestCategoryId?: string;
  
  @OneToMany(() => LabTest, labTest => labTest.labRequest) // eager?
  tests: LabTest[];

  @BeforeInsert()
  @BeforeUpdate()
  async markEncounterForUpload() {
    await this.markParent(Encounter, 'encounter', 'markedForUpload');
  }

  // static async getForPatient(patientId: string): Promise<Diagnosis[]> {
  //   return this.getRepository()
  //     .createQueryBuilder('diagnosis')
  //     .leftJoin('diagnosis.encounter', 'encounter')
  //     .where('encounter.patient = :patientId', { patientId })
  //     .getMany();



  // static createWithTests(data) {
  //   return this.sequelize.transaction(async () => {
  //     const { labTestTypeIds = [] } = data;
  //     if (!labTestTypeIds.length) {
  //       throw new InvalidOperationError('A request must have at least one test');
  //     }

  //     const base = await this.create(data);

  //     // then create tests
  //     const { LabTest } = this.sequelize.models;

  //     await Promise.all(
  //       labTestTypeIds.map(t =>
  //         LabTest.create({
  //           labTestTypeId: t,
  //           labRequestId: base.id,
  //         }),
  //       ),
  //     );

  //     return base;
  //   });
  // }
  
  
  // static getListReferenceAssociations() {
  //   return ['requestedBy', 'category'];
  // }
  
  // getTests() {
  //   return this.sequelize.models.LabTest.findAll({
  //     where: { labRequestId: this.id },
  //   });
  // }
}

