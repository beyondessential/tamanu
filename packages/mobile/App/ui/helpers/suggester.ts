import {
  In,
  Not,
  type FindManyOptions,
  type ObjectLiteral,
  type SelectQueryBuilder,
} from 'typeorm';

import { ENGLISH_LANGUAGE_CODE, USER_KINDS } from '@tamanu/constants';
import type { BaseModel } from '~/models/BaseModel';
import { VisibilityStatus } from '~/visibilityStatuses';

export interface OptionType {
  label: string;
  value: string;
  [key: string]: unknown;
}

export type BaseModelSubclass = typeof BaseModel;

interface SuggesterOptions<ModelType> extends FindManyOptions<ModelType> {
  column: string;
  where: ObjectLiteral; // Suggester only takes 'where' of type object.
  relations?: Array<string>;
  includeIds?: string[];
  excludeIds?: string[];
  /**
   * Extra predicate AND-ed into the query, for conditions `where` can't express — a comparison
   * against a joined relation, say. Any alias other than `entity` must be listed in `relations`.
   */
  andWhere?: { sql: string; parameters?: ObjectLiteral };
}

const MODEL_TO_REFERENCE_DATA_TYPE = {
  LocationGroup: 'locationGroup',
  Facility: 'facility',
  Department: 'department',
  Location: 'location',
  ProgramRegistry: 'programRegistry',
  ProgramRegistryClinicalStatus: 'programRegistryClinicalStatus',
  ProgramRegistryCondition: 'programRegistryCondition',
};

const TRANSLATABLE_MODELS = ['ReferenceData', ...Object.keys(MODEL_TO_REFERENCE_DATA_TYPE)];

export const getReferenceDataTypeFromSuggester = (suggester: Suggester<any>): string => {
  if (!TRANSLATABLE_MODELS.includes(suggester.model.name)) return null;

  return MODEL_TO_REFERENCE_DATA_TYPE[suggester.model.name] || suggester.options?.where?.type;
};

const defaultFormatter = (record): OptionType => ({
  label: record.entity_display_label,
  value: record.entity_id,
});

const getTranslationJoinParams = (dataType: string, language: string) => ({
  stringIdPrefix: `refData.${dataType}.`,
  language,
});

export interface SuggesterConfig<ModelType> {
  model: ModelType;
  options: SuggesterOptions<ModelType>;
  formatter?: (entity: BaseModel) => OptionType;
}

export class Suggester<ModelType extends BaseModelSubclass> {
  model: ModelType;

  options: SuggesterOptions<ModelType>;

  formatter: (entity: BaseModel) => OptionType;

  constructor(config: SuggesterConfig<ModelType>) {
    this.model = config.model;
    this.options = config.options;
    // If you don't provide a formatter, this assumes that your model has "name" and "id" fields
    this.formatter = config.formatter || defaultFormatter;
  }

  async fetch(options): Promise<BaseModel[]> {
    return this.model.findVisible(options);
  }

  /**
   * Adds the `entity_display_label` column that suggestions are searched, sorted, and labelled by:
   * the record's translated name where there is one, otherwise its own name column.
   */
  private selectDisplayLabel<T>(
    query: SelectQueryBuilder<T>,
    language: string,
  ): SelectQueryBuilder<T> {
    const { column = 'name' } = this.options;
    const dataType = getReferenceDataTypeFromSuggester(this);

    // Models that aren't reference data have no translations to join against
    if (!dataType) return query.addSelect(`entity.${column}`, 'entity_display_label');

    return query
      .leftJoin(
        'translated_strings',
        'translation',
        'translation.stringId = :stringIdPrefix || entity.id AND translation.language = :language',
        getTranslationJoinParams(dataType, language),
      )
      .addSelect(`COALESCE(translation.text, entity.${column})`, 'entity_display_label');
  }

  fetchCurrentOption = async (
    value: string | null,
    language: string = ENGLISH_LANGUAGE_CODE,
  ): Promise<OptionType | undefined> => {
    if (!value) return undefined;
    try {
      const query = this.selectDisplayLabel(
        this.model.getRepository().createQueryBuilder('entity'),
        language,
      ).where('entity.id = :id', { id: value });

      const result = await query.getRawOne();
      if (!result) return undefined;

      return this.formatter(result);
    } catch {
      return undefined;
    }
  };

  fetchSuggestions = async (
    search: string,
    language: string = ENGLISH_LANGUAGE_CODE,
  ): Promise<OptionType[]> => {
    const { where = {}, relations, includeIds, excludeIds, andWhere } = this.options;

    // Nothing can match; skip the round-trip
    if (includeIds?.length === 0) return [];

    try {
      let query = this.model.getRepository().createQueryBuilder('entity');

      for (const relation of relations ?? []) {
        query = query.leftJoinAndSelect(`entity.${relation}`, relation);
      }

      query = this.selectDisplayLabel(query, language);

      if (search) {
        query = query.andWhere('entity_display_label LIKE :search', { search: `%${search}%` });
      }

      for (const [key, value] of Object.entries(where)) {
        query = query.andWhere(`entity.${key} = :${key}`, { [key]: value });
      }

      if (includeIds) {
        query = query.andWhere({ id: In(includeIds) });
      }

      if (excludeIds) {
        query = query.andWhere({ id: Not(In(excludeIds)) });
      }

      if (andWhere) {
        query = query.andWhere(andWhere.sql, andWhere.parameters);
      }

      // Add visibility status filtering if the model has a visibilityStatus column
      const hasVisibilityStatus = this.model
        .getRepository()
        .metadata.columns.some(col => col.propertyName === 'visibilityStatus');
      if (hasVisibilityStatus) {
        query = query.andWhere('entity.visibilityStatus = :visibilityStatus', {
          visibilityStatus: VisibilityStatus.Current,
        });
      }

      // Machine accounts (device sync users) never belong in suggestions
      const hasKind = this.model
        .getRepository()
        .metadata.columns.some(col => col.propertyName === 'kind');
      if (hasKind) {
        query = query.andWhere('entity.kind != :syncKind', { syncKind: USER_KINDS.SYNC });
      }

      // Rank prefix matches first, then other substring matches
      if (search) {
        query = query
          .orderBy('entity_display_label LIKE :prefixSearch', 'DESC')
          .setParameter('prefixSearch', `${search}%`)
          .addOrderBy('entity_display_label', 'ASC');
      } else {
        query = query.orderBy('entity_display_label', 'ASC');
      }

      query = query.limit(12);

      const data = await query.getRawMany();
      return data.map(this.formatter);
    } catch {
      return [];
    }
  };
}
