import { OTHER_REFERENCE_TYPES, REFERENCE_TYPE_VALUES, REFERENCE_TYPES } from '@tamanu/constants';
import { AdministeredVaccineExporter } from './AdministeredVaccineExporter';
import { DefaultDataExporter } from './DefaultDataExporter';
import { PatientExporter } from './PatientExporter';
import { LabTestPanelExporter } from './LabTestPanelExporter';
import { PermissionExporter } from './PermissionExporter';
import { PatientFieldDefinitionExporter } from './PatientFieldDefinitionExporter';
import { ReferenceDataExporter } from './ReferenceDataExporter';
import { TranslatedStringExporter } from './TranslatedStringExporter';
import { TaskSetExporter } from './TaskSetExporter';
import { UserExporter } from './UserExporter';
import { TaskTemplateExporter } from './TaskTemplateExporter';
import { DrugExporter } from './DrugExporter';
import { MedicationTemplateExporter } from './MedicationTemplateExporter';
import { MedicationSetExporter } from './MedicationSetExporter';
import { ProcedureTypeExporter } from './ProcedureTypeExporter';
import { InvoicePriceListItemExporter } from './InvoicePriceListItemExporter';
import { InvoiceInsurancePlanItemExporter } from './InvoiceInsurancePlanItemExporter';
import { InvoiceProductExporter } from './InvoiceProductExporter';

const CustomExportersByDataType = {
  permission: PermissionExporter,
  patient: PatientExporter,
  administeredVaccine: AdministeredVaccineExporter,
  labTestPanel: LabTestPanelExporter,
  patientFieldDefinition: PatientFieldDefinitionExporter,
  translatedString: TranslatedStringExporter,
  user: UserExporter,
  [REFERENCE_TYPES.TASK_TEMPLATE]: TaskTemplateExporter,
  [REFERENCE_TYPES.TASK_SET]: TaskSetExporter,
  [REFERENCE_TYPES.DRUG]: DrugExporter,
  [REFERENCE_TYPES.MEDICATION_TEMPLATE]: MedicationTemplateExporter,
  [REFERENCE_TYPES.MEDICATION_SET]: MedicationSetExporter,
  [REFERENCE_TYPES.PROCEDURE_TYPE]: ProcedureTypeExporter,
  invoicePriceListItem: InvoicePriceListItemExporter,
  invoiceInsurancePlanItem: InvoiceInsurancePlanItemExporter,
  [OTHER_REFERENCE_TYPES.INVOICE_PRODUCT]: InvoiceProductExporter,
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
