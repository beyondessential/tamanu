import * as yup from 'yup';

export const dhis2IdSchemeSchema = yup.string().oneOf(['uid', 'name', 'code', 'attribute:ID']);
