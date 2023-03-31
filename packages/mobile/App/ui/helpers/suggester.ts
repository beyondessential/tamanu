import { FindManyOptions, Like, ObjectLiteral } from 'typeorm/browser';
import { BaseModel } from '~/models/BaseModel';

export interface OptionType {
  label: string;
  value: string;
}

export type BaseModelSubclass = typeof BaseModel;

interface SuggesterOptions<ModelType> extends FindManyOptions<ModelType> {
  column: string;
  where: ObjectLiteral; // Suggester only takes 'where' of type object.
}

const defaultFormatter = (model): OptionType => ({ label: model.name, value: model.id });

export class Suggester<ModelType extends BaseModelSubclass> {
  model: ModelType;

  options: SuggesterOptions<ModelType>;

  formatter: (entity: BaseModel) => OptionType;

  constructor(model: ModelType, options, formatter = defaultFormatter) {
    this.model = model;
    this.options = options;
    // If you don't provide a formatter, this assumes that your model has "name" and "id" fields
    this.formatter = formatter;
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

  fetchSuggestions = async (search: string): Promise<OptionType[]> => {
    const { where = {}, column = 'name' } = this.options;

    try {
      const data = await this.fetch({
        where: {
          [column]: Like(`%${search}%`),
          ...where,
        },
        order: {
          [column]: 'ASC',
        },
      });

      return data.map(this.formatter);
    } catch (e) {
      return [];
    }
  };
}
