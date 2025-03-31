import React, { useCallback } from 'react';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { push } from 'connected-react-router';
import { useParams } from 'react-router-dom';
import { pick } from 'lodash';
import styled from 'styled-components';

import {
  IMAGING_REQUEST_STATUS_LABELS,
  IMAGING_REQUEST_STATUS_TYPES,
  LAB_REQUEST_STATUS_CONFIG,
  NOTE_TYPES,
} from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { FORM_TYPES } from '../../../constants';
import { ENCOUNTER_TAB_NAMES } from '../../../constants/encounterTabNames';

import { useLocalisation } from '../../../contexts/Localisation';
import { useApi, useSuggester } from '../../../api';

import { Button, FormSubmitButton } from '../../../components/Button';
import { ContentPane } from '../../../components/ContentPane';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { ButtonRow } from '../../../components/ButtonRow';
import { FormGrid } from '../../../components/FormGrid';
import {
  AutocompleteField,
  DateTimeField,
  DateTimeInput,
  Field,
  Form,
  TextField,
  TextInput,
  TranslatedSelectField,
} from '../../../components/Field';
import { SimpleTopBar } from '../../../components';

import { CancelModalButton } from './CancelModalButton';
import { PrintModalButton } from './PrintModalButton';
import { getReferenceDataStringId, TranslatedText } from '../../../components/Translation';
import { useTranslation } from '../../../contexts/Translation';
import { useSettings } from '../../../contexts/Settings';
import { useAuth } from '../../../contexts/Auth';

