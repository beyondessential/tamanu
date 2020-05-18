import * as yup from 'yup';

export const foreignKey = message => yup.object().test('has-id', message, obj => obj && obj.id);
export const optionalForeignKey = message => yup.object().test('has-id-or-is-null', message, obj => !obj || obj.id);
