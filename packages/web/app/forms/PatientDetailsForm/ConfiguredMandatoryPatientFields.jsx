import React, { useMemo } from 'react';

import { isBoolean } from 'lodash';
import { useLocalisation } from '../../contexts/Localisation';
import { LocalisedField } from '../../components';

export const ConfiguredMandatoryPatientFields = ({ fields, filterByMandatory }) => {
  const { getLocalisation } = useLocalisation();

  const fieldsToShow = useMemo(() => {
    const checkCondition = fieldName =>
      !fields[fieldName].condition || fields[fieldName].condition();
    const checkMandatory = fieldName => {
      // If this is undefined, its not configurable and should always show
      const isRequiredPatientData = getLocalisation(`fields.${fieldName}.requiredPatientData`);
      return (
        !isBoolean(filterByMandatory) ||
        !isBoolean(isRequiredPatientData) ||
        isRequiredPatientData === filterByMandatory
      );
    };

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

  return fieldsToShow.length ? (
    <>
      {fieldsToShow.map(field => (
        <LocalisedField key={field.name} {...field} />
      ))}
    </>
  ) : null;
};
