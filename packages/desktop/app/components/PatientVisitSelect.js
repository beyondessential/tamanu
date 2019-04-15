import React from 'react';
import moment from 'moment';
import { capitalize } from 'lodash';
import { PatientRelationSelect } from './PatientRelationSelect';
import { dateFormat } from '../constants';

export const VISIT_SELECT_TEMPLATE = visit => `${moment(visit.startDate).format(dateFormat)} (${capitalize(visit.visitType)})`;

const getCurrentVisit = ({ patientModel, onChange, name }) => {
  const collection = patientModel.get('visits');
  const currentVisit = collection.getCurrentVisit();
  if (currentVisit) {
    onChange({ target: { name, value: currentVisit.get('_id') } }); // trigger change
    return currentVisit.get('_id');
  }
  return null;
};

export const PatientVisitSelect = ({
  onChange, value, patientModel, name="visit", label="Visits", ...props
}) => (
  <PatientRelationSelect
    label={label}
    relation="visits"
    patientModel={patientModel}
    template={VISIT_SELECT_TEMPLATE}
    name={name}
    onChange={onChange}
    value={value || getCurrentVisit({ patientModel, name, onChange })}
    {...props}
  />
);

export const PatientVisitSelectField = ({ field, ...props }) => (
  <PatientVisitSelect
    value={field.value || ''}
    {...field}
    {...props}
  />
);
