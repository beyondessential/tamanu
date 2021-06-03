import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { connect } from 'react-redux';

import { connectApi } from '../../api/connectApi';

const Text = styled.p`
  margin: 0;
  padding: 0;
  align-self: flex-end;
`;

export const PatientIssueCreater = ({ value, name, config, onChange, createIssue }) => {
  console.log({ value, name, config, onChange });
  React.useEffect(() => {
    (async () => createIssue({ type: 'warning', note: 'This is a test issue' }))();
  }, [])

  return (
    <Text>A patient issue has been generated</Text>
  );
};

export const DumbPatientIssueCreaterField = props => (
  <PatientIssueCreater
    name={props.field.name}
    value={props.field.value}
    config={props.field.config}
    onChange={props.field.onChange}
    {...props}
  />
);

export const PatientIssueCreaterField = connect(state => ({
  patient: state.patient,
}))(connectApi((api, dispatch, { patient }) => ({
  createIssue: async data => {
    console.log('Adding issue: ', { ...data, patientId: patient.id })
    await api.post(`patientIssue`, { ...data, patientId: patient.id });
  },
}))(DumbPatientIssueCreaterField));

PatientIssueCreater.propTypes = {
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  config: PropTypes.shape({
    issueType: PropTypes.string, // 'warning' | 'issue'
  })
};

PatientIssueCreater.defaultProps = {
  name: undefined,
  value: undefined,
  onChange: undefined,
  config: undefined,
};
