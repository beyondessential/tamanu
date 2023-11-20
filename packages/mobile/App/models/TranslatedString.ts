import { BeforeInsert, Entity, PrimaryColumn, BeforeUpdate, Column } from 'typeorm/browser';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';

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
    this.id = `${this.stringId};${this.language}`;
  }

  @BeforeUpdate()
  validate(): void {
    if (this.stringId.includes(';')) {
      throw new Error('stringId cannot contain a ";"');
    }
    if (this.language.includes(';')) {
      throw new Error('language cannot contain a ";"');
    }
  }

  static async getLanguageOptions() {
    const languageNameKeys = await this.getRepository().find({
      where: { stringId: 'languageName' },
      select: ['language', 'text'],
    });
    return languageNameKeys.map(({ language, text }) => ({ label: text, value: language }));
  }
}
