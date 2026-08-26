import type { FindManyOptions, ObjectLiteral, SelectQueryBuilder } from 'typeorm';

import { ENGLISH_LANGUAGE_CODE, USER_KINDS } from '@tamanu/constants';
import type { BaseModel } from '~/models/BaseModel';
import { VisibilityStatus } from '~/visibilityStatuses';

export interface OptionType {
  label: string;
  value: string;
}

export type BaseModelSubclass = typeof BaseModel;

interface SuggesterOptions<ModelType> extends FindManyOptions<ModelType> {
  column: string;
  where: ObjectLiteral; // Suggester only takes 'where' of type object.
  relations?: Array<string>;
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

/**
 * `translated_strings.id` is generated as `${stringId};${language}`, and is the table's primary key.
 * Matching on it lets SQLite satisfy the join from an index; matching on `stringId` and `language`
 * separately is equivalent but unindexed, which costs a scan of the whole translations table for
 * every suggestion query.
 */
const TRANSLATION_JOIN_CONDITION =
  'translation.id = :stringIdPrefix || entity.id || :languageSuffix';

const getTranslationJoinParams = (dataType: string, language: string) => ({
  stringIdPrefix: `refData.${dataType}.`,
  languageSuffix: `;${language}`,
});

export interface SuggesterConfig<ModelType> {
  model: ModelType;
  options: SuggesterOptions<ModelType>;
  formatter?: (entity: BaseModel) => OptionType;
  filter?: (entity: BaseModel) => boolean;
}

export class Suggester<ModelType extends BaseModelSubclass> {
  private static nextFilterCacheKey = 1;

  model: ModelType;

  options: SuggesterOptions<ModelType>;

  formatter: (entity: BaseModel) => OptionType;

  filter?: (entity: BaseModel) => boolean;

  /**
   * HACK: {@link Suggester.filter} is a method, which is ignored when a {@link Suggester} is
   * serialized into a TanStack Query query key. Without this, two distinct {@link Suggester}s with
   * equivalent `model` and `options` but different `filter` would collide in the query client
   * cache.
   *
   * Use `model.name`, `options`, and `filterCacheKey` to key the query.
   */
  filterCacheKey?: string;

  constructor(config: SuggesterConfig<ModelType>) {
    this.model = config.model;
    this.options = config.options;
    // If you don't provide a formatter, this assumes that your model has "name" and "id" fields
    this.formatter = config.formatter || defaultFormatter;
    // Frontend filter applied to the data received. Use this to filter by permission
    // by the model id: ({ id }) => ability.can('read', subject('noun', { id })),
    this.filter = config.filter;
    this.filterCacheKey = config.filter ? `filter:${Suggester.nextFilterCacheKey++}` : undefined;
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
        TRANSLATION_JOIN_CONDITION,
        getTranslationJoinParams(dataType, language),
      )
      .addSelect(`COALESCE(translation.text, entity.${column})`, 'entity_display_label');
  }

  fetchCurrentOption = async (
    value: string | null,
    language: string = ENGLISH_LANGUAGE_CODE,
  ): Promise<OptionType> => {
    if (!value) return undefined;
    try {
      const query = this.selectDisplayLabel(
        this.model.getRepository().createQueryBuilder('entity'),
        language,
      ).where('entity.id = :id', { id: value });

      const result = await query.getRawOne();
      if (!result) return undefined;

      return this.formatter(result);
    } catch (_e) {
      return undefined;
    }
  };

  fetchSuggestions = async (
    search: string,
    language: string = ENGLISH_LANGUAGE_CODE,
  ): Promise<OptionType[]> => {
    const { where = {}, relations } = this.options;

    try {
      let query = this.model.getRepository().createQueryBuilder('entity');

      if (relations) {
        relations.forEach(relation => {
          query = query.leftJoinAndSelect(`entity.${relation}`, relation);
        });
      }

      query = this.selectDisplayLabel(query, language);

      if (search) {
        query = query.andWhere('entity_display_label LIKE :search', { search: `%${search}%` });
      }

      Object.entries(where).forEach(([key, value]) => {
        query = query.andWhere(`entity.${key} = :${key}`, { [key]: value });
      });

      // Add visibility status filtering if the model has a visibilityStatus column
      const hasVisibilityStatus = this.model
        .getRepository()
        .metadata.columns.find(col => col.propertyName === 'visibilityStatus');
      if (hasVisibilityStatus) {
        query = query.andWhere('entity.visibilityStatus = :visibilityStatus', {
          visibilityStatus: VisibilityStatus.Current,
        });
      }

      // Machine accounts (device sync users) never belong in suggestions
      const hasKind = this.model
        .getRepository()
        .metadata.columns.find(col => col.propertyName === 'kind');
      if (hasKind) {
        query = query.andWhere('entity.kind != :syncKind', { syncKind: USER_KINDS.SYNC });
      }

      query = query.orderBy('entity_display_label', 'ASC').limit(25);

      const data = await query.getRawMany();

      const filteredData = this.filter ? data.filter(this.filter) : data;
      return filteredData.map(this.formatter);
    } catch {
      return [];
    }
  };
}
