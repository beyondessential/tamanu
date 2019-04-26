import React from 'react';
import PropTypes from 'prop-types';
import { DiagnosesCollection } from '../collections';
import { DiagnosisModel } from '../models';
import { CommonAutocomplete } from './CommonAutocomplete';

export const DiagnosisAutocompleteField = ({ field, ...props }) => (
  <DiagnosisAutocomplete
    {...field}
    {...props}
  />
);

export const DiagnosisAutocomplete = ({
  label,
  required,
  name,
  className,
  collection,
  onChange,
  ...props
}) => (
  <CommonAutocomplete
    label={label}
    required={required}
    name={name}
    className={className}
    ModelClass={DiagnosisModel}
    collection={collection}
    onChange={onChange}
    formatOptionLabel={diagnosis => diagnosis.name}
    {...props}
  />
);

DiagnosisAutocomplete.propTypes = {
  collection: PropTypes.instanceOf(Object),
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  className: PropTypes.string,
  placeholder: PropTypes.string,
};

DiagnosisAutocomplete.defaultProps = {
  required: false,
  className: '',
  placeholder: 'Start typing..',
  collection: new DiagnosesCollection(),
};
