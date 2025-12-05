import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { ReferenceDrug } from './ReferenceDrug';
import { Facility } from './Facility';
import { ID } from '~/types';

@Entity('reference_drug_facility')
export class ReferenceDrugFacility extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.PULL_FROM_CENTRAL;

  @Column({ type: 'varchar', nullable: true })
  quantity: string | null;

  @ManyToOne(() => ReferenceDrug)
  @JoinColumn()
  referenceDrug: ReferenceDrug;
  @RelationId((rdf: ReferenceDrugFacility) => rdf.referenceDrug)
  referenceDrugId: ID;

  @ManyToOne(() => Facility)
  @JoinColumn()
  facility: Facility;
  @RelationId((rdf: ReferenceDrugFacility) => rdf.facility)
  facilityId: ID;
}
