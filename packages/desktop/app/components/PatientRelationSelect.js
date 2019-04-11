import React from 'react';
import PropTypes from 'prop-types';
import { PatientModel } from '../models';
import { SelectInput } from './Field';

const getOptions = (collection, template) => collection.map(model => ({
  value: model.get('_id'),
  label: template(model.toJSON()),
}));

const getAutoSelectValue = (collection, relation) => {
  if (relation === 'visits') {
    const currentVisit = collection.getCurrentVisit();
    if (currentVisit) return currentVisit.get('_id');
  }
  return null;
};

export default function PatientRelationSelect({
  patientModel, relation, template, value, ...props
}) {
  let options = [];
  let initValue = null;
  const relationCollection = patientModel.get(relation);
  if (relationCollection.length) {
    options = getOptions(relationCollection, template);
    initValue = getAutoSelectValue(relationCollection, relation);
  }

  return (
    <SelectInput
      options={options}
      value={value || initValue}
      {...props}
    />
  );
}

PatientRelationSelect.propTypes = {
  patientModel: PropTypes.instanceOf(PatientModel),
  relation: PropTypes.string.isRequired,
  template: PropTypes.func.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
};

PatientRelationSelect.defaultProps = {
  patientModel: new PatientModel(),
  onChange: () => {},
  value: '',
};
