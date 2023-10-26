import { BeforeInsert, Entity, PrimaryColumn } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { Column } from 'typeorm';

@Entity('translated_string')
export class TranslatedString extends BaseModel {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @PrimaryColumn()
  id: string;

  @Column({ type: 'varchar', nullable: false })
  language: string;

  @Column({ type: 'varchar', nullable: false })
  stringId: string;

  @Column({ type: 'varchar', nullable: false })
  text: string;

  @BeforeInsert()
  async assignIdAsTranslatedStringId(): Promise<void> {
    // For translated_string, we use a composite primary key of stringId plus language,
    // N.B. because ';' is used to join the two, we replace any actual occurrence of ';' with ':'
    // to avoid clashes on the joined id
    this.id = `${this.stringId.replace(';', ':')};${this.language.replace(';', ':')}`;
  }
}
