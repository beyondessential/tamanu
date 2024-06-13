import { PATIENT_DETAIL_LAYOUTS } from '@tamanu/constants';
import { useLocalisation } from '../../contexts/Localisation';
import { SECONDARY_LOCATION_HIERARCHY_FIELDS } from './layouts/cambodia/patientFields/CambodiaLocationFields';
import { useHierarchyAncestorsQuery } from '../../api/queries/useHierarchyAncestorsQuery';
import { useFilterPatientFields } from './useFilterPatientFields';

// In Cambodia layout, the secondary patient location hierarchy is not stored in the patient record beyond the secondary village ID.
// This data needs to be ready at time of first form initialization.
// Attempting to prepare the values from within the form state is error-prone as interacts poorly with form logic.
export const useCambodiaSecondaryAddressInitialData = secondaryVillageId => {
  const { getLocalisation } = useLocalisation();
  const layout = getLocalisation('layouts.patientDetails') || PATIENT_DETAIL_LAYOUTS.GENERIC;
  const isCambodiaLayout = layout === PATIENT_DETAIL_LAYOUTS.CAMBODIA;
  const isEnabled = isCambodiaLayout && Boolean(secondaryVillageId);
  const { data: ancestors, isFetching } = useHierarchyAncestorsQuery(secondaryVillageId, {
    enabled: isEnabled,
  });
  const { fieldsToShow } = useFilterPatientFields({
    fields: SECONDARY_LOCATION_HIERARCHY_FIELDS,
  });

  if (!isEnabled) return { data: {}, isLoading: false };
  if (isFetching) return { data: {}, isLoading: true };

  const initialValues = Object.fromEntries(
    fieldsToShow.map(({ name, referenceType }) => [name, ancestors[referenceType]]),
  );
  return { data: initialValues, isLoading: false };
};
