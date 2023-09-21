import React from 'react';
import styled from 'styled-components';
import { capitalize } from 'lodash';
import * as yup from 'yup';
import { Accordion, AccordionDetails, AccordionSummary, Grid } from '@material-ui/core';
import {
  REPORT_DEFAULT_DATE_RANGES_VALUES,
  REPORT_DATA_SOURCES,
  REPORT_DATA_SOURCE_VALUES,
  REPORT_STATUSES_VALUES,
  MULTI_SELECT_FIELD_DELIMITER,
} from '@tamanu/constants';
import {
  Button,
  ButtonRow,
  Field,
  Form,
  MultiselectField,
  SelectField,
  TextField,
} from '../../../components';
import { ParameterList, ParameterItem, SQLQueryEditor } from './components/editing';
import {
  FIELD_TYPES_WITH_PREDEFINED_OPTIONS,
  FIELD_TYPES_WITH_SUGGESTERS,
} from '../../reports/ParameterField';

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

const generateDefaultParameter = () => ({
  id: Math.random(),
});

const schema = yup.object().shape({
  name: yup.string().required('Report name is a required field'),
  dataSources: yup
    .string()
    .test('test-data-sources', 'Select at least one data source', val => {
      const values = val?.split(MULTI_SELECT_FIELD_DELIMITER) || [];
      return values.length && values.every(v => REPORT_DATA_SOURCE_VALUES.includes(v));
    })
    .required('Data sources is a required field'),
  defaultDateRange: yup
    .string()
    .oneOf(DATE_RANGE_OPTIONS.map(o => o.value))
    .required('Default date range is a required field'),
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

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <StyledField
            disabled={isEdit}
            required
            label="Report name"
            name="name"
            component={TextField}
          />
        </Grid>
        <Grid item xs={4}>
          <StyledField
            label="Can be run on"
            name="dataSources"
            component={MultiselectField}
            options={DATA_SOURCE_OPTIONS}
          />
        </Grid>
        <Grid item xs={4}>
          <StyledField
            label="Default date range"
            name="defaultDateRange"
            component={SelectField}
            options={DATE_RANGE_OPTIONS}
          />
        </Grid>
      </Grid>
      <Accordion defaultExpanded>
        <AccordionSummary>
          <Grid container spacing={1}>
            <Grid item xs={8}>
              Query
            </Grid>
            <Grid item xs={4}>
              Parameters
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
        />
        <Button
          disabled={!dirty}
          variant="contained"
          color="primary"
          type="submit"
          isSubmitting={isSubmitting}
        >
          {isEdit ? 'Create new version' : 'Create'}
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
