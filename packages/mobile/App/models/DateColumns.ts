import { getMetadataArgsStorage, ValueTransformer } from 'typeorm';
import { formatDate } from '~/ui/helpers/date';

const getDateTransformer = (format: string): ValueTransformer => ({
  from: (value: string): string => value,
  to: (value: Date | string): string => (typeof value === 'string' ? value : formatDate(value, format)),
});

export function DateTimeStringColumn(options = {}): PropertyDecorator {
  return function (object, propertyName) {
    getMetadataArgsStorage().columns.push({
      target: object.constructor,
      propertyName: propertyName as string,
      mode: 'regular',
      options: {
        ...options,
        type: 'character',
        length: 19,
        transformer: getDateTransformer('YYYY-MM-DD HH:mm:ss'),
      },
    });
  };
}

export function DateStringColumn(options = {}): PropertyDecorator {
  return function (object, propertyName) {
    getMetadataArgsStorage().columns.push({
      target: object.constructor,
      propertyName: propertyName as string,
      mode: 'regular',
      options: {
        ...options,
        type: 'character',
        length: 10,
        transformer: getDateTransformer('YYYY-MM-DD'),
      },
    });
  };
}
