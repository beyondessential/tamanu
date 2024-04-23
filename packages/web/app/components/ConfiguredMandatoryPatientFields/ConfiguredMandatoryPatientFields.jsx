import React, { useEffect, useState } from 'react';

import { useSettings } from '../../contexts/Settings';
import { LocalisedField } from '..';

export const ConfiguredMandatoryPatientFields = ({ fields, showMandatory = true }) => {
  const { getSetting } = useSettings();
  const [fieldsToShow, setFieldsToShow] = useState([]);

  useEffect(() => {
    const configuredFieldsToShow = Object.keys(fields)
      // Check if fields are mandatory and if we want to show mandatory fields or not
      .filter(
        fieldName => !!getSetting(`localisation.fields.${fieldName}.requiredPatientData`) === showMandatory,
      )
      // Check if any condition is there for vibisibility
      .filter(fieldName => (fields[fieldName].condition ? fields[fieldName].condition() : true))
      .map(fieldName => ({
        ...fields[fieldName],
        name: fieldName,
        required: showMandatory,
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
