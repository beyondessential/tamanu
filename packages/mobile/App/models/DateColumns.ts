import { getMetadataArgsStorage, ValueTransformer } from 'typeorm';
import { formatDate } from '~/ui/helpers/date';

const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
const DATE_FORMAT = 'yyyy-MM-dd';

const getDateTransformer = (format: string): ValueTransformer => ({
  from: (value: string): string => value,
  to: (value: Date | string): string => value && (typeof value === 'string' ? value : formatDate(value, format)),
});

export function DateTimeStringColumn(options = {}): PropertyDecorator {
  return function pushColumn(object, propertyName) {
    getMetadataArgsStorage().columns.push({
      target: object.constructor,
      propertyName: propertyName as string,
      mode: 'regular',
      options: {
        ...options,
        type: 'varchar',
        length: DATE_TIME_FORMAT.length,
        transformer: getDateTransformer(DATE_TIME_FORMAT),
      },
    });
  };
}

export function DateStringColumn(options = {}): PropertyDecorator {
  return function pushColumn(object, propertyName) {
    getMetadataArgsStorage().columns.push({
      target: object.constructor,
      propertyName: propertyName as string,
      mode: 'regular',
      options: {
        ...options,
        type: 'varchar',
        length: DATE_FORMAT.length,
        transformer: getDateTransformer(DATE_FORMAT),
      },
    });
  };
}
