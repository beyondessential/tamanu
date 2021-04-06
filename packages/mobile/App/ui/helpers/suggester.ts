import { BaseEntity, FindManyOptions, Like, ObjectLiteral } from 'typeorm/browser';
import { BaseModel } from '~/models/BaseModel';

export interface OptionType {
  label: string;
  value: string;
}

type BaseModelType = typeof BaseModel;
export interface BaseModelSubclass extends BaseModelType {
  id: string,
  name: string,
}

interface SuggesterOptions<ModelType> extends FindManyOptions<ModelType> {
  column: string,
  where: ObjectLiteral, // Override FindManyOptions to disallow 'where' being type string
}

const defaultFormatter = ({ name, id }): OptionType => ({ label: name, value: id });

export class Suggester<ModelType extends BaseModelSubclass> {
  model: ModelType;

  options: SuggesterOptions<ModelType>;

  formatter: (entity: ModelType) => OptionType;

  constructor(model: ModelType, options, formatter = defaultFormatter) {
    this.model = model;
    this.options = options;
    this.formatter = formatter;
  }

  async fetch(options): Promise<ModelType[]> {
    // Not sure why this.model.getRepository returns type:
    // Repository<BaseModel>, not Repository<ModelType>, but it does
    const data = await this.model
      .getRepository()
      .find(options);

    return data;
  }

  fetchCurrentOption = async (value: string | null): Promise<OptionType> => {
    if(!value) return undefined;
    try {
      const data = await this.model
        .getRepository()
        .findOne(value);

      return this.formatter(data);
    } catch (e) {
      return undefined;
    }
  };

  fetchSuggestions = async (search: string): Promise<OptionType[]> => {
    const {
      where = {},
      column = 'name',
      ...otherOptions
    } = this.options;

    try {
      const data = await this.fetch({
        where: {
          [column]: Like(`%${search}%`),
          ...where,
        },
        ...otherOptions,
      });

      return data.map(this.formatter);
    } catch (e) {
      return [];
    }
  };
}
