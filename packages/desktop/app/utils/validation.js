import * as yup from 'yup';

export const foreignKey = message => yup.string().required();
export const optionalForeignKey = message => yup.string();
