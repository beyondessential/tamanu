import { Brackets, FindManyOptions, ObjectLiteral } from 'typeorm';

import { ENGLISH_LANGUAGE_CODE } from '@tamanu/constants';
import { BaseModel } from '~/models/BaseModel';
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

const getTranslationJoinParams = (dataType: string, language: string) => [
  'translated_strings',
  'translation',
  'translation.stringId = :prefix || entity.id AND translation.language = :language',
  {
    prefix: `refData.${dataType}.`,
    language,
  },
];

export interface SuggesterConfig<ModelType> {
  model: ModelType;
  options: SuggesterOptions<ModelType>;
  formatter?: (entity: BaseModel) => OptionType;
  filter?: (entity: BaseModel) => boolean;
}

export class Suggester<ModelType extends BaseModelSubclass> {
  model: ModelType;

  options: SuggesterOptions<ModelType>;

  formatter: (entity: BaseModel) => OptionType;

  filter?: (entity: BaseModel) => boolean;

  lastUpdatedAt: number;

  cachedData: any;

  constructor(config: SuggesterConfig<ModelType>) {
    this.model = config.model;
    this.options = config.options;
    // If you don't provide a formatter, this assumes that your model has "name" and "id" fields
    this.formatter = config.formatter || defaultFormatter;
    // Frontend filter applied to the data received. Use this to filter by permission
    // by the model id: ({ id }) => ability.can('read', subject('noun', { id })),
    this.filter = config.filter;
    this.lastUpdatedAt = -Infinity;
    this.cachedData = null;
  }

  async fetch(options): Promise<BaseModel[]> {
    return this.model.findVisible(options);
  }

  fetchCurrentOption = async (
    value: string | null,
    language: string = ENGLISH_LANGUAGE_CODE,
  ): Promise<OptionType> => {
    const { column = 'name' } = this.options;
    if (!value) return undefined;
    try {
      const dataType = getReferenceDataTypeFromSuggester(this);
      const query = this.model
        .getRepository()
        .createQueryBuilder('entity')
        .leftJoinAndSelect(...getTranslationJoinParams(dataType, language))
        .addSelect(`COALESCE(translation.text, entity.${column})`, 'entity_display_label')
        .where('entity.id = :id', { id: value });

      const result = await query.getRawOne();
      if (!result) return undefined;

      return this.formatter(result);
    } catch (e) {
      return undefined;
    }
  };

  fetchSuggestions = async (
    search: string,
    language: string = ENGLISH_LANGUAGE_CODE,
  ): Promise<OptionType[]> => {
    const requestedAt = Date.now();
    const { where = {}, column = 'name', relations } = this.options;
    const dataType = getReferenceDataTypeFromSuggester(this);

    try {
      let query = this.model.getRepository().createQueryBuilder('entity');

      if (relations) {
        relations.forEach(relation => {
          query = query.leftJoinAndSelect(`entity.${relation}`, relation);
        });
      }

      // Assign a label property using the translation if it exists otherwise use the original entity name
      query = query
        .leftJoinAndSelect(...getTranslationJoinParams(dataType, language))
        .addSelect(`COALESCE(translation.text, entity.${column})`, 'entity_display_label');

      query = query.where(
        new Brackets(qb => {
          if (search) {
            qb.where('entity_display_label LIKE :search', { search: `%${search}%` });
          }
        }),
      );

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

      query = query.orderBy('entity_display_label', 'ASC').limit(25);

      const data = await query.getRawMany();

      const filteredData = this.filter ? data.filter(this.filter) : data;
      const formattedData = filteredData.map(this.formatter);

      if (this.lastUpdatedAt < requestedAt) {
        this.cachedData = formattedData;
        this.lastUpdatedAt = requestedAt;
      }

      return this.cachedData;
    } catch (e) {
      return [];
    }
  };
}
