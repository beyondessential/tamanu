import React, { useCallback, useMemo } from 'react';
import { Box } from '@material-ui/core';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { Modal } from '../Modal';
import { Heading4, SmallBodyText } from '../Typography';
import { DateTimeField, Field, Form, SuggesterSelectField, TextField } from '../Field';
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

const useLabTestResults = labRequestId => {
  const api = useApi();
  return useQuery(
    ['labTestResults', labRequestId],
    () => api.get(`labTestType/${labRequestId}/tests`),
    { enabled: !!labRequestId },
  );
};

const AccessorField = ({ id, name, ...props }) => <Field {...props} name={`${id}.${name}`} />;

const getColumns = (len, onChangeResult) => {
  const tabIndex = (row, col) => len * row + col + 1;
  return [
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
        <AccessorField
          component={TextField}
          name="result"
          onChange={onChangeResult}
          id={row.id}
          tabIndex={tabIndex(0, i)}
        />
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
      accessor: (row, i) => {
        return (
          <AccessorField
            id={row.id}
            endpoint="labTestMethod"
            name="method"
            component={SuggesterSelectField}
            tabIndex={tabIndex(1, i)}
          />
        );
      },
    },
    {
      key: 'verification',
      title: 'Verification',
      accessor: (row, i) => (
        <AccessorField
          id={row.id}
          component={TextField}
          name="verification"
          tabIndex={tabIndex(2, i)}
        />
      ),
    },
    {
      key: 'completedDate',
      title: 'Completed',
      width: '260px',
      accessor: (row, i) => (
        <AccessorField
          id={row.id}
          component={DateTimeField}
          name="completedDate"
          tabIndex={tabIndex(3, i)}
        />
      ),
    },
  ];
};

export const LabTestResultsForm = ({ labTestResults, onClose, values, setFieldValue }) => {
  const onChangeResult = useCallback(
    e => {
      const { name, value } = e.target;
      const [id, field] = name.split('.');
      if (values[id]?.[field] || !value) return;
      ['method', 'completedDate'].forEach(autofillName => {
        const unique = Object.values(values).reduce(
          (acc, v) =>
            v[autofillName] && !acc.includes(v[autofillName]) ? [...acc, v[autofillName]] : acc,
          [],
        );
        if (!unique.length || values[id]?.[autofillName]) return;
        setFieldValue(`${id}.${autofillName}`, unique[0]);
      });
    },
    [values, setFieldValue],
  );

  const columns = useMemo(() => getColumns(labTestResults.length, onChangeResult), [
    labTestResults.length,
    onChangeResult,
  ]);

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
      <StyledTableFormFields columns={columns} data={labTestResults} />
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
