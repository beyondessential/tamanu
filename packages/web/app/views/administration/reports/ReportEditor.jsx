import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { capitalize } from 'lodash';
import * as yup from 'yup';
import { Accordion, AccordionDetails, AccordionSummary, Grid } from '@material-ui/core';
import {
  REPORT_DATA_SOURCE_VALUES,
  REPORT_DATA_SOURCES,
  REPORT_DB_SCHEMAS,
  REPORT_DEFAULT_DATE_RANGES_VALUES,
  REPORT_STATUSES_VALUES,
} from '@tamanu/constants/reports';
import {
  Button,
  ButtonRow,
  Field,
  Form,
  SelectField,
  MultiselectField,
  TextField,
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

const STATUS_OPTIONS = REPORT_STATUSES_VALUES.map(status => ({
  label: capitalize(status),
  value: status,
}));

const DATA_SOURCE_OPTIONS = [
  { label: 'Facility server', value: REPORT_DATA_SOURCES.THIS_FACILITY },
  { label: 'Central server', value: REPORT_DATA_SOURCES.ALL_FACILITIES },
];

const DATE_RANGE_OPTIONS = REPORT_DEFAULT_DATE_RANGES_VALUES.map(value => ({
  label: value,
  value,
}));

const DB_SCHEMA_OPTIONS = Object.values(REPORT_DB_SCHEMAS).map(value => ({
  label: capitalize(value),
  value,
}));

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
              <TranslatedText stringId="admin.report.reportName.label" fallback="Report name" />
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
              />
            }
            name="defaultDateRange"
            component={SelectField}
            isClearable={false}
            options={DATE_RANGE_OPTIONS}
            prefix="report.property.defaultDateRange"
          />
        </Grid>
        {canWriteRawReportUser && schemaOptions?.length > 0 && (
          <Grid item xs={4}>
            <StyledField
              label={<TranslatedText stringId="admin.report.dbSchema.label" fallback="DB Schema" />}
              name="dbSchema"
              prefix="report.property.canWrite"
              component={SelectField}
              options={schemaOptions}
              disabled={isEdit}
              isClearable={false}
            />
          </Grid>
        )}
        {showDataSourceField && (
          <Grid item xs={4}>
            <StyledField
              label={
                <TranslatedText stringId="admin.report.canBeRunOn.label" fallback="Can be run on" />
              }
              name="dataSources"
              component={MultiselectField}
              options={DATA_SOURCE_OPTIONS}
              prefix="report.property.canBeRunOn"
            />
          </Grid>
        )}
        <Grid item xs={12}>
          <StyledField
            label={<TranslatedText stringId="general.notes.label" fallback="Notes" />}
            name="notes"
            multiline
          />
        </Grid>
      </Grid>
      <Accordion defaultExpanded>
        <AccordionSummary>
          <Grid container spacing={1}>
            <Grid item xs={8}>
              <TranslatedText stringId="admin.report.query.label" fallback="Query" />
            </Grid>
            <Grid item xs={4}>
              <TranslatedText stringId="admin.report.parameters.label" fallback="Parameters" />
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
      <ButtonRow>
        <StatusField
          name="status"
          component={SelectField}
          isClearable={false}
          options={STATUS_OPTIONS}
          prefix="report.property.status"
        />
        <Button
          disabled={!dirty}
          variant="contained"
          color="primary"
          type="submit"
          isSubmitting={isSubmitting}
        >
          {isEdit ? (
            <TranslatedText
              stringId="admin.report.action.createNewVersion"
              fallback="Create new version"
            />
          ) : (
            <TranslatedText stringId="general.action.create" fallback="Create" />
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
            <TranslatedText stringId="admin.report.reportName.label" fallback="Report name" />,
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
          .oneOf(DATE_RANGE_OPTIONS.map(o => o.value))
          .required(),
        dbSchema: yup
          .string()
          .nullable()
          .oneOf([...DB_SCHEMA_OPTIONS.map(o => o.value), null]),
        parameters: yup.array().of(
          yup.object().shape({
            name: yup
              .string()
              .required()
              .translatedLabel(
                <TranslatedText
                  stringId="admin.report.validation.name.path"
                  fallback="Parameter name"
                />,
              ),
            label: yup
              .string()
              .required()
              .translatedLabel(
                <TranslatedText
                  stringId="admin.report.validation.label.path"
                  fallback="Parameter label"
                />,
              ),
            parameterField: yup
              .string()
              .required()
              .translatedLabel(
                <TranslatedText stringId="admin.report.fieldType.label" fallback="Field type" />,
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
                  />,
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
          .translatedLabel(<TranslatedText stringId="admin.report.query.label" fallback="Query" />),
        status: yup
          .string()
          .oneOf(STATUS_OPTIONS.map(s => s.value))
          .required()
          .translatedLabel(<TranslatedText stringId="general.status.label" fallback="Status" />),
      })}
      formType={isEdit ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      initialValues={initialValues}
      render={formikContext => <ReportEditorForm {...formikContext} isEdit={isEdit} />}
    />
  );
};
