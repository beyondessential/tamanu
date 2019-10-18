import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';

import { Button } from '../../components/Button';
import { ContentPane } from '../../components/ContentPane';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientInfoPane } from '../../components/PatientInfoPane';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';

import { FormGrid } from '../../components/FormGrid';
import { DateInput, TextInput, DateTimeInput } from '../../components/Field';

import { IMAGING_REQUEST_STATUS_LABELS } from '../../constants';

const BackLink = connect(
  null,
  dispatch => ({ onClick: () => dispatch(push('/patients/visit')) }),
)(({ onClick }) => <Button onClick={onClick}>&lt; Back to visit information</Button>);

const ImagingRequestInfoPane = React.memo(({ imagingRequest }) => (
  <FormGrid columns={3}>
    <TextInput value={imagingRequest._id} label="Request ID" />
    <TextInput value={(imagingRequest.type || {}).name} label="Request type" />
    <TextInput value={imagingRequest.urgent ? 'Urgent' : 'Standard'} label="Urgency" />
    <TextInput
      value={IMAGING_REQUEST_STATUS_LABELS[imagingRequest.status] || 'Unknown'}
      label="Status"
    />
    <DateInput value={imagingRequest.requestedDate} label="Requested date" />
    <DateTimeInput value={imagingRequest.sampleTime} label="Sample date" />
    <TextInput
      multiline
      value={imagingRequest.notes}
      label="Notes"
      style={{ gridColumn: '1 / -1' }}
    />
  </FormGrid>
));

export const DumbImagingRequestView = React.memo(({ imagingRequest, patient, loading }) => (
  <React.Fragment>
    <LoadingIndicator loading={loading}>
      <TwoColumnDisplay>
        <PatientInfoPane patient={patient} />
        <div>
          <BackLink />
          <ContentPane>
            <ImagingRequestInfoPane imagingRequest={imagingRequest} />
          </ContentPane>
        </div>
      </TwoColumnDisplay>
    </LoadingIndicator>
  </React.Fragment>
));

export const ImagingRequestView = connect(state => ({
  loading: state.visit.loading,
  imagingRequest: state.imagingRequest,
  patient: state.patient,
}))(DumbImagingRequestView);
