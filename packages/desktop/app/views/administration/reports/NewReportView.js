import React, { useState } from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as yup from 'yup';
import { REPORT_DEFAULT_DATE_RANGES } from '@tamanu/shared/constants/reports';
import { useApi } from '../../../api';
import {
  Button,
  ButtonRow,
  Field,
  Form,
  FormGrid,
  MultiselectField,
  OutlinedButton,
  SelectField,
  TextField,
} from '../../../components';
import { Colors } from '../../../constants';
import { QueryEditor } from './QueryEditor';
import { ParameterList, ParameterItem } from './components/editing';

const Container = styled.div`
  padding: 20px;
  max-width: 500px;
`;

const StyledButton = styled(OutlinedButton)`
  background: ${Colors.white};
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

const schema = {
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
      parameterField: yup.string().required('Parameter field is a required field'),
      suggesterEndpoint: yup.string().required('Suggester endpoint is a required field'),
    }),
  ),
  query: yup.string().required('Query is a required field'),
  status: yup
    .string()
    .oneOf(STATUS_OPTIONS.map(s => s.value))
    .required('Status is a required field'),
};

const NewReportForm = ({ isSubmitting, values, setValues }) => {
  const [showSqlEditor, setShowSqlEditor] = useState(false);
  const handleUpdate = query => setValues({ ...values, query });
  const handleCloseSqlEditor = () => setShowSqlEditor(false);
  const [params, setParams] = useState([]);
  const onParamsAdd = () => setParams([...params, generateDefaultParameter()]);
  const onParamsChange = () => {};
  const onParamsDelete = () => {};

  return (
    <Container>
      <FormGrid columns={1}>
        <Field required label="Report name" name="name" component={TextField} />
        <Field
          label="Can be run on"
          name="dataSources"
          component={MultiselectField}
          options={DATA_SOURCE_OPTIONS}
        />
        <Field
          label="Default date range"
          name="defaultDateRange"
          component={SelectField}
          options={DATE_RANGE_OPTIONS}
        />
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
        <StyledButton onClick={() => setShowSqlEditor(true)}>Edit SQL</StyledButton>
        <QueryEditor
          title="Edit SQL"
          initialValue=""
          onSubmit={handleUpdate}
          open={showSqlEditor}
          onClose={handleCloseSqlEditor}
        />
        <Field
          label="Published status"
          name="status"
          component={SelectField}
          options={[
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
          ]}
        />
        <ButtonRow>
          <StyledButton variant="outlined">Test</StyledButton>
          <Button variant="contained" color="primary" type="submit" isSubmitting={isSubmitting}>
            Create
          </Button>
        </ButtonRow>
      </FormGrid>
    </Container>
  );
};

export const NewReportView = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  const handleSubmit = async payload => {
    try {
      await api.post('admin/reports', payload);
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
