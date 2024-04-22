import React from 'react';

import { LocalisedField } from '../../components';
import { useFilterPatientFields } from './useFilterPatientFields';

export const ConfiguredMandatoryPatientFields = (props) => {
  const { fieldsToShow } = useFilterPatientFields(props);

  return fieldsToShow.length ? (
    <>
      {fieldsToShow.map(field => (
        <LocalisedField key={field.name} {...field} />
      ))}
    </>
  ) : null;
};
