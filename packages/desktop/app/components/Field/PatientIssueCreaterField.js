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

export const PatientIssueCreator = ({ config, createIssue }) => {
  React.useEffect(() => {
    (async () => createIssue({ type: config.issueType, note: config.issueNote || }))();
  }, [])

  return (
    <Text>A patient issue has been generated</Text>
  );
};

export const DumbPatientIssueCreatorField = props => (
  <PatientIssueCreator
    name={props.field.name}
    value={props.field.value}
    config={props.field.config}
    onChange={props.field.onChange}
    {...props}
  />
);

export const PatientIssueCreatorField = connect(state => ({
  patient: state.patient,
}))(connectApi((api, dispatch, { patient }) => ({
  createIssue: async data => {
    console.log('Adding issue: ', { ...data, patientId: patient.id })
    await api.post(`patientIssue`, { ...data, patientId: patient.id });
  },
}))(DumbPatientIssueCreatorField));

PatientIssueCreator.propTypes = {
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  config: PropTypes.shape({
    issueType: PropTypes.string, // 'warning' | 'issue'
  })
};

PatientIssueCreator.defaultProps = {
  name: undefined,
  value: undefined,
  onChange: undefined,
  config: undefined,
};
