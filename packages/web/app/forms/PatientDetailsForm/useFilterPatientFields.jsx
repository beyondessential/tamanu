import { useMemo } from 'react';
import { isBoolean } from 'lodash';
import { useSettings } from '../../contexts/Settings';

export const useFilterPatientFields = ({ fields, filterByMandatory }) => {
  const { getSetting } = useSettings();

  const fieldsToShow = useMemo(() => {
    const checkCondition = (fieldName) =>
      !fields[fieldName].condition || fields[fieldName].condition();
    const checkMandatory = (fieldName) => {
      const requiredConfiguration = getSetting(`fields.${fieldName}.requiredPatientData`);
      return (
        !isBoolean(filterByMandatory) ||
        !isBoolean(requiredConfiguration) ||
        requiredConfiguration === filterByMandatory
      );
    };

    return Object.keys(fields)
      .filter((fieldName) => checkMandatory(fieldName) && checkCondition(fieldName))
      .map((fieldName) => {
        // eslint-disable-next-line no-unused-vars
        const { condition, ...rest } = fields[fieldName];
        return {
          ...rest,
          required: !!getSetting(`fields.${fieldName}.requiredPatientData`),
          name: fieldName,
        };
      });
    // We only need to work out which fields to show if either fields or filterByMandatory are changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, filterByMandatory]);

  return { fieldsToShow };
};
