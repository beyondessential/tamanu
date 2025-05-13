import { keyBy } from 'lodash';
import { Brackets, FindManyOptions, ObjectLiteral } from 'typeorm';
import { BaseModel } from '~/models/BaseModel';
import { TranslatedString } from '~/models/TranslatedString';

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

const defaultFormatter = (model): OptionType => ({ label: model.name, value: model.id });

const extractDataId = ({ stringId }) => stringId.split('.').pop();

const replaceDataLabelsWithTranslations = ({ data, translations }) => {
  const translationsByDataId = keyBy(translations, extractDataId);
  return data.map((item) => ({
    ...item,
    name: translationsByDataId[item.id]?.text ?? item.name,
  }));
};

export class Suggester<ModelType extends BaseModelSubclass> {
  model: ModelType;

  options: SuggesterOptions<ModelType>;

  formatter: (entity: BaseModel) => OptionType;

  filter?: (entity: BaseModel) => boolean;

  lastUpdatedAt: number;

  cachedData: any;

  constructor(
    model: ModelType,
    options,
    formatter = defaultFormatter,
    filter?: (entity: BaseModel) => boolean,
  ) {
    this.model = model;
    this.options = options;
    // If you don't provide a formatter, this assumes that your model has "name" and "id" fields
    this.formatter = formatter;
    // Frontend filter applied to the data received. Use this to filter by permission
    // by the model id: ({ id }) => ability.can('read', subject('noun', { id })),
    this.filter = filter;
    this.lastUpdatedAt = -Infinity;
    this.cachedData = null;
  }

  async fetch(options): Promise<BaseModel[]> {
    return this.model.findVisible(options);
  }

  fetchCurrentOption = async (value: string | null): Promise<OptionType> => {
    if (!value) return undefined;
    try {
      const data = await this.model.getRepository().findOne({ where: { id: value } });

      return this.formatter(data);
    } catch (e) {
      return undefined;
    }
  };

  fetchSuggestions = async (search: string, language: string = 'en'): Promise<OptionType[]> => {
    const requestedAt = Date.now();
    const { where = {}, column = 'name', relations } = this.options;
    const dataType = getReferenceDataTypeFromSuggester(this);

    try {
      let query = this.model
        .getRepository()
        .createQueryBuilder('entity')
        .leftJoinAndSelect(
          'translated_strings',
          'translation',
          'translation.stringId = :prefix || entity.id AND translation.language = :language',
          {
            prefix: `refData.${dataType}.`,
            language,
          },
        )
        .addSelect('COALESCE(translation.text, entity.name)', 'entity_translated_name')

        .where(
          new Brackets((qb) => {
            if (search) {
              qb.where('entity_translated_name LIKE :search', { search: `%${search}%` });
            }
          }),
        )
        .andWhere(
          new Brackets((qb) => {
            Object.entries(where).forEach(([key, value]) => {
              qb.andWhere(`entity.${key} = :${key}`, { [key]: value });
            });
          }),
        )
        .orderBy(`entity.${column}`, 'ASC')
        .limit(25);

      if (relations) {
        relations.forEach((relation) => {
          query = query.leftJoinAndSelect(`entity.${relation}`, relation);
        });
      }

      const data = await query.getRawAndEntities();

      console.log(data.raw[0]);

      const processedData = data.raw.map((item) => ({
        label: item.entity_translated_name,
        value: item.entity_id,
      }));

      console.log(processedData[0]);

      const formattedData = this.filter
        ? processedData.filter(this.filter).map(this.formatter)
        : processedData.map(this.formatter);

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
