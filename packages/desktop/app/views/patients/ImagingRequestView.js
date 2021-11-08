import React from 'react';
import { connect, useDispatch } from 'react-redux';
import { push } from 'connected-react-router';

import { Form, Formik } from 'formik';

import { Button } from '../../components/Button';
import { ContentPane } from '../../components/ContentPane';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientInfoPane } from '../../components/PatientInfoPane';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { TopBar } from '../../components/TopBar';
import { ButtonRow } from '../../components/ButtonRow'
import { FormGrid } from '../../components/FormGrid';
import { DateInput, TextInput, SelectField, Field } from '../../components/Field';
import { useApi } from '../../api';
import { IMAGING_REQUEST_STATUS_LABELS } from '../../constants';

const BackLink = connect(null, dispatch => ({
  onClick: () => dispatch(push('/patients/encounter')),
}))(({ onClick }) => <Button onClick={onClick}>&lt; Back to encounter information</Button>);

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

const DumbImagingRequestInfoPane = React.memo(({ imagingRequest, onSubmit }) => (
  <Formik
    onSubmit={({ status, results }) => {
      const updatedImagingRequest = {
        status,
        results,
      };
      onSubmit(updatedImagingRequest);
    }}
    initialValues={{
      status: imagingRequest.status,
      results: imagingRequest.results,
    }}
  >
    {({ values, dirty, handleChange }) => (
      <Form>
        <FormGrid columns={3}>
          <TextInput value={imagingRequest.id} label="Request ID" disabled />
          <TextInput value={imagingRequest.imagingType?.name} label="Request type" />
          <TextInput value={imagingRequest.urgent ? 'Urgent' : 'Standard'} label="Urgency" />
          <Field name="status" label="Status" component={SelectField} options={statusOptions} />
          <DateInput value={imagingRequest.requestedDate} label="Requested date" />
          <TextInput
            multiline
            value={imagingRequest.note}
            label="Notes"
            style={{ gridColumn: '1 / -1' }}
          />
          {imagingRequest?.status === 'completed' && (
            <TextInput
              name="results"
              label="Results Description"
              multiline
              value={values.results || imagingRequest.results}
              onChange={handleChange}
              style={{ gridColumn: '1 / -1' }}
            />
          )}
          {dirty && (
            // Needs custom styling to properly display view image button to the left
            <ButtonRow style={{ gridTemplateColumns: '8rem auto 8rem' }}>
              <Button
                variant="contained"
                color="secondary"
                style={{
                  gridColumn: '1 / span 1',
                  // Only show button when status is completed and keep it on the
                  // document layout to preserve correct row button display
                  visibility: values.status === 'completed' ? 'visible' : 'hidden',
                }}
                disabled
              >
                Add image link
              </Button>
              <Button variant="outlined" color="primary" type="submit">
                Save
              </Button>
            </ButtonRow>
          )}
        </FormGrid>
      </Form>
    )}
  </Formik>
));

export const DumbImagingRequestView = React.memo(({ imagingRequest, patient }) => {
  const api = useApi();
  const dispatch = useDispatch();

  const onSubmit = data => {
    api.put(`imagingRequest/${imagingRequest.id}`, { ...data });
    dispatch(push('/patients/encounter'));
  };

  if (patient.loading) return <LoadingIndicator />;
  return (
    <TwoColumnDisplay>
      <PatientInfoPane patient={patient} />
      <div>
        <TopBar title="Imaging request" />
        <BackLink />
        <ContentPane>
          <DumbImagingRequestInfoPane imagingRequest={imagingRequest} onSubmit={onSubmit} />
        </ContentPane>
      </div>
    </TwoColumnDisplay>
  );
});

export const ImagingRequestView = connect(state => ({
  imagingRequest: state.imagingRequest,
  patient: state.patient,
}))(DumbImagingRequestView);
