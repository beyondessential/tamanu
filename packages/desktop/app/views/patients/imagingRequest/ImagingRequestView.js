import React, { useCallback } from 'react';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import { useParams } from 'react-router-dom';
import { pick } from 'lodash';
import styled from 'styled-components';

import { IMAGING_REQUEST_STATUS_TYPES, LAB_REQUEST_STATUS_CONFIG } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { IMAGING_REQUEST_STATUS_OPTIONS } from '../../../constants';
import { ENCOUNTER_TAB_NAMES } from '../../../constants/encounterTabNames';

import { useLocalisation } from '../../../contexts/Localisation';
import { useElectron } from '../../../contexts/Electron';
import { useApi, useSuggester } from '../../../api';

import { Button } from '../../../components/Button';
import { ContentPane } from '../../../components/ContentPane';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { ButtonRow } from '../../../components/ButtonRow';
import { FormGrid } from '../../../components/FormGrid';
import {
  TextInput,
  SelectField,
  Field,
  AutocompleteField,
  DateTimeInput,
  DateTimeField,
  TextField,
  Form,
} from '../../../components/Field';
import { SimpleTopBar } from '../../../components';

import { CancelModalButton } from './CancelModalButton';
import { PrintModalButton } from './PrintModalButton';

const ImagingRequestSection = ({ currentStatus, imagingRequest }) => {
  const { getLocalisation } = useLocalisation();
  const imagingPriorities = getLocalisation('imagingPriorities') || [];
  const imagingTypes = getLocalisation('imagingTypes') || {};

  const locationGroupSuggester = useSuggester('facilityLocationGroup');
  const isCancelled = imagingRequest.status === IMAGING_REQUEST_STATUS_TYPES.CANCELLED;
  // Just needed for read only state
  const cancelledOption = [
    {
      label: LAB_REQUEST_STATUS_CONFIG[IMAGING_REQUEST_STATUS_TYPES.CANCELLED].label,
      value: IMAGING_REQUEST_STATUS_TYPES.CANCELLED,
    },
  ];

  const allowLocationChange = [
    IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS,
    IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
  ].includes(currentStatus);

  return (
    <FormGrid columns={3}>
      <TextInput value={imagingRequest.displayId} label="Request ID" disabled />
      <TextInput
        value={imagingTypes[imagingRequest.imagingType]?.label || 'Unknown'}
        label="Request type"
        disabled
      />
      <TextInput
        value={imagingPriorities.find(p => p.value === imagingRequest.priority)?.label || ''}
        label="Priority"
        disabled
      />
      <Field
        name="status"
        label="Status"
        component={SelectField}
        options={isCancelled ? cancelledOption : IMAGING_REQUEST_STATUS_OPTIONS}
        disabled={isCancelled}
        isClearable={false}
        required
      />
      <DateTimeInput value={imagingRequest.requestedDate} label="Request date and time" disabled />
      {allowLocationChange && (
        <Field
          label="Facility area"
          name="locationGroupId"
          component={AutocompleteField}
          suggester={locationGroupSuggester}
        />
      )}
      <TextInput
        multiline
        value={
          // Either use free text area or multi-select areas data
          imagingRequest.areas?.length
            ? imagingRequest.areas.map(area => area.name).join(', ')
            : imagingRequest.areaNote
        }
        label="Areas to be imaged"
        style={{ gridColumn: '1 / -1', minHeight: '60px' }}
        disabled
      />
      <TextInput
        multiline
        value={imagingRequest.note}
        label="Notes"
        style={{ gridColumn: '1 / -1', minHeight: '60px' }}
        disabled
      />
    </FormGrid>
  );
};

const BottomAlignFormGrid = styled(FormGrid)`
  align-items: end;

  > button {
    margin-bottom: 2px;
  }
`;

const NewResultSection = ({ disabled = false }) => {
  const practitionerSuggester = useSuggester('practitioner');

  return (
    <FormGrid columns={2}>
      <Field
        label="Completed by"
        name="newResult.completedById"
        placeholder="Search"
        component={AutocompleteField}
        suggester={practitionerSuggester}
        disabled={disabled}
      />
      <Field
        label="Completed"
        name="newResult.completedAt"
        saveDateAsString
        component={DateTimeField}
        disabled={disabled}
      />
      <Field
        label="Result description"
        name="newResult.description"
        placeholder="Result description..."
        multiline
        component={TextField}
        style={{ gridColumn: '1 / -1', minHeight: '3em' }}
        disabled={disabled}
      />
    </FormGrid>
  );
};

