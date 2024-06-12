import { PATIENT_DETAIL_LAYOUTS } from '@tamanu/constants';
import { useLocalisation } from '../../contexts/Localisation';
import { SECONDARY_LOCATION_HIERARCHY_FIELDS } from './layouts/cambodia/patientFields/CambodiaLocationFields';
import { useHierarchyAncestorsQuery } from '../../api/queries/useHierarchyAncestorsQuery';
import { useFilterPatientFields } from './useFilterPatientFields';

// Some values for patient fields are not persisted to database and rather are derived from other fields.
// This hook computes the initial values for these fields.
// For example, in Cambodia layout, the secondary patient location hierarchy is not stored in the patient record beyond the secondary village ID.
// Attempting to prepare the values from within the form state is error-prone as it interacts poorly with form logic.
export const useComputedInitialValues = ({ additionalData }) => {
  const { getLocalisation } = useLocalisation();
  const layout = getLocalisation('layouts.patientDetails') || PATIENT_DETAIL_LAYOUTS.GENERIC;
  const isCambodiaLayout = layout === PATIENT_DETAIL_LAYOUTS.CAMBODIA;
  const { data: ancestors, isLoading } = useHierarchyAncestorsQuery(
    additionalData.secondaryVillageId,
    {
      enabled: isCambodiaLayout && !!additionalData.secondaryVillageId,
    },
  );
  const { fieldsToShow } = useFilterPatientFields({
    fields: SECONDARY_LOCATION_HIERARCHY_FIELDS,
    filterByMandatory: true,
  });

  if (isLoading) return { isLoading: true };

  const initialValues = Object.fromEntries(
    fieldsToShow.map(({ name, referenceType }) => [name, ancestors[referenceType]]),
  );
  return { data: initialValues };
};
