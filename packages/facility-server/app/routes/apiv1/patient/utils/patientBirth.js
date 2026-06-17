import { pick } from 'lodash-es';

export const pickPatientBirthData = (patientBirthDataModel, data) =>
  pick(data, patientBirthDataModel.nonMetadataColumns);
