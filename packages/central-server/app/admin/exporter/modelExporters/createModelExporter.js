import {
  OTHER_REFERENCE_TYPES,
  PSEUDO_REFERENCE_TYPES,
  REFERENCE_TYPE_VALUES,
  REFERENCE_TYPES,
} from '@tamanu/constants';
import { AdministeredVaccineExporter } from './AdministeredVaccineExporter';
import { DefaultDataExporter } from './DefaultDataExporter';
import { DrugExporter } from './DrugExporter';
import { InvoiceInsurancePlanItemExporter } from './InvoiceInsurancePlanItemExporter';
import { InvoicePriceListChargingExporter } from './InvoicePriceListChargingExporter';
import { InvoicePriceListItemExporter } from './InvoicePriceListItemExporter';
import { InvoiceProductExporter } from './InvoiceProductExporter';
import { LabTestPanelExporter } from './LabTestPanelExporter';
import { MedicationSetExporter } from './MedicationSetExporter';
import { MedicationTemplateExporter } from './MedicationTemplateExporter';
import { PatientExporter } from './PatientExporter';
import { PatientFieldDefinitionExporter } from './PatientFieldDefinitionExporter';
import { PermissionExporter } from './PermissionExporter';
import { ProcedureTypeExporter } from './ProcedureTypeExporter';
import { ReferenceDataExporter } from './ReferenceDataExporter';
import { TaskSetExporter } from './TaskSetExporter';
import { TaskTemplateExporter } from './TaskTemplateExporter';
import { TranslatedStringExporter } from './TranslatedStringExporter';
import { UserExporter } from './UserExporter';

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
  [PSEUDO_REFERENCE_TYPES.INVOICE_PRICE_LIST_CHARGING]: InvoicePriceListChargingExporter,
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
