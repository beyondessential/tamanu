import React from 'react';
import { Box } from '@material-ui/core';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { Modal } from '../Modal';
import { Heading4, SmallBodyText } from '../Typography';
import { DateTimeField, Field, Form, SelectField, TextField } from '../Field';
import { useApi } from '../../api';
import { TableFormFields } from '../Table';
import { Colors } from '../../constants';
import { ModalActionRow } from '../ModalActionRow';

const StyledTableFormFields = styled(TableFormFields)`
  margin-top: 20px;
  margin-bottom: 30px;

  thead tr th {
    text-align: left;
    background: ${Colors.white};
    font-size: 14px;
    font-weight: 500;
    color: ${Colors.midText};
  }

  tbody tr td {
    font-size: 14px;
  }
`;

const getTableTabIndex = (row, col, len) => len * row + col + 1;

const useLabTestResults = labRequestId => {
  const api = useApi();
  return useQuery(
    ['labTestResults', labRequestId],
    () => api.get(`labTestType/${labRequestId}/tests`),
    { enabled: !!labRequestId },
  );
};

const AccessorField = ({ component, id, name, ...props }) => (
  <Field {...props} name={`${id}.${name}`} component={component} />
);

const getColumns = len => [
  {
    key: 'testType',
    title: 'Test type',
    width: '100px',
    accessor: row => row.testType.name,
  },
  {
    key: 'result',
    title: 'Result',
    accessor: (row, i) => (
      <AccessorField component={TextField} name="result" id={row.id} tabIndex={i + 1} />
    ),
  },
  {
    key: 'unit',
    title: 'Units',
    width: '80px',
    accessor: row => row.testType.unit,
  },
  {
    key: 'method',
    title: 'Method',
    accessor: (row, i) => (
      <AccessorField
        id={row.id}
        component={SelectField}
        name="method"
        tabIndex={getTableTabIndex(1, i, len)}
        options={[
          { value: 'manual', label: 'Manual' },
          { value: 'machine', label: 'Machine' },
        ]}
      />
    ),
  },
  {
    key: 'verification',
    title: 'Verification',
    accessor: (row, i) => (
      <AccessorField
        id={row.id}
        component={TextField}
        name="verification"
        tabIndex={getTableTabIndex(2, i, len)}
      />
    ),
  },
  {
    key: 'completedDate',
    title: 'Completed',
    width: '240px',
    accessor: (row, i) => (
      <AccessorField
        id={row.id}
        component={DateTimeField}
        name="completedDate"
        tabIndex={getTableTabIndex(3, i, len)}
      />
    ),
  },
];

export const LabTestResultsForm = ({ labTestResults, onClose }) => {
  return (
    <>
      <Box display="flex" justifyContent="space-between">
        <div>
          <Heading4 marginBottom="10px">Enter test results</Heading4>
          <SmallBodyText color="textTertiary">
            Please record test results and other test result details.
          </SmallBodyText>
        </div>
        <Field name="laboratoryOfficer" label="Lab officer" tabIndex={0} component={TextField} />
      </Box>
      <StyledTableFormFields columns={getColumns(labTestResults.length)} data={labTestResults} />
      <ModalActionRow onConfirm={onClose} onCancel={onClose} />
    </>
  );
};

export const LabTestResultsModal = ({ labRequest, onClose, open }) => {
  const { data: labTestResults } = useLabTestResults(labRequest.id);
  const { displayId } = labRequest;
  return (
    <Modal width="lg" title={`Enter results | Test ID ${displayId}`} open={open} onClose={onClose}>
      {labTestResults?.length && (
        <Form
          render={props => (
            <LabTestResultsForm labTestResults={labTestResults} onClose={onClose} {...props} />
          )}
        />
      )}
    </Modal>
  );
};
