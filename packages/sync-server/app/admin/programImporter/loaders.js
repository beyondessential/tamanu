import { endOfDay, startOfDay } from 'date-fns';
import { getJsDateFromExcel } from 'excel-date-to-js';
import { ENCOUNTER_TYPES } from 'shared/constants';
import { idify } from './idify';

export const loaderFactory = model => ({ note, ...values }) => [{ model, values }];

export const programLoader = loaderFactory('Program');
export const surveyLoader = loaderFactory('Survey');