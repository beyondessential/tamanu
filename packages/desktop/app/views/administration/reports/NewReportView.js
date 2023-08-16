import React from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as yup from 'yup';
import { Accordion, AccordionDetails, AccordionSummary, Grid } from '@material-ui/core';
import { REPORT_DEFAULT_DATE_RANGES } from '@tamanu/shared/constants/reports';
import { useApi } from '../../../api';
import { useAuth } from '../../../contexts/Auth';
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

const Container = styled.div`
  padding: 20px;
`;

const StyledField = styled(Field)`
  flex-grow: 1;
`;

const StatusField = styled(Field)`
  width: 130px;
`;

const STATUS_OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
];

const DATA_SOURCE_OPTIONS = [
  { label: 'Facility server', value: 'thisFacility' },
  { label: 'Central server', value: 'allFacilities' },
];

const DATE_RANGE_OPTIONS = Object.entries(REPORT_DEFAULT_DATE_RANGES).map(([, value]) => ({
  label: value,
  value,
}));

const generateDefaultParameter = () => ({
  id: Math.random(),
});

const schema = yup.object().shape({
  name: yup.string().required('Report name is a required field'),
  dataSources: yup
    .array()
    .min(1)
    .required('Select at least one data source'),
  defaultDateRange: yup
    .string()
    .oneOf(DATE_RANGE_OPTIONS.map(o => o.value))
    .required('Default date range is a required field'),
  parameters: yup.array().of(
    yup.object().shape({
      name: yup.string().required('Parameter name is a required field'),
      label: yup.string().required('Parameter label is a required field'),
      parameterField: yup.string().required('Parameter field type is a required field'),
      suggesterEndpoint: yup.string().required('Suggester endpoint is a required field'),
    }),
  ),
  query: yup.string().required('Query is a required field'),
  status: yup
    .string()
    .oneOf(STATUS_OPTIONS.map(s => s.value))
    .required('Status is a required field'),
});

const NewReportForm = ({ isSubmitting, values, setValues }) => {
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
  const onParamsDelete = paramId => setParams([...params.filter(p => p.id !== paramId)]);

  return (
    <Container>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <StyledField required label="Report name" name="name" component={TextField} />
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
          options={[
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
          ]}
        />
        <Button variant="contained" color="primary" type="submit" isSubmitting={isSubmitting}>
          Create
        </Button>
      </ButtonRow>
    </Container>
  );
};

export const NewReportView = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  const handleSubmit = async ({ name, query, status, ...queryOptions }) => {
    try {
      await api.post('admin/reports', {
        name,
        query,
        status,
        queryOptions,
        userId: currentUser.id,
      });
      queryClient.invalidateQueries(['reportList']);
    } catch (err) {
      toast.error(`Failed to create report: ${err.message}`);
    }
  };

  return (
    <>
      <Form
        onSubmit={handleSubmit}
        validationSchema={schema}
        initialValues={{
          status: STATUS_OPTIONS[0].value,
          dataSources: DATA_SOURCE_OPTIONS.map(o => o.value),
          defaultDateRange: DATE_RANGE_OPTIONS[0].value,
        }}
        render={NewReportForm}
      />
    </>
  );
};
