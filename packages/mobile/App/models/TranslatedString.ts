import { COUNTRY_CODE_STRING_ID, LANGUAGE_NAME_STRING_ID } from '@tamanu/constants';
import { BeforeInsert, Entity, PrimaryColumn, BeforeUpdate, Column } from 'typeorm';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';

export type LanguageOption = {
  label: string;
  languageCode: string;
  countryCode: string;
};

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

  static async getLanguageOptions(): Promise<LanguageOption[]> {
    const [languageNameKeys, countryCodeKeys] = await Promise.all([
      this.getRepository().find({
        where: { stringId: LANGUAGE_NAME_STRING_ID },
        select: ['language', 'text'],
      }),
      this.getRepository().find({
        where: { stringId: COUNTRY_CODE_STRING_ID },
        select: ['language', 'text'],
      }),
    ]);

    const mappedCountryCodes = new Map(
      countryCodeKeys.map(countryCodeKey => [countryCodeKey.language, countryCodeKey.text]),
    );

    return languageNameKeys.map(languageNameKey => ({
      label: languageNameKey.text,
      languageCode: languageNameKey.language,
      countryCode: mappedCountryCodes.get(languageNameKey.language) || '',
    }));
  }

  static async getForLanguage(language: string): Promise<{ [key: string]: string }> {
    const translatedStrings = await this.getRepository().find({
      where: {
        language,
      },
    });
    return Object.fromEntries(
      translatedStrings.map(translatedString => [translatedString.stringId, translatedString.text]),
    );
  }
}
