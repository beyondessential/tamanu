import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { SYNC_DIRECTIONS } from './types';
import { BaseModel } from './BaseModel';
import { Patient } from './Patient';
import { Encounter } from './Encounter';

// spec: MOB
// Records are retained after their bytes reach central: the record is what makes the content
// refetchable.
@Entity('attachments')
export class Attachment extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ nullable: true })
  size?: number;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'varchar', nullable: true })
  hash?: string;

  // Local only, never synced; consumed by the startup adoption pass.
  @Column({ type: 'varchar', nullable: true })
  filePath?: string;

  // spec: ATCH
  // Copied from the owning record, so the attachment syncs with the same scope.
  @ManyToOne(() => Patient)
  patient?: Patient;
  @RelationId(({ patient }) => patient)
  patientId?: string;

  @ManyToOne(() => Encounter)
  encounter?: Encounter;
  @RelationId(({ encounter }) => encounter)
  encounterId?: string;

  static excludedSyncColumns: string[] = [...BaseModel.excludedSyncColumns, 'filePath'];
}