const ImagingResultRow = ({ result }) => {
  const { externalUrl, completedAt, completedBy, description } = result;

  const { openUrl } = useElectron();
  const onOpenUrl = useCallback(() => openUrl(externalUrl), [openUrl, externalUrl]);

  return (
    <BottomAlignFormGrid columns={externalUrl ? 3 : 2}>
      <TextInput
        label="Completed by"
        value={completedBy?.displayName ?? (externalUrl && 'External provider') ?? ''}
        disabled
      />
      <DateTimeInput label="Completed" value={completedAt} disabled />
      {externalUrl && (
        <Button color="secondary" onClick={onOpenUrl}>
          View image (external link)
        </Button>
      )}

      <TextInput
        label="Result description"
        value={description}
        multiline
        disabled
        style={{ gridColumn: '1 / -1', minHeight: '3em' }}
      />
      <hr />
    </BottomAlignFormGrid>
  );
};

const ImagingResultsSection = ({ results }) => {
  if (results.length === 0) return null;

  return (
    <>
      <h3>Results</h3>
      {results.map(result => (
        <ImagingResultRow key={result.id} result={result} />
      ))}
    </>
  );
};

const ImagingRequestInfoPane = React.memo(({ imagingRequest, onSubmit }) => {
  const api = useApi();

  const isCancelled = imagingRequest.status === IMAGING_REQUEST_STATUS_TYPES.CANCELLED;
  const getCanAddResult = values => values.status === IMAGING_REQUEST_STATUS_TYPES.COMPLETED;

  return (
    <Form
      // Only submit specific fields for update
      onSubmit={async values => {
        const updatedValues = pick(values, 'status', 'completedById', 'locationGroupId');
        if (getCanAddResult(values)) {
          updatedValues.newResult = values.newResult;
        }

        await api.put(`imagingRequest/${imagingRequest.id}`, updatedValues);

        onSubmit(updatedValues);
      }}
      enableReinitialize // Updates form to reflect changes in initialValues
      initialStatus={{}}
      initialValues={{
        ...imagingRequest,
        newResult: {
          completedAt: getCurrentDateTimeString(),
        },
      }}
      validationSchema={yup.object().shape({
        status: yup.string().required('Status is required'),
      })}
      render={({ values }) => {
        const canAddResult = getCanAddResult(values);
        return (
          <>
            <ImagingRequestSection currentStatus={values.status} imagingRequest={imagingRequest} />
            <ImagingResultsSection results={imagingRequest.results} />
            <h4>{imagingRequest.results.length > 0 ? 'Add additional result' : 'Add result'}</h4>
            <NewResultSection disabled={!canAddResult} />
            <ButtonRow style={{ marginTop: 20 }}>
              {!isCancelled && <Button type="submit">Save</Button>}
            </ButtonRow>
          </>
        );
      }}
    />
  );
});

export const ImagingRequestView = () => {
  const imagingRequest = useSelector(state => state.imagingRequest);
  const patient = useSelector(state => state.patient);

  const dispatch = useDispatch();
  const params = useParams();
  const onNavigateBackToImaging = () => {
    dispatch(
      push(
        `/patients/${params.category}/${params.patientId}/encounter/${params.encounterId}?tab=${ENCOUNTER_TAB_NAMES.IMAGING}`,
      ),
    );
  };

  const isCancellable = ![
    IMAGING_REQUEST_STATUS_TYPES.CANCELLED,
    IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR,
    IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
  ].includes(imagingRequest.status);

  if (patient.loading) return <LoadingIndicator />;

  return (
    <>
      <SimpleTopBar title="Imaging request">
        {isCancellable && (
          <CancelModalButton imagingRequest={imagingRequest} onCancel={onNavigateBackToImaging} />
        )}
        <PrintModalButton imagingRequest={imagingRequest} patient={patient} />
      </SimpleTopBar>
      <ContentPane>
        <ImagingRequestInfoPane
          imagingRequest={imagingRequest}
          onSubmit={onNavigateBackToImaging}
        />
      </ContentPane>
    </>
  );
};
