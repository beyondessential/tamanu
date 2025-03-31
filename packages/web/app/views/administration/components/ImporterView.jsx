import React, { memo, useCallback, useMemo, useState } from 'react';
import { startCase, sum } from 'lodash';
import styled from 'styled-components';
import * as yup from 'yup';

import { useApi } from '../../../api';
import { Field, Form } from '../../../components/Field';
import { FileChooserField, FILTER_EXCEL } from '../../../components/Field/FileChooserField';
import { ExpandedMultiSelectField } from '../../../components/Field/ExpandedMultiSelectField';
import { FormGrid } from '../../../components/FormGrid';
import { ButtonRow } from '../../../components/ButtonRow';
import { Table } from '../../../components/Table';
import { FormSubmitButton } from '../../../components/Button';
import { FORM_TYPES } from '../../../constants';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useFormikContext } from 'formik';

const ColorText = styled.span`
  color: ${props => props.color};
`;

const ContentRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
`;

const ContentColumn = props => <FormGrid columns={1} {...props} />;

const StyledButtonRow = styled(ButtonRow)`
  ${p => (p.alignment === 'right' ? `width: 50%` : '')};
`;

const ERROR_COLUMNS = [
  { key: 'sheet', title: 'Sheet', width: 1, sortable: false },
  { key: 'row', title: 'Row', sortable: false },
  { key: 'kind', title: 'Error', sortable: false },
  {
    key: 'error',
    title: 'Message',
    accessor: data => <ColorText color="red">{data.message}</ColorText>,
    sortable: false,
  },
];

const ImportErrorsTable = ({ errors }) => (
  <Table columns={ERROR_COLUMNS} noDataMessage="All good!" data={errors} />
);

const STATS_COLUMNS = [
  { key: 'key', title: 'Table', sortable: false },
  { key: 'created', title: 'Created', sortable: false },
  { key: 'updated', title: 'Updated', sortable: false },
  {
    key: 'errored',
    title: 'Errored',
    accessor: ({ errored }) => (
      <ColorText color={errored > 0 ? 'red' : 'green'}>{errored}</ColorText>
    ),
    sortable: false,
  },
];

const ImportStatsDisplay = ({ stats }) => (
  <Table
    rowIdKey="key"
    columns={STATS_COLUMNS}
    noDataMessage="Nothing there"
    data={Object.entries(stats).map(([key, data]) => ({ key, ...data }))}
  />
);

const ImportForm = ({
  submitForm,
  dataTypes,
  dataTypesSelectable,
  ImportButton = FormSubmitButton,
}) => {
  const { values } = useFormikContext();
  const ContentContainer = dataTypesSelectable ? ContentColumn : ContentRow;
  const buttonRowAlignment = dataTypesSelectable ? 'left' : 'right';
  return (
    <ContentContainer>
      <Field
        component={FileChooserField}
        filters={[FILTER_EXCEL]}
        label={<TranslatedText
          stringId="general.selectFile.label"
          fallback="Select file"
          data-test-id='translatedtext-jzyk' />}
        name="file"
        required
        data-test-id='field-tuvg' />
      {dataTypes && dataTypesSelectable && (
        <Field
          name="includedDataTypes"
          label={
            <TranslatedText
              stringId="admin.import.includedDataTypes.label"
              fallback="Select data types to import"
              data-test-id='translatedtext-l8uz' />
          }
          component={ExpandedMultiSelectField}
          options={dataTypes.map(value => ({ value, label: startCase(value) }))}
          data-test-id='field-6mip' />
      )}
      <StyledButtonRow alignment={buttonRowAlignment}>
        <ImportButton
          variant="outlined"
          onSubmit={(event, extraFormData) => {
            submitForm(event, { dryRun: true, ...extraFormData });
          }}
          disabled={!values.file}
        >
          <TranslatedText
            stringId="admin.import.action.testImport"
            fallback="Test import"
            data-test-id='translatedtext-irmx' />
        </ImportButton>
        <ImportButton
          disabled={!values.file}
          onSubmit={(event, extraFormData) => submitForm(event, extraFormData)}
        >
          <TranslatedText
            stringId="general.action.import"
            fallback="Import"
            data-test-id='translatedtext-xuc4' />
        </ImportButton>
      </StyledButtonRow>
    </ContentContainer>
  );
};

function sumStat(stats, fields = ['created', 'updated', 'errored']) {
  return sum(Object.values(stats).map(stat => sum(fields.map(f => stat[f]))));
}

const OutcomeHeader = ({ result }) => {
  let head;
  if (result.didntSendReason === 'validationFailed') {
    head = <h3 data-test-id='h3-s6hs'>Please correct these validation issues and try again</h3>;
  } else if (result.didntSendReason === 'dryRun') {
    head = <h3 data-test-id='h3-wrd1'>Test import finished successfully</h3>;
  } else if (result.didntSendReason) {
    head = <h3 data-test-id='h3-36bv'>{`Import failed! server reports "${result.didntSendReason}"`}</h3>;
  } else if (!result?.errors?.length) {
    head = <h3 data-test-id='h3-gh5p'>Import successful!</h3>;
  } else {
    head = <h3 data-test-id='h3-ujl3'>Import failed - unknown server error</h3>;
  }

  return (
    <>
      {head}
      {result.stats && (
        <p data-test-id='p-o67q'>
          {`Time: ${result.duration?.toFixed(2) ?? 'unknown '}s — Records: ` +
            `${sumStat(result.stats, ['created'])} created, ` +
            `${sumStat(result.stats, ['updated'])} updated, ` +
            `${sumStat(result.stats, ['errored'])} errored, ` +
            `${sumStat(result.stats)} total`}
        </p>
      )}
    </>
  );
};

const OutcomeDisplay = ({ result }) => {
  if (!result) {
    return null;
  }

  return (
    <div>
      <OutcomeHeader result={result} />
      <hr />
      <h4 data-test-id='h4-53ik'>Summary</h4>
      {result.stats && <ImportStatsDisplay stats={result.stats} />}
      {result?.errors?.length > 0 && (
        <>
          <h4 data-test-id='h4-gr0i'>Errors</h4>
          <ImportErrorsTable errors={result?.errors} />
        </>
      )}
    </div>
  );
};

export const ImporterView = memo(
  ({ endpoint, dataTypes, dataTypesSelectable, setIsLoading, ImportButton }) => {
    const [resetKey, setResetKey] = useState(Math.random());
    const [result, setResult] = useState(null);

    const api = useApi();

    const onSubmitUpload = useCallback(
      async ({ file, ...data }) => {
        setResult(null);
        setIsLoading(true);
        try {
          const intermediateResult = await api.postWithFileUpload(
            `admin/import/${endpoint}`,
            file,
            data,
          );

          if (intermediateResult.sentData) {
            // reset the form
            setResetKey(Math.random());
          }

          setResult(intermediateResult);
          return true;
        } finally {
          setIsLoading(false);
        }
      },
      [api, endpoint, setIsLoading],
    );

    const renderForm = useCallback(
      props => (
        <ImportForm
          dataTypes={dataTypes}
          dataTypesSelectable={dataTypesSelectable}
          ImportButton={ImportButton}
          {...props}
        />
      ),
      [dataTypes, dataTypesSelectable, ImportButton],
    );

    const initialDataTypes = useMemo(() => dataTypes && [...dataTypes], [dataTypes]);

    return (
      <>
        <Form
          key={resetKey}
          onSubmit={onSubmitUpload}
          formType={FORM_TYPES.CREATE_FORM}
          validationSchema={yup.object().shape({
            includedDataTypes: dataTypesSelectable
              ? yup
                  .array()
                  .of(yup.string())
                  .required()
                  .min(1)
              : undefined,
            file: yup
              .string()
              .required()
              .translatedLabel(<TranslatedText
              stringId="general.file.label"
              fallback="File"
              data-test-id='translatedtext-7rx9' />),
          })}
          initialValues={{
            includedDataTypes: initialDataTypes,
          }}
          render={renderForm}
        />
        <OutcomeDisplay result={result} />
      </>
    );
  },
);
