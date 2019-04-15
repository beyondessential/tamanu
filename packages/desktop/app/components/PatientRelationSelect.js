import React from 'react';
import PropTypes from 'prop-types';
import { PatientModel } from '../models';
import { SelectInput } from './Field';

const getOptions = ({ patientModel, relation, template }) => {
  const collection = patientModel.get(relation);
  if (!collection.length) return [];
  return collection.map(model => ({
    value: model.get('_id'),
    label: template(model.toJSON()),
  }));
};

export function PatientRelationSelect({
  patientModel, relation, template, ...props
}) {
  return (
    <SelectInput
      options={getOptions({ patientModel, relation, template })}
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
