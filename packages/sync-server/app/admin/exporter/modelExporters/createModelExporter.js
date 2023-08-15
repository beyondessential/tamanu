import { REFERENCE_TYPE_VALUES } from 'shared/constants';
import { AdministeredVaccineExporter } from './AdministeredVaccineExporter';
import { DefaultDataExporter } from './DefaultDataExporter';
import { PatientExporter } from './PatientExporter';
import { LabPanelExporter } from './LabPanelExporter';
import { PermissionExporter } from './PermissionExporter';
import { ReferenceDataExporter } from './ReferenceDataExporter';

const CustomExportersByDataType = {
  permission: PermissionExporter,
  patient: PatientExporter,
  administeredVaccine: AdministeredVaccineExporter,
  labPanel: LabPanelExporter,
};
export const createModelExporter = (models, dataType) => {
  const referenceDataTypes = [...REFERENCE_TYPE_VALUES, 'diagnosis'];
  const CustomExporterClass = CustomExportersByDataType[dataType];
  if (CustomExporterClass) {
    return new CustomExporterClass(models, dataType);
  }
  if (referenceDataTypes.includes(dataType)) {
    return new ReferenceDataExporter(models, dataType);
  }

  return new DefaultDataExporter(models, dataType);
};
