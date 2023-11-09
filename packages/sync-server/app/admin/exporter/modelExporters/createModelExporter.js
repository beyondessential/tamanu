import { REFERENCE_TYPE_VALUES } from '@tamanu/constants';
import { AdministeredVaccineExporter } from './AdministeredVaccineExporter';
import { DefaultDataExporter } from './DefaultDataExporter';
import { PatientExporter } from './PatientExporter';
import { LabTestPanelExporter } from './LabTestPanelExporter';
import { PermissionExporter } from './PermissionExporter';
import { PatientFieldDefinitionExporter } from './PatientFieldDefinitionExporter';
import { ReferenceDataExporter } from './ReferenceDataExporter';

const CustomExportersByDataType = {
  permission: PermissionExporter,
  patient: PatientExporter,
  administeredVaccine: AdministeredVaccineExporter,
  labTestPanel: LabTestPanelExporter,
  patientFieldDefinition: PatientFieldDefinitionExporter,
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
