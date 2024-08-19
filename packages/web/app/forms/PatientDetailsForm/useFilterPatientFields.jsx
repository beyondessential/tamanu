import { useMemo } from 'react';
import { isBoolean } from 'lodash';
import { useSettings } from '../../contexts/Settings';

export const useFilterPatientFields = ({ fields, filterByMandatory }) => {
  const { getSetting } = useSettings();

  const fieldsToShow = useMemo(() => {
    const checkCondition = fieldName =>
      !fields[fieldName].condition || fields[fieldName].condition();
    const checkMandatory = fieldName => {
      const requiredConfiguration = getSetting(
        `localisation.fields.${fieldName}.requiredPatientData`,
      );
      return (
        !isBoolean(filterByMandatory) ||
        !isBoolean(requiredConfiguration) ||
        requiredConfiguration === filterByMandatory
      );
    };

    return Object.keys(fields)
      .filter(fieldName => checkMandatory(fieldName) && checkCondition(fieldName))
      .map(fieldName => ({
        ...fields[fieldName],
        required: !!getSetting(`localisation.fields.${fieldName}.requiredPatientData`),
        name: fieldName,
      }));
    // We only need to work out which fields to show if either fields or filterByMandatory are changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, filterByMandatory]);

  return { fieldsToShow };
};
