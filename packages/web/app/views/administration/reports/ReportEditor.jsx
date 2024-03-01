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
import { TranslatedText } from '../../../components/Translation/TranslatedText';

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

const schema = yup.object().shape({
  name: yup.string().required('Report name is a required field'),
  dataSources: yup
    .array()
    .test('test-data-sources', 'Select at least one data source', val => {
      const values = val || [];
      return values.length && values.every(v => REPORT_DATA_SOURCE_VALUES.includes(v));
    })
    .required('Data sources is a required field'),
  defaultDateRange: yup
    .string()
    .oneOf(DATE_RANGE_OPTIONS.map(o => o.value))
    .required('Default date range is a required field'),
  dbSchema: yup
    .string()
    .nullable()
    .oneOf([...DB_SCHEMA_OPTIONS.map(o => o.value), null]),
  parameters: yup.array().of(
    yup.object().shape({
      name: yup.string().required('Parameter name is a required field'),
      label: yup.string().required('Parameter label is a required field'),
      parameterField: yup.string().required('Parameter field type is a required field'),
      suggesterEndpoint: yup.string().when('parameterField', {
        is: parameterField => FIELD_TYPES_WITH_SUGGESTERS.includes(parameterField),
        then: yup.string().required('Suggester endpoint is a required field'),
        otherwise: yup.string(),
      }),
      options: yup.array().when('parameterField', {
        is: parameterField => FIELD_TYPES_WITH_PREDEFINED_OPTIONS.includes(parameterField),
        then: yup
          .array()
          .test('test-options', 'Each option must contain a label and value', val =>
            val.every(o => o.label && o.value),
          ),
        otherwise: yup.array(),
      }),
    }),
  ),
  query: yup.string().required('Query is a required field'),
  status: yup
    .string()
    .oneOf(STATUS_OPTIONS.map(s => s.value))
    .required('Status is a required field'),
});

const ReportEditorForm = ({ isSubmitting, values, setValues, dirty, isEdit }) => {
  const { ability } = useAuth();
  const api = useApi();
  const setQuery = query => setValues({ ...values, query });
  const params = values.parameters || [];
  const setParams = newParams => setValues({ ...values, parameters: newParams });
  const onParamsAdd = () => setParams([...params, generateDefaultParameter()]);
  const onParamsChange = (paramId, field, newValue) => {
    const paramIndex = params.findIndex(p => p.id === paramId);
    const newParams = [...params];
    newParams[paramIndex] = { ...newParams[paramIndex], [field]: newValue };
    setParams(newParams);
  };
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
                stringId="admin.report.editor.reportName.label"
                fallback="Report name"
              />
            }
            name="name"
            component={TextField}
          />
        </Grid>
        <Grid item xs={4}>
          <StyledField
            label={
              <TranslatedText
                stringId="admin.report.editor.defaultDateRange.label"
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
              label={
                <TranslatedText
                  stringId="admin.report.editor.dbSchema.label"
                  fallback="DB Schema"
                />
              }
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
                <TranslatedText
                  stringId="admin.report.editor.canBeRunOn.label"
                  fallback="Can be run on"
                />
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
              <TranslatedText stringId="admin.report.editor.query.label" fallback="Query" />
            </Grid>
            <Grid item xs={4}>
              <TranslatedText
                stringId="admin.report.editor.parameters.label"
                fallback="Parameters"
              />
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
                {params.map(({ id, ...rest }) => {
                  return (
                    <ParameterItem
                      key={id}
                      id={id}
                      {...rest}
                      onDelete={onParamsDelete}
                      onChange={onParamsChange}
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
              stringId="admin.report.editor.action.createNewVersion"
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
  return (
    <Form
      onSubmit={onSubmit}
      enableReinitialize
      validationSchema={schema}
      initialValues={initialValues}
      render={formikContext => <ReportEditorForm {...formikContext} isEdit={isEdit} />}
    />
  );
};
