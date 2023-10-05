import React, { useEffect, useState } from 'react';

import { useLocalisation } from '../../contexts/Localisation';
import { LocalisedField } from '..';

export const ConfiguredMandatoryPatientFields = ({ fields, showMandatory = true }) => {
  const { getLocalisation } = useLocalisation();
  const [fieldsToShow, setFieldsToShow] = useState([]);

  useEffect(() => {
    const configuredFieldsToShow = Object.keys(fields)
      // Check if fields are mandatory and if we want to show mandatory fields or not
      .filter(fieldName => !!getLocalisation(`fields.${fieldName}.required`) === showMandatory)
      // Check if any condition is there for vibisibility
      .filter(fieldName => (fields[fieldName].condition ? fields[fieldName].condition() : true))
      .map(fieldName => ({ ...fields[fieldName], name: fieldName }));

    setFieldsToShow(configuredFieldsToShow);

    // We only need to work out which fields to show once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return fieldsToShow.length ? (
    <>
      {fieldsToShow.map(field => (
        <LocalisedField {...field} />
      ))}
    </>
  ) : null;
};
