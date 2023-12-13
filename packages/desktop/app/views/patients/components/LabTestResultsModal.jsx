import { Box } from '@material-ui/core';
import { Alert, AlertTitle, Skeleton } from '@material-ui/lab';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { keyBy, pick } from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { useApi } from '../../../api';
import { useLabTestResultsQuery } from '../../../api/queries/useLabTestResultsQuery';
import { ConfirmCancelRow } from '../../../components/ButtonRow';
import { DateTimeField, Form, SuggesterSelectField, TextField } from '../../../components/Field';
import { FormModal } from '../../../components/FormModal';
import { TableFormFields } from '../../../components/Table';
import { BodyText, Heading4, SmallBodyText } from '../../../components/Typography';
import { Colors } from '../../../constants';
import { useAuth } from '../../../contexts/Auth';
import { AccessorField, LabResultAccessorField } from './AccessorField';

const TableContainer = styled.div`
  overflow-y: auto;
  max-height: 48vh;
  margin: 0px 30px;
`;

const StyledModal = styled(FormModal)`
  .MuiDialogActions-root {
    display: none;
  }
`;

const StyledTableFormFields = styled(TableFormFields)`
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

const StyledConfirmCancelRow = styled(ConfirmCancelRow)`
  padding-right: 30px;
  padding-top: 18px;
  margin-top: 20px;
  border-top: 1px solid ${Colors.outline};