const ImagingRequestSection = ({ currentStatus, imagingRequest }) => {
  const { getLocalisation } = useLocalisation();
  const { getSetting } = useSettings();
  const { getTranslation } = useTranslation();
  const imagingPriorities = getSetting('imagingPriorities') || [];
  const imagingTypes = getLocalisation('imagingTypes') || {};

  const locationGroupSuggester = useSuggester('facilityLocationGroup');
  const isCancelled = imagingRequest.status === IMAGING_REQUEST_STATUS_TYPES.CANCELLED;

  const allowLocationChange = [
    IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS,
    IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
  ].includes(currentStatus);

  return (
    <FormGrid columns={3}>
      <TextInput
        value={imagingRequest.displayId}
        label={<TranslatedText
          stringId="imaging.requestId.label"
          fallback="Request ID"
          data-test-id='translatedtext-96ef' />}
        disabled
      />
      <TextInput
        value={imagingTypes[imagingRequest.imagingType]?.label || 'Unknown'}
        label={<TranslatedText
          stringId="general.requestType.label"
          fallback="Request type"
          data-test-id='translatedtext-zqb9' />}
        disabled
      />
      <TextInput
        value={imagingPriorities.find(p => p.value === imagingRequest.priority)?.label || ''}
        label={<TranslatedText
          stringId="imaging.priority.label"
          fallback="Priority"
          data-test-id='translatedtext-277b' />}
        disabled
      />
      <Field
        name="status"
        label={<TranslatedText
          stringId="general.status.label"
          fallback="Status"
          data-test-id='translatedtext-hrvt' />}
        component={TranslatedSelectField}
        enumValues={IMAGING_REQUEST_STATUS_LABELS}
        transformOptions={options => {
          return isCancelled
            ? [
                {
                  label: LAB_REQUEST_STATUS_CONFIG[IMAGING_REQUEST_STATUS_TYPES.CANCELLED].label,
                  value: IMAGING_REQUEST_STATUS_TYPES.CANCELLED,
                },
              ]
            : options.filter(
                option =>
                  ![
                    IMAGING_REQUEST_STATUS_TYPES.DELETED,
                    IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR,
                    IMAGING_REQUEST_STATUS_TYPES.CANCELLED,
                  ].includes(option.value),
              );
        }}
        disabled={isCancelled}
        isClearable={false}
        required
        data-test-id='field-1ksv' />
      <DateTimeInput
        value={imagingRequest.requestedDate}
        label={
          <TranslatedText
            stringId="general.requestDateTime.label"
            fallback="Request date & time"
            data-test-id='translatedtext-jkl2' />
        }
        disabled
      />
      {allowLocationChange && (
        <Field
          label={<TranslatedText
            stringId="imaging.facilityArea.label"
            fallback="Facility area"
            data-test-id='translatedtext-zigu' />}
          name="locationGroupId"
          component={AutocompleteField}
          suggester={locationGroupSuggester}
          data-test-id='field-xlkx' />
      )}
      <TextInput
        multiline
        value={
          // Either use free text area or multi-select areas data
          imagingRequest.areas?.length
            ? imagingRequest.areas
                .map(area =>
                  getTranslation(getReferenceDataStringId(area.id, area.type), area.name),
                )
                .join(', ')
            : imagingRequest.areaNote
        }
        label={<TranslatedText
          stringId="imaging.areas.label"
          fallback="Areas to be imaged"
          data-test-id='translatedtext-meiw' />}
        style={{ gridColumn: '1 / -1', minHeight: '60px' }}
        disabled
      />
      <TextInput
        multiline
        value={imagingRequest.notes
          ?.filter(note => note.noteType === NOTE_TYPES.OTHER)
          .map(note => note.content)
          .join('\n')}
        label={<TranslatedText
          stringId="general.notes.label"
          fallback="Notes"
          data-test-id='translatedtext-6j3d' />}
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
  const { getTranslation } = useTranslation();

  return (
    <FormGrid columns={2}>
      <Field
        label={<TranslatedText
          stringId="imaging.completedBy.label"
          fallback="Completed by"
          data-test-id='translatedtext-0x70' />}
        name="newResult.completedById"
        placeholder={getTranslation('imaging.completedBy.placeholder', 'Search')}
        component={AutocompleteField}
        suggester={practitionerSuggester}
        disabled={disabled}
        data-test-id='field-pqwd' />
      <Field
        label={<TranslatedText
          stringId="imaging.completedDate.label"
          fallback="Completed"
          data-test-id='translatedtext-rw7b' />}
        name="newResult.completedAt"
        saveDateAsString
        component={DateTimeField}
        disabled={disabled}
        data-test-id='field-yt47' />
      <Field
        label={
          <TranslatedText
            stringId="imaging.description.label"
            fallback="Result description"
            data-test-id='translatedtext-r78b' />
        }
        name="newResult.description"
        placeholder={getTranslation('imaging.description.placeholder', 'Result description...')}
        multiline
        component={TextField}
        style={{ gridColumn: '1 / -1', minHeight: '3em' }}
        disabled={disabled}
        data-test-id='field-g5bu' />
    </FormGrid>
  );
};

function openUrl(url) {
  window.open(url, '_blank');
}

const ImagingResultRow = ({ result }) => {
  const { externalUrl, completedAt, completedBy, description } = result;

  const onOpenUrl = useCallback(() => openUrl(externalUrl), [externalUrl]);

  return (
    <BottomAlignFormGrid columns={externalUrl ? 3 : 2}>
      <TextInput
        label={<TranslatedText
          stringId="imaging.completedBy.label"
          fallback="Completed by"
          data-test-id='translatedtext-jkjh' />}
        value={completedBy?.displayName ?? (externalUrl && 'External provider') ?? ''}
        disabled
      />
      <DateTimeInput
        label={<TranslatedText
          stringId="imaging.completedAt.label"
          fallback="Completed"
          data-test-id='translatedtext-uwhe' />}
        value={completedAt}
        disabled
      />
      {externalUrl && (
        <Button color="secondary" onClick={onOpenUrl} data-test-id='button-un9w'>
          View image (external link)
        </Button>
      )}
      <TextInput
        label={
          <TranslatedText
            stringId="imaging.description.label"
            fallback="Result description"
            data-test-id='translatedtext-2qcx' />
        }
        value={description ?? ''}
        multiline
        disabled
        style={{ gridColumn: '1 / -1', minHeight: '3em' }}
      />
      <hr />
    </BottomAlignFormGrid>
  );
};

const ImagingResultsSection = ({ results }) => {
  if (results?.length === 0) return null;

  return (
    <>
      <h3 data-test-id='h3-vabh'>Results</h3>
      {results?.map(result => (
        <ImagingResultRow key={result.id} result={result} />
      ))}
    </>
  );
};

const ImagingRequestInfoPane = React.memo(({ imagingRequest, onSubmit }) => {
  const api = useApi();
  const { facilityId } = useAuth();

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

        await api.put(`imagingRequest/${imagingRequest.id}`, { ...updatedValues, facilityId });

        onSubmit(updatedValues);
      }}
      enableReinitialize // Updates form to reflect changes in initialValues
      initialStatus={{}}
      formType={FORM_TYPES.EDIT_FORM}
      initialValues={{
        ...imagingRequest,
        newResult: {
          completedAt: getCurrentDateTimeString(),
        },
      }}
      validationSchema={yup.object().shape({
        status: yup
          .string()
          .required()
          .translatedLabel(<TranslatedText
          stringId="general.status.label"
          fallback="Status"
          data-test-id='translatedtext-qgbz' />),
      })}
      render={({ values }) => {
        const canAddResult = getCanAddResult(values);
        return (
          <>
            <ImagingRequestSection currentStatus={values.status} imagingRequest={imagingRequest} />
            <ImagingResultsSection results={imagingRequest.results} />
            <h4 data-test-id='h4-tnj7'>
              {imagingRequest.results.length > 0 ? (
                <TranslatedText
                  stringId="imaging.action.addAdditionalResult"
                  fallback="Add additional result"
                  data-test-id='translatedtext-ds6w' />
              ) : (
                <TranslatedText
                  stringId="imaging.action.addResult"
                  fallback="Add result"
                  data-test-id='translatedtext-z4zx' />
              )}
            </h4>
            <NewResultSection disabled={!canAddResult} />
            <ButtonRow style={{ marginTop: 20 }} data-test-id='buttonrow-qx3s'>
              {!isCancelled && (
                <FormSubmitButton
                  text={<TranslatedText
                    stringId="general.action.save"
                    fallback="Save"
                    data-test-id='translatedtext-uwln' />}
                  data-test-id='formsubmitbutton-pzqq' />
              )}
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

  if (patient.loading || imagingRequest.loading) return <LoadingIndicator />;

  return (
    <>
      <SimpleTopBar
        title={<TranslatedText
          stringId="imaging.topbar.title"
          fallback="Imaging request"
          data-test-id='translatedtext-zv47' />}
      >
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
