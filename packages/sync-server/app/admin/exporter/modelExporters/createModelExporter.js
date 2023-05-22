import { REFERENCE_TYPE_VALUES } from 'shared/constants';
import { AdministeredVaccineExporter } from './AdministeredVaccineExporter';
import { DefaultDataExporter } from './DefaultDataExporter';
import { PatientExporter } from './PatientExporter';
import { PermissionExporter } from './PermissionExporter';
import { ReferenceDataExporter } from './ReferenceDataExporter';

const CustomExportersByDataType = {
  permission: PermissionExporter,
  patient: PatientExporter,
  administeredVaccine: AdministeredVaccineExporter,
};
export const createModelExporter = (models, dataType) => {
  const referenceDataTypes = [...REFERENCE_TYPE_VALUES, 'diagnosis'];

  if (referenceDataTypes.includes(dataType)) {
    return new ReferenceDataExporter(models, dataType);
  }

  const CustomExporterClass = CustomExportersByDataType[dataType];
  return CustomExporterClass
    ? new CustomExporterClass(models, dataType)
    : new DefaultDataExporter(models, dataType);
};
