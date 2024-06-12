import { PATIENT_DETAIL_LAYOUTS } from '@tamanu/constants';
import { useLocalisation } from '../../contexts/Localisation';
import { SECONDARY_LOCATION_HIERARCHY_FIELDS } from './layouts/cambodia/patientFields/CambodiaLocationFields';
import { useHierarchyAncestorsQuery } from '../../api/queries/useHierarchyAncestorsQuery';
import { useFilterPatientFields } from './useFilterPatientFields';

export const useComputedInitialValues = ({ additionalData }) => {
  const { getLocalisation } = useLocalisation();
  const layout = getLocalisation('layouts.patientDetails') || PATIENT_DETAIL_LAYOUTS.GENERIC;
  const { data: ancestors, isLoading } = useHierarchyAncestorsQuery(
    additionalData.secondaryVillageId,
    {
      enabled: layout === PATIENT_DETAIL_LAYOUTS.CAMBODIA,
    },
  );
  const { fieldsToShow } = useFilterPatientFields({
    fields: SECONDARY_LOCATION_HIERARCHY_FIELDS,
    filterByMandatory: true,
  });

  const initialValues = Object.fromEntries(
    fieldsToShow.map(({ name, referenceType }) => [name, ancestors[referenceType]]),
  );
  return { initialValues, isLoading };
};
