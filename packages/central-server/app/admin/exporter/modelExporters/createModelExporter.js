import { REFERENCE_TYPE_VALUES } from '@tamanu/constants';
import { AdministeredVaccineExporter } from './AdministeredVaccineExporter';
import { DefaultDataExporter } from './DefaultDataExporter';
import { PatientExporter } from './PatientExporter';
import { LabTestPanelExporter } from './LabTestPanelExporter';
import { PermissionExporter } from './PermissionExporter';
import { PatientFieldDefinitionExporter } from './PatientFieldDefinitionExporter';
import { ReferenceDataExporter } from './ReferenceDataExporter';
import { TranslatedStringExporter } from './TranslatedStringExporter';

const CustomExportersByDataType = {
  permission: PermissionExporter,
  patient: PatientExporter,
  administeredVaccine: AdministeredVaccineExporter,
  labTestPanel: LabTestPanelExporter,
  patientFieldDefinition: PatientFieldDefinitionExporter,
  translatedString: TranslatedStringExporter,
};
export const createModelExporter = (context, dataType) => {
  const referenceDataTypes = [...REFERENCE_TYPE_VALUES, 'diagnosis'];
  const CustomExporterClass = CustomExportersByDataType[dataType];
  if (CustomExporterClass) {
    return new CustomExporterClass(context, dataType);
  }
  if (referenceDataTypes.includes(dataType)) {
    return new ReferenceDataExporter(context, dataType);
  }

  return new DefaultDataExporter(context, dataType);
};
