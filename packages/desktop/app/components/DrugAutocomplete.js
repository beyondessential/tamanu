import React from 'react';
import { connect } from 'react-redux';
import { DrugsCollection } from '../collections';
import { DrugModel } from '../models';
import { CommonAutocomplete } from './CommonAutocomplete';

const DrugAutocomplete = ({
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
    ModelClass={DrugModel}
    collection={collection}
    onChange={onChange}
    formatOptionLabel={({ code, name }) => `${code} - ${name}`}
  />
);

function mapStateToProps(state) {
  return {
    currentPath: state.router.location.pathname,
    collection: new DrugsCollection(),
  };
}

export default connect(mapStateToProps)(DrugAutocomplete);
