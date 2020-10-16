import { Like } from 'typeorm/browser';
import { BaseModel } from '~/models/BaseModel';

interface OptionType {
  label: string;
  value: string;
}

const defaultFormatter = ({ name, id }): OptionType => ({ label: name, value: id });

export class Suggester {
  model: any;

  options: any;

  formatter: ({ name, id }) => OptionType;

  constructor(model: BaseModel, options, formatter = defaultFormatter) {
    this.model = model;
    this.options = options;
    this.formatter = formatter;
  }

  async fetch(options): Promise<any> {
    const data = await this.model
      .getRepository()
      .find(options);

    return data;
  }

  fetchCurrentOption = async (value: string): Promise<any> => {
    try {
      const data = await this.model
        .getRepository()
        .findOne(value);

      return this.formatter(data);
    } catch (e) {
      return undefined;
    }
  };

  fetchSuggestions = async (search: string): Promise<any> => {
    const whereOptions = this.options.where || {};

    const nonWhereOptions = { ...this.options };
    delete nonWhereOptions.where;

    try {
      const data = await this.fetch({
        where: {
          name: Like(`%${search}%`),
          ...whereOptions,
        },
        ...nonWhereOptions,
      });

      return data.map(this.formatter);
    } catch (e) {
      return [];
    }
  };
}
