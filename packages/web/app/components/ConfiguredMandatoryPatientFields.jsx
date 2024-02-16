import React, { useEffect, useState } from 'react';

import { useLocalisation } from '../contexts/Localisation';
import { LocalisedField } from '.';
import { isBoolean } from 'lodash';

export const ConfiguredMandatoryPatientFields = ({ fields, filterByMandatory }) => {
  const { getLocalisation } = useLocalisation();
  const [fieldsToShow, setFieldsToShow] = useState([]);

  useEffect(() => {
    const configuredFieldsToShow = Object.keys(fields)
      // Check if fields are mandatory and if we want to show mandatory fields or not
      .filter(
        fieldName =>
          !isBoolean(filterByMandatory) ||
          !!getLocalisation(`fields.${fieldName}.requiredPatientData`) === filterByMandatory,
      )
      // Check if any condition is there for vibisibility
      .filter(fieldName => (fields[fieldName].condition ? fields[fieldName].condition() : true))
      .map(fieldName => ({
        ...fields[fieldName],
        required: isBoolean(filterByMandatory)
          ? filterByMandatory
          : !!getLocalisation(`fields.${fieldName}.requiredPatientData`),
        name: fieldName,
      }));

    setFieldsToShow(configuredFieldsToShow);

    // We only need to work out which fields to show if fields are changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

  return fieldsToShow.length ? (
    <>
      {fieldsToShow.map(field => (
        <LocalisedField key={field.name} {...field} />
      ))}
    </>
  ) : null;
};
