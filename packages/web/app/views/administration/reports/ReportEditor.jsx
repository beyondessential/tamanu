import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import * as yup from 'yup';
import { Accordion, AccordionDetails, AccordionSummary, Grid } from '@material-ui/core';
import {
  REPORT_DATA_SOURCE_VALUES,
  REPORT_DATA_SOURCE_LABELS,
  REPORT_DEFAULT_DATE_RANGES_LABELS,
  REPORT_DB_SCHEMAS,
  REPORT_DB_SCHEMA_LABELS,
  REPORT_DB_SCHEMA_VALUES,
  REPORT_DEFAULT_DATE_RANGES_VALUES,
  REPORT_STATUSES_VALUES,
  REPORT_STATUS_LABELS,
} from '@tamanu/constants/reports';
import {
  Button,
  ButtonRow,
  Field,
  Form,
  TextField,
  TranslatedMultiSelectField,
  TranslatedSelectField,
} from '../../../components';
import { ParameterItem, ParameterList, SQLQueryEditor } from './components/editing';
import {
  FIELD_TYPES_WITH_PREDEFINED_OPTIONS,
  FIELD_TYPES_WITH_SUGGESTERS,
} from '../../reports/ParameterField';
import { useAuth } from '../../../contexts/Auth';
import { useApi } from '../../../api';
import { FORM_TYPES } from '../../../constants';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useTranslation } from '../../../contexts/Translation';

const StyledField = styled(Field)`
  flex-grow: 1;
`;

const StatusField = styled(Field)`
  width: 130px;
`;

const generateDefaultParameter = () => ({
  id: Math.random(),
});

const ReportEditorForm = ({ isSubmitting, values, setValues, dirty, isEdit, setFieldValue }) => {
  const { ability } = useAuth();
  const api = useApi();
  const setQuery = query => setValues({ ...values, query });
  const params =
    values.parameters.map(param => ({ ...generateDefaultParameter(), ...param })) || [];
  const setParams = newParams => setValues({ ...values, parameters: newParams });
  const onParamsAdd = () => setParams([...params, generateDefaultParameter()]);

  const onParamsDelete = paramId => setParams(params.filter(p => p.id !== paramId));

  const canWriteRawReportUser = Boolean(ability?.can('write', 'ReportDbSchema'));

  const { data: schemaOptions = [] } = useQuery(['dbSchemaOptions'], () =>
    api.get(`admin/reports/dbSchemaOptions`),
  );

  // Show data source field if user is writing a raw report OR if reporting schema is disabled.
  const showDataSourceField =
    values.dbSchema === REPORT_DB_SCHEMAS.RAW || schemaOptions.length === 0;

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <StyledField
            disabled={isEdit}
            required
            label={
              <TranslatedText
                stringId="admin.report.reportName.label"
                fallback="Report name"
                data-test-id='translatedtext-bl8h' />
            }
            name="name"
            component={TextField}
          />
        </Grid>
        <Grid item xs={4}>
          <StyledField
            label={
              <TranslatedText
                stringId="admin.report.defaultDateRange.label"
                fallback="Default date range"
                data-test-id='translatedtext-0tm2' />
            }
            name="defaultDateRange"
            component={TranslatedSelectField}
            isClearable={false}
            enumValues={REPORT_DEFAULT_DATE_RANGES_LABELS}
          />
        </Grid>
        {canWriteRawReportUser && schemaOptions?.length > 0 && (
          <Grid item xs={4}>
            <StyledField
              label={<TranslatedText
                stringId="admin.report.dbSchema.label"
                fallback="DB Schema"
                data-test-id='translatedtext-6u31' />}
              name="dbSchema"
              component={TranslatedSelectField}
              enumValues={REPORT_DB_SCHEMA_LABELS}
              disabled={isEdit}
              isClearable={false}
            />
          </Grid>
        )}
        {showDataSourceField && (
          <Grid item xs={4}>
            <StyledField
              label={
                <TranslatedText
                  stringId="admin.report.canBeRunOn.label"
                  fallback="Can be run on"
                  data-test-id='translatedtext-jnbk' />
              }
              name="dataSources"
              component={TranslatedMultiSelectField}
              enumValues={REPORT_DATA_SOURCE_LABELS}
            />
          </Grid>
        )}
        <Grid item xs={12}>
          <StyledField
            label={<TranslatedText
              stringId="general.notes.label"
              fallback="Notes"
              data-test-id='translatedtext-s92d' />}
            name="notes"
            multiline
          />
        </Grid>
      </Grid>
      <Accordion defaultExpanded>
        <AccordionSummary>
          <Grid container spacing={1}>
            <Grid item xs={8}>
              <TranslatedText
                stringId="admin.report.query.label"
                fallback="Query"
                data-test-id='translatedtext-hufs' />
            </Grid>
            <Grid item xs={4}>
              <TranslatedText
                stringId="admin.report.parameters.label"
                fallback="Parameters"
                data-test-id='translatedtext-g5fw' />
            </Grid>
          </Grid>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <SQLQueryEditor
                customKeywords={params.map(p => p.name)}
                onChange={setQuery}
                value={values.query}
              />
            </Grid>
            <Grid item xs={4}>
              <ParameterList onAdd={onParamsAdd}>
                {params.map(({ id, ...rest }, parameterIndex) => {
                  return (
                    <ParameterItem
                      key={id}
                      id={id}
                      parameterIndex={parameterIndex}
                      onDelete={onParamsDelete}
                      setFieldValue={setFieldValue}
                      {...rest}
                    />
                  );
                })}
              </ParameterList>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      <ButtonRow data-test-id='buttonrow-fxp6'>
        <StatusField
          name="status"
          component={TranslatedSelectField}
          isClearable={false}
          enumValues={REPORT_STATUS_LABELS}
        />
        <Button
          disabled={!dirty}
          variant="contained"
          color="primary"
          type="submit"
          isSubmitting={isSubmitting}
          data-test-id='button-33gq'>
          {isEdit ? (
            <TranslatedText
              stringId="admin.report.action.createNewVersion"
              fallback="Create new version"
              data-test-id='translatedtext-6vrc' />
          ) : (
            <TranslatedText
              stringId="general.action.create"
              fallback="Create"
              data-test-id='translatedtext-2o44' />
          )}
        </Button>
      </ButtonRow>
    </>
  );
};

