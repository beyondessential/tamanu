import React from 'react';
import PropTypes from 'prop-types';
import { PatientsCollection } from '../collections';
import { PatientModel } from '../models';
import { AutocompleteInput } from './Field';

export const PatientAutocompleteField = ({ field, ...props }) => (
  <PatientAutocomplete {...field} {...props} />
);

export const PatientAutocomplete = ({
  label,
  required,
  name,
  className,
  collection,
  onChange,
  ...props
}) => (
  <AutocompleteInput
    label={label}
    required={required}
    name={name}
    className={className}
    ModelClass={PatientModel}
    collection={collection}
    onChange={onChange}
    formatOptionLabel={({ displayId, firstName, lastName }) =>
      `${displayId} - ${firstName} ${lastName}`
    }
    {...props}
  />
);

PatientAutocomplete.propTypes = {
  collection: PropTypes.instanceOf(Object),
};

PatientAutocomplete.defaultProps = {
  collection: new PatientsCollection(),
};
