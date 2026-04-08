import { useMemo } from 'react';
import { isBoolean } from 'lodash';
import { useSettings } from '../../contexts/Settings';

/**
 * @param {object} props
 * @param {object} props.fields - field definitions keyed by field name
 * @param {boolean} [props.filterByMandatory] - filter by required setting
 * @param {Map<string, number>|null} [props.orderByFieldKey] - optional layout sort order map
 */
export const useFilterPatientFields = ({ fields, filterByMandatory, orderByFieldKey }) => {
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

    const filtered = Object.keys(fields)
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

    // Sort by layout order if available
    if (orderByFieldKey) {
      filtered.sort((a, b) => {
        const orderA = orderByFieldKey.get(a.name) ?? Number.MAX_SAFE_INTEGER;
        const orderB = orderByFieldKey.get(b.name) ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });
    }

    return filtered;
    // We only need to work out which fields to show if either fields or filterByMandatory are changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, filterByMandatory, orderByFieldKey]);

  return { fieldsToShow };
};
