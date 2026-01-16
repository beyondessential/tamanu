import React, { useCallback, useMemo } from 'react';
import { Box } from '@material-ui/core';
import styled from 'styled-components';
import { keyBy, pick } from 'lodash';
import { Alert, AlertTitle, Skeleton } from '@material-ui/lab';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FormModal } from '../../../components/FormModal';
import { BodyText, Heading4, SmallBodyText } from '../../../components/Typography';
import { TextField, Form, ConfirmCancelRow, Field } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { DateTimeField, SuggesterSelectField } from '../../../components/Field';
import { TableFormFields } from '../../../components/Table';
import { useLabTestResultsQuery } from '../../../api/queries/useLabTestResultsQuery';
import { AccessorField, LabResultAccessorField } from './AccessorField';
import { useApi } from '../../../api';
import { useAuth } from '../../../contexts/Auth';
import { useLabRequest } from '../../../contexts/LabRequest';
import { TranslatedText, TranslatedReferenceData } from '../../../components/Translation';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

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
  SECONDARY_RESULT: 'secondaryResult',
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
      title: (
        <TranslatedText
          stringId="lab.testType.label"
          fallback="Test type"
          data-testid="translatedtext-8oo7"
        />
      ),
      width: '120px',
      accessor: row => (
        <TranslatedReferenceData
          fallback={row.labTestType.name}
          value={row.labTestType.id}
          category="labTestType"
          data-testid="translatedreferencedata-gvnb"
        />
      ),
    },
    {
      key: LAB_TEST_PROPERTIES.RESULT,
      title: (
        <TranslatedText
          stringId="lab.results.table.column.result"
          fallback="Result"
          data-testid="translatedtext-0937"
        />
      ),
      accessor: (row, i) => {
        const { resultType, options, id: labTestTypeId } = row.labTestType;
        return (
          <LabResultAccessorField
            resultType={resultType}
            options={options}
            disabled={areLabTestResultsReadOnly}
            name={LAB_TEST_PROPERTIES.RESULT}
            onChange={e => onChangeResult(e.target.value, row.id)}
            id={row.id}
            labTestTypeId={labTestTypeId}
            tabIndex={tabIndex(0, i)}
            data-testid="labresultaccessorfield-1r9h"
          />
        );
      },
    },
    {
      key: LAB_TEST_PROPERTIES.SECONDARY_RESULT,
      title: (
        <TranslatedText
          stringId="lab.results.table.column.secondaryResult"
          fallback="Secondary result"
          data-testid="translatedtext-secondary-result"
        />
      ),
      accessor: (row, i) => {
        const { supportsSecondaryResults } = row.labTestType;
        if (!supportsSecondaryResults) {
          return <BodyText color="textTertiary" data-testid="bodytext-na">N/A</BodyText>;
        }
        return (
          <AccessorField
            id={row.id}
            component={TextField}
            name={LAB_TEST_PROPERTIES.SECONDARY_RESULT}
            disabled={areLabTestResultsReadOnly}
            tabIndex={tabIndex(1, i)}
            data-testid="accessorfield-secondary-result"
          />
        );
      },
    },
    {
      key: 'unit',
      title: (
        <TranslatedText
          stringId="lab.results.table.column.unit"
          fallback="Units"
          data-testid="translatedtext-9rpw"
        />
      ),
      width: '80px',
      accessor: row => (
        <BodyText color="textTertiary" data-testid="bodytext-uq3u">
          {row.labTestType.unit || 'N/A'}
        </BodyText>
      ),
    },
    {
      key: LAB_TEST_PROPERTIES.LAB_TEST_METHOD_ID,
      title: (
        <TranslatedText
          stringId="lab.results.table.column.method"
          fallback="Method"
          data-testid="translatedtext-wrj3"
        />
      ),
      accessor: (row, i) => (
        <AccessorField
          id={row.id}
          endpoint="labTestMethod"
          name={LAB_TEST_PROPERTIES.LAB_TEST_METHOD_ID}
          component={SuggesterSelectField}
          tabIndex={tabIndex(2, i)}
          data-testid="accessorfield-ik1h"
        />
      ),
    },
    {
      key: LAB_TEST_PROPERTIES.VERIFICATION,
      title: (
        <TranslatedText
          stringId="lab.results.table.column.verification"
          fallback="Verification"
          data-testid="translatedtext-q47o"
        />
      ),
      accessor: (row, i) => (
        <AccessorField
          id={row.id}
          component={TextField}
          name={LAB_TEST_PROPERTIES.VERIFICATION}
          tabIndex={tabIndex(3, i)}
          data-testid="accessorfield-jhrr"
        />
      ),
    },
    {
      key: LAB_TEST_PROPERTIES.COMPLETED_DATE,
      title: (
        <TranslatedText
          stringId="lab.results.table.column.completedDate"
          fallback="Completed"
          data-testid="translatedtext-3tgn"
        />
      ),
      width: '260px',
      accessor: (row, i) => (
        <AccessorField
          id={row.id}
          component={DateTimeField}
          name={LAB_TEST_PROPERTIES.COMPLETED_DATE}
          tabIndex={tabIndex(4, i)}
          saveDateAsString
          data-testid="accessorfield-k5ef"
        />
      ),
    },
  ];
};

const ResultsFormSkeleton = () => (
  <>
    <Box padding="0 30px" data-testid="box-40fc">
      <Box marginBottom="20px" data-testid="box-ccfc">
        <div>
          <Skeleton
            variant="text"
            width={124}
            style={{ fontSize: 20, marginBottom: 4 }}
            data-testid="skeleton-um2y"
          />
          <Skeleton
            variant="text"
            width={270}
            style={{ fontSize: 12 }}
            data-testid="skeleton-llaz"
          />
        </div>
      </Box>
      <Skeleton
        variant="rect"
        height={254}
        style={{ borderRadius: 4 }}
        data-testid="skeleton-dl86"
      />
    </Box>
  </>
);

