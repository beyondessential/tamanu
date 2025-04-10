import { BeforeInsert, Entity, PrimaryColumn, BeforeUpdate, Column, Like } from 'typeorm';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';

@Entity('translated_strings')
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

  static async getForLanguage(language: string): Promise<{ [key: string]: string }> {
    const translatedStrings = await this.getRepository().find({
      where: {
        language,
      },
    });
    return Object.fromEntries(
      translatedStrings.map((translatedString) => [
        translatedString.stringId,
        translatedString.text,
      ]),
    );
  }

  static async getReferenceDataTranslationsByDataType(
    language: string,
    refDataType: string,
    queryString: string,
  ): Promise<{ stringId: string; text: string }[]> {
    const referenceDataTranslations = await this.getRepository().find({
      where: {
        language,
        stringId: Like(`refData.${refDataType}.%`),
        text: Like(`%${queryString}%`),
      },
      select: ['stringId', 'text'],
      order: {
        text: 'ASC',
      },
      take: 25,
    });

    return referenceDataTranslations;
  }
}
