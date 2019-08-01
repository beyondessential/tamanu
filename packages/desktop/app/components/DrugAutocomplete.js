import React from 'react';
import { connect } from 'react-redux';
import { DrugsCollection } from '../collections';
import { DrugModel } from '../models';
import { AutocompleteInput } from './Field/AutocompleteField';

const DrugAutocomplete = ({ label, required, name, className, collection, onChange }) => (
  <AutocompleteInput
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
    collection: new DrugsCollection(),
  };
}

export default connect(mapStateToProps)(DrugAutocomplete);
