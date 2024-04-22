import { pick } from 'lodash';

export const pickPatientBirthData = (patientBirthDataModel, data) =>
  pick(data, patientBirthDataModel.nonMetadataColumns);
