import { useMemo } from 'react';
import { useLocalisation } from '../../contexts/Localisation';
import { isBoolean } from 'lodash';

export const useFilterPatientFields = ({ fields, filterByMandatory }) => {
  const { getLocalisation } = useLocalisation();

  const fieldsToShow = useMemo(() => {
    const checkCondition = fieldName =>
      !fields[fieldName].condition || fields[fieldName].condition();
    const checkMandatory = fieldName =>
      !isBoolean(filterByMandatory) ||
      getLocalisation(`fields.${fieldName}.requiredPatientData`) === filterByMandatory;

    return Object.keys(fields)
      .filter(fieldName => checkMandatory(fieldName) && checkCondition(fieldName))
      .map(fieldName => ({
        ...fields[fieldName],
        required: !!getLocalisation(`fields.${fieldName}.requiredPatientData`),
        name: fieldName,
      }));
    // We only need to work out which fields to show if either fields or filterByMandatory are changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, filterByMandatory]);

  return { fieldsToShow };
};
