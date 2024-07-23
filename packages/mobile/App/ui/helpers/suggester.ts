import { keyBy } from 'lodash';
import { Brackets, FindManyOptions, ObjectLiteral } from 'typeorm/browser';
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
}

const ModelToDataType = {
  LocationGroup: 'locationGroup',
  Facility: 'facility',
  Department: 'department',
  Location: 'location',
};

const defaultFormatter = (model): OptionType => ({ label: model.name, value: model.id });

const extractDataId = ({ stringId }) => stringId.split('.').pop();

const replaceDataLabelsWithTranslations = ({ data, translations }) => {
  const translationsByDataId = keyBy(translations, extractDataId);
  return data.map(item => ({
    ...item,
    name: translationsByDataId[item.id]?.text ?? item.name,
  }));
};

export class Suggester<ModelType extends BaseModelSubclass> {
  model: ModelType;

  options: SuggesterOptions<ModelType>;

  formatter: (entity: BaseModel) => OptionType;

  filter?: (entity: BaseModel) => boolean;

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
    // Frontend filter applied to the data recieved. Use this to filter by permission
    // by the model id: ({ id }) => ability.can('read', subject('noun', { id })),
    this.filter = filter;
  }

  async fetch(options): Promise<BaseModel[]> {
    return this.model.findVisible(options);
  }

  fetchCurrentOption = async (value: string | null): Promise<OptionType> => {
    if (!value) return undefined;
    try {
      const data = await this.model.getRepository().findOne(value);

      return this.formatter(data);
    } catch (e) {
      return undefined;
    }
  };

  fetchSuggestions = async (search: string, language: string = 'en'): Promise<OptionType[]> => {
    const { where = {}, column = 'name', relations } = this.options;
    const dataType = ModelToDataType[this.model.name] ?? where?.type;

    try {
      const translations = await TranslatedString.getReferenceDataTranslationsByDataType(
        language,
        dataType,
        search,
      );

      const suggestedIds = translations.map(extractDataId);

      let query = this.model
        .getRepository()
        .createQueryBuilder('entity')
        .where(
          new Brackets(qb => {
            qb.where(`${column} LIKE :search`, {
              search: `%${search}%`,
            }).orWhere('entity.id IN (:...suggestedIds)', { suggestedIds });
          }),
        );

      // Apply additional conditions from optional where
      for (const [key, value] of Object.entries(where)) {
        query = query.andWhere(`entity.${key} = :${key}`, { [key]: value });
      }

      query = query.orderBy(`entity.${column}`, 'ASC');

      // Add relations
      if (relations) {
        for (const relation of relations) {
          query = query.leftJoinAndSelect(`entity.${relation}`, relation);
        }
      }

      let data = await query.getMany();

      data = replaceDataLabelsWithTranslations({ data, translations });

      return this.filter ? data.filter(this.filter).map(this.formatter) : data.map(this.formatter);
    } catch (e) {
      return [];
    }
  };
}