const ResultsFormError = ({ error }) => (
  <Box padding="8px 30px 25px 30px" data-testid="box-ta1e">
    <Alert severity="error" data-testid="alert-m6oy">
      <AlertTitle data-testid="alerttitle-kpbw">Error</AlertTitle>
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
   * In the case of labTestMethod this occurs in the case that:
   * 1. The user has only entered a single unique value for this field across other rows
   * 2. The user has not already entered a value for this field in the current row
   */
  const onChangeResult = useCallback(
    (value, labTestId) => {
      if (!value) return;
      const rowValues = values.labTests?.[labTestId];

      AUTOFILL_FIELD_NAMES.forEach(name => {
        if (rowValues?.[name]) return;

        const otherRowsValues = Object.entries(values.labTests || {})
          .filter(([id, row]) => id !== labTestId && row[name])
          .map(([, row]) => row[name]);

        const uniqueValues = [...new Set(otherRowsValues)];
        const fieldName = `labTests.${labTestId}.${name}`;
        if (name === LAB_TEST_PROPERTIES.COMPLETED_DATE) {
          setFieldValue(fieldName, getCurrentDateTimeString());
        } else if (uniqueValues.length === 1) {
          setFieldValue(fieldName, uniqueValues[0]);
        }
      });
    },
    [values, setFieldValue],
  );

  const columns = useMemo(() => getColumns(count, onChangeResult, areLabTestResultsReadOnly), [
    count,
    onChangeResult,
    areLabTestResultsReadOnly,
  ]);

  if (isLoading) return <ResultsFormSkeleton data-testid="resultsformskeleton-ibqy" />;
  if (isError) return <ResultsFormError error={error} data-testid="resultsformerror-se9z" />;

  return (
    <Box data-testid="box-miwv">
      <Box margin="0px 30px" paddingBottom="20px" data-testid="box-jcm4">
        <div>
          <Heading4 marginBottom="10px" data-testid="heading4-5541">
            <TranslatedText
              stringId="patient.lab.modal.enterResults.heading"
              fallback="Enter test results"
              data-testid="translatedtext-8n3h"
            />
          </Heading4>
          <SmallBodyText color="textTertiary" data-testid="smallbodytext-4j32">
            <TranslatedText
              stringId="patient.lab.modal.enterResults.subHeading"
              fallback="Please record test results and other test result details."
              data-testid="translatedtext-3nvu"
            />
          </SmallBodyText>
        </div>
      </Box>
      <TableContainer data-testid="tablecontainer-dyto">
        <StyledTableFormFields
          columns={columns}
          data={data}
          data-testid="styledtableformfields-5s0u"
        />
      </TableContainer>
      <Box margin="20px 30px">
        <Field
          component={TextField}
          multiline
          disabled={areLabTestResultsReadOnly}
          rows={6}
          name="resultsInterpretation"
          label="Results Interpretation"
          data-testid="field-resultsinterpretation"
        />
      </Box>
    </Box>
  );
};

export const LabTestResultsModal = ({ labRequest, refreshLabTestTable, onClose, open }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { ability } = useAuth();
  const { loadLabRequest } = useLabRequest();
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
        toast.success(
          <TranslatedText
            stringId="patient.lab.modal.notification.testsUpdatedSuccess"
            fallback={`Successfully updated ${labTestRes.length} tests for request ${displayId}`}
            replacements={{ length: labTestRes.length, displayId }}
            data-testid="translatedtext-h2yk"
          />,
        );
        queryClient.invalidateQueries(['labTestResults', labRequest.id]);
        loadLabRequest(labRequest.id);
        refreshLabTestTable();
        onClose();
      },
      onError: err => {
        toast.error(
          <TranslatedText
            stringId="patient.lab.modal.notification.testsUpdatedFailed"
            fallback={`Failed to update tests for request ${displayId}: ${err.message}`}
            replacements={{ message: err.message, displayId }}
            data-testid="translatedtext-6nu5"
          />,
        );
      },
    },
  );

  // Select editable values to prefill the form on edit
  const initialData = useMemo(
    () => ({
      labTests: keyBy(
        labTestResults?.data.map(data => pick(data, Object.values(LAB_TEST_PROPERTIES))),
        LAB_TEST_PROPERTIES.ID,
      ),
      resultsInterpretation: labRequest.resultsInterpretation,
    }),
    [labTestResults, labRequest.resultsInterpretation],
  );

  return (
    <StyledModal
      width="lg"
      title={
        <TranslatedText
          stringId="patient.lab.modal.enterResults.title"
          fallback="Enter results | Test ID :testId"
          replacements={{ testId: displayId }}
          data-testid="translatedtext-r9ex"
        />
      }
      open={open}
      onClose={onClose}
      overrideContentPadding
      data-testid="styledmodal-ou57"
    >
      <Form
        initialValues={initialData}
        formType={labTestResults ? FORM_TYPES.EDIT : FORM_TYPES.CREATE}
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
                data-testid="resultsform-xeh7"
              />
              <StyledConfirmCancelRow
                onCancel={onClose}
                onConfirm={submitForm}
                confirmDisabled={confirmDisabled}
                data-testid="styledconfirmcancelrow-5osn"
              />
            </>
          );
        }}
        data-testid="form-z03z"
      />
    </StyledModal>
  );
};