export const ReportEditor = ({ initialValues, onSubmit, isEdit }) => {
  const { getTranslation } = useTranslation();
  return (
    <Form
      onSubmit={onSubmit}
      enableReinitialize
      validationSchema={yup.object().shape({
        name: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="admin.report.reportName.label"
              fallback="Report name"
              data-test-id='translatedtext-kigf' />,
          ),
        dataSources: yup
          .array()
          .test(
            'test-data-sources',
            getTranslation(
              'admin.report.validation.rule.atLeast1DataSource',
              'Select at least one data source',
            ),
            val => {
              const values = val || [];
              return values.length && values.every(v => REPORT_DATA_SOURCE_VALUES.includes(v));
            },
          )
          .required(),
        defaultDateRange: yup
          .string()
          .oneOf(REPORT_DEFAULT_DATE_RANGES_VALUES)
          .required(),
        dbSchema: yup
          .string()
          .nullable()
          .oneOf([...REPORT_DB_SCHEMA_VALUES, null]),
        parameters: yup.array().of(
          yup.object().shape({
            name: yup
              .string()
              .required()
              .translatedLabel(
                <TranslatedText
                  stringId="admin.report.validation.name.path"
                  fallback="Parameter name"
                  data-test-id='translatedtext-26pj' />,
              ),
            label: yup
              .string()
              .required()
              .translatedLabel(
                <TranslatedText
                  stringId="admin.report.validation.label.path"
                  fallback="Parameter label"
                  data-test-id='translatedtext-if7u' />,
              ),
            parameterField: yup
              .string()
              .required()
              .translatedLabel(
                <TranslatedText
                  stringId="admin.report.fieldType.label"
                  fallback="Field type"
                  data-test-id='translatedtext-71sq' />,
              ),
            suggesterEndpoint: yup.string().when('parameterField', {
              is: parameterField => FIELD_TYPES_WITH_SUGGESTERS.includes(parameterField),
              then: yup
                .string()
                .required()
                .translatedLabel(
                  <TranslatedText
                    stringId="admin.report.suggesterEndpoint.label"
                    fallback="Parameter label"
                    data-test-id='translatedtext-boom' />,
                ),
              otherwise: yup.string(),
            }),
            options: yup.array().when('parameterField', {
              is: parameterField => FIELD_TYPES_WITH_PREDEFINED_OPTIONS.includes(parameterField),
              then: yup
                .array()
                .test(
                  'test-options',
                  getTranslation(
                    'admin.report.validation.rule.optionMustContainLabelAndValue',
                    'Each option must contain a label and value',
                  ),
                  val => val.every(o => o.label && o.value),
                ),
              otherwise: yup.array(),
            }),
          }),
        ),
        query: yup
          .string()
          .required()
          .translatedLabel(<TranslatedText
          stringId="admin.report.query.label"
          fallback="Query"
          data-test-id='translatedtext-umaw' />),
        status: yup
          .string()
          .oneOf(REPORT_STATUSES_VALUES)
          .required()
          .translatedLabel(<TranslatedText
          stringId="general.status.label"
          fallback="Status"
          data-test-id='translatedtext-qxmo' />),
      })}
      formType={isEdit ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      initialValues={initialValues}
      render={formikContext => <ReportEditorForm {...formikContext} isEdit={isEdit} />}
    />
  );
};
