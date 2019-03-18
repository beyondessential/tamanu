import React from 'react';
import { connect } from 'react-redux';
import { PatientsCollection } from '../collections';
import { PatientModel } from '../models';
import { CommonAutocomplete } from './CommonAutocomplete';

const PatientAutocomplete = ({
  label,
  required,
  name,
  className,
  collection,
  onChange,
}) => (
  <CommonAutocomplete
    label={label}
    required={required}
    name={name}
    className={className}
    ModelClass={PatientModel}
    collection={collection}
    onChange={onChange}
    formatOptionLabel={({ displayId, firstName, lastName }) => `${displayId} - ${firstName} ${lastName}`}
  />
);

function mapStateToProps(state) {
  return {
    currentPath: state.router.location.pathname,
    collection: new PatientsCollection(),
  };
}

export default connect(mapStateToProps)(PatientAutocomplete);
