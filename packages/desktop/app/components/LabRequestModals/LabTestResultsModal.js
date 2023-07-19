import React, { useCallback, useMemo } from 'react';
import { Box } from '@material-ui/core';
import styled from 'styled-components';
import { keyBy, pick } from 'lodash';
import { Alert, AlertTitle, Skeleton } from '@material-ui/lab';
import { Modal } from '../Modal';
import { Heading4, SmallBodyText } from '../Typography';
import { DateTimeField, Field, Form, SuggesterSelectField, TextField } from '../Field';
import { TableFormFields } from '../Table';
import { Colors } from '../../constants';
import { useLabTestResultsQuery } from '../../api/queries/useLabTestResultsQuery';
import { LabResultAccessorField, AccessorField } from './AccessorField';
import { ConfirmCancelRow } from '../ButtonRow';

const TableContainer = styled.div`
  overflow-y: auto;
  max-height: 500px;
`;

const StyledModal = styled(Modal)`
  .MuiDialogActions-root {
    display: none;
  }
`;

const StyledTableFormFields = styled(TableFormFields)`
  margin-top: 20px;
  margin-bottom: 30px;

  overflow-y: auto;
  max-height: 400px;

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
  padding-right: 20px;
  padding-top: 18px;
  border-top: 1px solid ${Colors.outline};
  margin-top: 0;
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

const getColumns = (count, onChangeResult) => {
  // Generate tab index for vertical tabbing through the table
  const tabIndex = (row, col) => count * row + col + 1;
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
      accessor: row => row.labTestType.unit,
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
        />
      ),
    },
  ];
};

const ResultsFormSkeleton = () => (
  <>
    <Box>
      <Box display="flex" justifyContent="space-between" marginBottom="20px">
        <div>
          <Skeleton variant="text" width={124} style={{ fontSize: 20, marginBottom: 4 }} />
          <Skeleton variant="text" width={270} style={{ fontSize: 12 }} />
        </div>
        <div>
          <Skeleton variant="text" width={70} style={{ fontSize: 18 }} />
          <Skeleton variant="rect" width={241} height={40} style={{ borderRadius: 4 }} />
        </div>
      </Box>
      <Skeleton variant="rect" height={257} style={{ borderRadius: 4, marginBottom: 30 }} />
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

const ResultsForm = ({ labTestResults, isLoading, isError, error, values, setFieldValue }) => {
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

  const columns = useMemo(() => getColumns(count, onChangeResult), [count, onChangeResult]);

  if (isLoading) return <ResultsFormSkeleton />;
  if (isError) return <ResultsFormError error={error} />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" padding="0 20px 10px 20px">
        <div>
          <Heading4 marginBottom="10px">Enter test results</Heading4>
          <SmallBodyText color="textTertiary">
            Please record test results and other test result details.
          </SmallBodyText>
        </div>
        <Field name="laboratoryOfficer" label="Lab officer" tabIndex={0} component={TextField} />
      </Box>
      <TableContainer>
        <Box padding="0 20px">
          <StyledTableFormFields columns={columns} data={data} />
        </Box>
      </TableContainer>
    </Box>
  );
};

export const LabTestResultsModal = ({ labRequest, onClose, open }) => {
  const {
    data: labTestResults = { data: [], count: 0 },
    isLoading,
    error,
    isError,
    isSuccess,
  } = useLabTestResultsQuery(labRequest.id);
  const { displayId } = labRequest;

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
        render={props => (
          <>
            {isSuccess && (
              <ResultsForm
                labTestResults={labTestResults}
                onClose={onClose}
                isLoading={isLoading}
                isError={isError}
                error={error}
                {...props}
              />
            )}
          </>
        )}
      />
      <StyledConfirmCancelRow
        onConfirm={onClose}
        onCancel={onClose}
        confirmDisabled={isLoading || isError}
      />
    </StyledModal>
  );
};
