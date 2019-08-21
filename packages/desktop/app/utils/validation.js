import * as yup from 'yup';

const hasId = obj => obj && obj._id;

export const foreignKey = message => yup.object().test('has-id', message, hasId);
