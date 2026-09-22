import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { SYNC_DIRECTIONS } from './types';
import { BaseModel } from './BaseModel';
import { Patient } from './Patient';
import { Encounter } from './Encounter';

// spec: MOB
// An attachment record carries the hash of its content and never the bytes; the
// bytes live in the device's blob store and are reached through the hash. Records
// synchronise in both directions and are retained after their bytes reach the
// central server — the record is what makes its content refetchable.
@Entity('attachments')
export class Attachment extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @Column({ nullable: true })
  size?: number; // size in bytes, as admitted to the blob store

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'varchar', nullable: true })
  hash?: string;

  // Legacy pointer to a pre-blob-store file in the documents directory. Local
  // only, never synced; consumed and cleared by the startup adoption pass (see
  // services/blobs/reconcileAttachments).
  @Column({ type: 'varchar', nullable: true })
  filePath?: string;

  // spec: ATCH
  // The patient linkage of the record the attachment was created for, copied on
  // at creation so the attachment's synchronisation scope matches its owning
  // record's.
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
