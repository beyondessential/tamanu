import { REFERENCE_TYPE_VALUES } from 'shared/constants';
import { AdministeredVaccineExporter } from './administeredVaccineExporter';
import { DefaultDataExporter } from './defaultDataExporter';
import { PatientExporter } from './patientExporter';
import { PermissionExporter } from './permissionExporter';
import { ReferenceDataExporter } from './referenceDataExporter';

export const modelExporterFactory = (models, dataType) => {
  const referenceDataTypes = [...REFERENCE_TYPE_VALUES, 'diagnosis'];
  console.log({ dataType });
  if (referenceDataTypes.includes(dataType)) {
    return new ReferenceDataExporter(models, dataType);
  }
  if (dataType === 'permission') {
    return new PermissionExporter(models, dataType);
  }

  if (dataType === 'patient') {
    return new PatientExporter(models, dataType);
  }

  if (dataType === 'administeredVaccine') {
    return new AdministeredVaccineExporter(models, dataType);
  }

  return new DefaultDataExporter(models, dataType);
};
