import { Entity, Column, ManyToOne, RelationId, BeforeInsert, BeforeUpdate } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { IMedication } from '~/types';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { Encounter } from './Encounter';

@Entity('medication')
export class Medication extends BaseModel implements IMedication {
  @Column()
  date: string;

  @Column({ nullable: true })
  endDate?: string;

  @Column({ nullable: true })
  prescription?: string;

  @Column({ nullable: true })
  note?: string;

  @Column({ nullable: true })
  indication?: string;

  @Column({ nullable: true })
  route?: string;

  @Column()
  quantity: number;

  @ReferenceDataRelation()
  medication: ReferenceData;
  @RelationId(({ medication }) => medication)
  medicationId?: string;

  @ManyToOne(() => Encounter, encounter => encounter.medications)
  encounter: Encounter;
  @RelationId(({ encounter }) => encounter)
  encounterId?: string;

  // These qty fields are not required on desktop but not on mobile,
  // leaving them in for parity with desktop for now.
  @Column({ nullable: true })
  qtyMorning?: number;

  @Column({ nullable: true })
  qtyLunch?: number;

  @Column({ nullable: true })
  qtyEvening?: number;

  @Column({ nullable: true })
  qtyNight?: number;

  @BeforeInsert()
  @BeforeUpdate()
  async markEncounterForUpload() {
    await this.markParentForUpload(Encounter, 'encounter');
  }
}