`;

const LAB_TEST_PROPERTIES = {
  COMPLETED_DATE: 'completedDate',
  ID: 'id',
  LAB_TEST_METHOD_ID: 'labTestMethodId',
  RESULT: 'result',
  VERIFICATION: 'verification',
};

const AUTOFILL_FIELD_NAMES = [
  LAB_TEST_PROPERTIES.COMPLETED_DATE,
  LAB_TEST_PROPERTIES.LAB_TEST_METHOD_ID,
];

const getColumns = (count, onChangeResult, areLabTestResultsReadOnly) => {
  // Generate tab index for vertical tabbing through the table
  const tabIndex = (col, row) => count * col + row + 1;
  return [
    {
      key: 'labTestType',
      title: 'Test type',
      width: '120px',
      accessor: row => row.labTestType.name,
    },
    {
      key: LAB_TEST_PROPERTIES.RESULT,
      title: 'Result',
      accessor: (row, i) => {
        const { resultType, options } = row.labTestType;
        return (
          <LabResultAccessorField
            resultType={resultType}
            options={options}
            disabled={areLabTestResultsReadOnly}
            name={LAB_TEST_PROPERTIES.RESULT}
            onChange={e => onChangeResult(e.target.value, row.id)}
            id={row.id}
            tabIndex={tabIndex(0, i)}
          />
        );
      },
    },
    {
      key: 'unit',
      title: 'Units',
      width: '80px',
      accessor: row => <BodyText color="textTertiary">{row.labTestType.unit || 'N/A'}</BodyText>,
    },
    {
      key: LAB_TEST_PROPERTIES.LAB_TEST_METHOD_ID,
      title: 'Method',
      accessor: (row, i) => (
        <AccessorField
          id={row.id}
          endpoint="labTestMethod"
          name={LAB_TEST_PROPERTIES.LAB_TEST_METHOD_ID}
          component={SuggesterSelectField}
          tabIndex={tabIndex(1, i)}
        />
      ),
    },
    {
      key: LAB_TEST_PROPERTIES.VERIFICATION,
      title: 'Verification',
      accessor: (row, i) => (
        <AccessorField
          id={row.id}
          component={TextField}
          name={LAB_TEST_PROPERTIES.VERIFICATION}
          tabIndex={tabIndex(2, i)}
        />
      ),
    },
    {
      key: LAB_TEST_PROPERTIES.COMPLETED_DATE,
      title: 'Completed',
      width: '260px',
      accessor: (row, i) => (
        <AccessorField
          id={row.id}
          component={DateTimeField}
          name={LAB_TEST_PROPERTIES.COMPLETED_DATE}
          tabIndex={tabIndex(3, i)}
          saveDateAsString
        />
      ),
    },
  ];
};

const ResultsFormSkeleton = () => (
  <>
    <Box padding="0 30px">
      <Box marginBottom="20px">
        <div>
          <Skeleton variant="text" width={124} style={{ fontSize: 20, marginBottom: 4 }} />
          <Skeleton variant="text" width={270} style={{ fontSize: 12 }} />
        </div>
      </Box>
      <Skeleton variant="rect" height={254} style={{ borderRadius: 4 }} />
    </Box>
  </>
);

const ResultsFormError = ({ error }) => (
  <Box padding="8px 30px 25px 30px">
    <Alert severity="error">
      <AlertTitle>Error</AlertTitle>
      <b>Failed to load result with error:</b> {error.message}
    </Alert>
  </Box>
);

const ResultsForm = ({
  labTestResults,
  isLoading,
  isError,
  error,
  values,
  setFieldValue,
  areLabTestResultsReadOnly,
}) => {
  const { count, data } = labTestResults;
  /**
   * On entering lab result field for a test some other fields are auto-filled optimistically
   * This occurs in the case that:
   * 1. The user has only entered a single unique value for this field across other rows
   * 2. The user has not already entered a value for this field in the current row
   */
  const onChangeResult = useCallback(
    (value, labTestId) => {
      const rowValues = values[labTestId];
      if (rowValues?.result || !value) return;
      AUTOFILL_FIELD_NAMES.forEach(name => {
        // Get unique values for this field across all rows
        const unique = Object.values(values).reduce(
          (acc, row) => (row[name] && !acc.includes(row[name]) ? [...acc, row[name]] : acc),
          [],
        );
        if (unique.length !== 1 || rowValues?.[name]) return;
        // Prefill the field with the unique value
        setFieldValue(`${labTestId}.${name}`, unique[0]);
      });
    },
    [values, setFieldValue],
  );

  const columns = useMemo(() => getColumns(count, onChangeResult, areLabTestResultsReadOnly), [
    count,
    onChangeResult,
    areLabTestResultsReadOnly,
  ]);

  if (isLoading) return <ResultsFormSkeleton />;
  if (isError) return <ResultsFormError error={error} />;

  return (
    <Box>
      <Box margin="0px 30px" paddingBottom="20px">
        <div>
          <Heading4 marginBottom="10px">Enter test results</Heading4>
          <SmallBodyText color="textTertiary">
            Please record test results and other test result details.
          </SmallBodyText>
        </div>
      </Box>
      <TableContainer>
        <StyledTableFormFields columns={columns} data={data} />
      </TableContainer>
    </Box>
  );
};

export const LabTestResultsModal = ({ labRequest, refreshLabTestTable, onClose, open }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { ability } = useAuth();
  const canWriteLabTestResult = ability?.can('write', 'LabTestResult');
  const areLabTestResultsReadOnly = !canWriteLabTestResult;

  const {
    data: labTestResults = { data: [], count: 0 },
    isLoading,
    error,
    isError,
  } = useLabTestResultsQuery(labRequest.id);
  const { displayId } = labRequest;

  const { mutate: updateTests, isLoading: isSavingTests } = useMutation(
    payload => api.put(`labRequest/${labRequest.id}/tests`, payload),
    {
      onSuccess: labTestRes => {
        toast.success(`Successfully updated ${labTestRes.length} tests for request ${displayId}`);
        // Force refresh of lab test data fetching table
        queryClient.invalidateQueries(['labTestResults', labRequest.id]);

        refreshLabTestTable();
        onClose();
      },
      onError: err => {
        toast.error(`Failed to update tests for request ${displayId}: ${err.message}`);
      },
    },
  );

  // Select editable values to prefill the form on edit
  const initialData = useMemo(
    () =>
      keyBy(
        labTestResults?.data.map(data => pick(data, Object.values(LAB_TEST_PROPERTIES))),
        LAB_TEST_PROPERTIES.ID,
      ),
    [labTestResults],
  );

  return (
    <StyledModal
      width="lg"
      title={`Enter results | Test ID ${displayId}`}
      open={open}
      onClose={onClose}
      overrideContentPadding
    >
      <Form
        initialValues={initialData}
        enableReinitialize
        onSubmit={updateTests}
        render={({ submitForm, isSubmitting, dirty, ...props }) => {
          const confirmDisabled = isLoading || isError || isSavingTests || isSubmitting || !dirty;
          return (
            <>
              <ResultsForm
                labTestResults={labTestResults}
                onClose={onClose}
                isLoading={isLoading}
                areLabTestResultsReadOnly={areLabTestResultsReadOnly}
                isError={isError}
                error={error}
                {...props}
              />
              <StyledConfirmCancelRow
                onCancel={onClose}
                onConfirm={submitForm}
                confirmDisabled={confirmDisabled}
              />
            </>
          );
        }}
      />
    </StyledModal>
  );
};
