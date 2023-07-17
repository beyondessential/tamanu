import React, { useCallback, useMemo } from 'react';
import { LAB_TEST_RESULT_TYPES } from '@tamanu/shared/constants';
import { Box } from '@material-ui/core';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { keyBy, omit } from 'lodash';
import { Skeleton } from '@material-ui/lab';
import { Modal } from '../Modal';
import { Heading4, SmallBodyText } from '../Typography';
import {
  DateTimeField,
  Field,
  Form,
  NumberField,
  SelectField,
  SuggesterSelectField,
  TextField,
} from '../Field';
import { useApi } from '../../api';
import { TableFormFields } from '../Table';
import { Colors } from '../../constants';
import { ModalActionRow } from '../ModalActionRow';
import { useLabTestResultsQuery } from '../../api/queries/useLabTestResultsQuery';

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

const AUTOFILL_FIELD_NAMES = ['completedDate', 'labTestMethodId'];

function getResultComponent(resultType, options) {
  if (options && options.length) return SelectField;
  if (resultType === LAB_TEST_RESULT_TYPES.FREE_TEXT) return TextField;
  return NumberField;
}

const AccessorField = ({ id, name, ...props }) => <Field {...props} name={`${id}.${name}`} />;

const getColumns = (count, onChangeResult) => {
  // Generate tab index for vertical tabbing through the table
  const tabIndex = (row, col) => count * row + col + 1;
  return [
    {
      key: 'labTestType',
      title: 'Test type',
      width: '100px',
      accessor: row => row.labTestType.name,
    },
    {
      key: 'result',
      title: 'Result',
      accessor: (row, i) => {
        const { resultType, options } = row.labTestType;
        return (
          <AccessorField
            component={getResultComponent(resultType, options)}
            name="result"
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
      key: 'method',
      title: 'Method',
      accessor: (row, i) => (
        <AccessorField
          id={row.id}
          endpoint="labTestMethod"
          name="labTestMethodId"
          component={SuggesterSelectField}
          tabIndex={tabIndex(1, i)}
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

const ResultsForm = ({ labTestResults, values, setFieldValue }) => {
  const { count, data } = labTestResults;
  /**
   * On entering lab result field for a test some other fields are auto-filled optimistically
   * This occurs in the case that:
   * 1. The user has only entered a single unique value for this field across other rows
   * 2. The user has not already entered a value for this field in the current row
   */
  const onChangeResult = useCallback(
    (value, resultId) => {
      const rowValues = values[resultId];
      if (rowValues?.result || !value) return;
      AUTOFILL_FIELD_NAMES.forEach(name => {
        // Get unique values for this field across all rows
        const unique = Object.values(values).reduce(
          (acc, row) => (row[name] && !acc.includes(row[name]) ? [...acc, row[name]] : acc),
          [],
        );
        if (unique.length !== 1 || rowValues?.[name]) return;
        // Prefill the field with the unique value
        setFieldValue(`${resultId}.${name}`, unique[0]);
      });
    },
    [values, setFieldValue],
  );

  const columns = useMemo(() => getColumns(count, onChangeResult), [count, onChangeResult]);

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
      <StyledTableFormFields columns={columns} data={data} />
    </>
  );
};

const ResultsFormSkeleton = () => (
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
);

export const LabTestResultsModal = ({ labRequest, onClose, open }) => {
  const { data: labTestResults, isLoading, error } = useLabTestResultsQuery(labRequest.id);
  const { displayId } = labRequest;
  const initialData = useMemo(
    () =>
      keyBy(
        labTestResults?.data.map(data => omit(data, ['labTestType'])),
        'id',
      ),
    [labTestResults],
  );
  return (
    <Modal width="lg" title={`Enter results | Test ID ${displayId}`} open={open} onClose={onClose}>
      {isLoading ? (
        <ResultsFormSkeleton />
      ) : (
        labTestResults && (
          <Form
            initialValues={initialData}
            render={props => (
              <ResultsForm labTestResults={labTestResults} onClose={onClose} {...props} />
            )}
          />
        )
      )}
      <ModalActionRow onConfirm={onClose} onCancel={onClose} confirmDisabled={isLoading} />
    </Modal>
  );
};
