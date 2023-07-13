import React from 'react';
import { Box } from '@material-ui/core';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { Modal } from '../Modal';
import { Heading4, SmallBodyText } from '../Typography';
import { Field, Form, TextField } from '../Field';
import { useApi } from '../../api';
import { TableFormFields } from '../Table';
import { Colors } from '../../constants';

const StyledTableFormFields = styled(TableFormFields)`
  margin-top: 20px;

  thead tr th {
    text-align: left;
    background: ${Colors.white};
  }
`;

const useLabTestResults = labRequestId => {
  const api = useApi();
  return useQuery(
    ['labTestResults', labRequestId],
    () => api.get(`labTestType/${labRequestId}/tests`),
    { enabled: !!labRequestId },
  );
};

const ResultAccessor = ({ id }) => <Field name={`${id}.result`} component={TextField} />;

const columns = [
  {
    key: 'testType',
    title: 'Test type',
    accessor: row => row.testType.name,
  },
  {
    key: 'result',
    title: 'Result',
    accessor: row => <ResultAccessor id={row.id} />,
  },
  {
    key: 'unit',
    title: 'Units',
    accessor: row => row.testType.unit,
  },
];

export const LabTestResultsForm = ({ labTestResults }) => {
  return (
    <>
      <Box display="flex" justifyContent="space-between">
        <div>
          <Heading4 marginBottom="10px">Enter test results</Heading4>
          <SmallBodyText color="textTertiary">
            Please record test results and other test result details.
          </SmallBodyText>
        </div>
        <Field name="laboratoryOfficer" label="Lab officer" component={TextField} />
      </Box>
      <StyledTableFormFields columns={columns} data={labTestResults} />
    </>
  );
};

export const LabTestResultsModal = ({ labRequest, onClose, open }) => {
  const { data: labTestResults } = useLabTestResults(labRequest.id);
  const { displayId } = labRequest;
  return (
    <Modal width="md" title={`Enter results | Test ID ${displayId}`} open={open} onClose={onClose}>
      {labTestResults?.length && (
        <Form render={props => <LabTestResultsForm labTestResults={labTestResults} {...props} />} />
      )}
    </Modal>
  );
};
