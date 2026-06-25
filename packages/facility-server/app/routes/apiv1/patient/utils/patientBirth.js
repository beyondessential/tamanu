import { pick } from 'es-toolkit/compat';

export const pickPatientBirthData = (patientBirthDataModel, data) =>
  pick(data, patientBirthDataModel.nonMetadataColumns);
