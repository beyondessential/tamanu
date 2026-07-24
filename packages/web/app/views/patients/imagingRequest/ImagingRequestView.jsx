import { pick } from 'es-toolkit/compat';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import * as yup from 'yup';

import {
  FORM_TYPES,
  IMAGING_REQUEST_STATUS_LABELS,
  IMAGING_REQUEST_STATUS_TYPES,
  NOTE_TYPES,
} from '@tamanu/constants';
import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';
import {
  AutocompleteField,
  Button,
  ButtonRow,
  DateTimeField,
  DateTimeInput,
  Field,
  Form,
  FormGrid,
  FormSubmitButton,
  TextField,
  TextInput,
  TranslatedSelectField,
  TranslatedText,
  useApi,
  useDateTime,
  useSettings,
  useSuggester,
  useTranslation,
} from '@tamanu/ui-components';
import { SimpleTopBar } from '../../../components';
import { ContentPane } from '../../../components/ContentPane';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { NoteModalActionBlocker } from '../../../components/NoteModalActionBlocker';
import { ENCOUNTER_TAB_NAMES } from '../../../constants/encounterTabNames';
import { useAuth } from '../../../contexts/Auth';
import { useLocalisation } from '../../../contexts/Localisation';
import { CancelModalButton } from './CancelModalButton';
import { PrintModalButton } from './PrintModalButton';

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
    <FormGrid columns={3} data-testid="formgrid-ayrj">
      <TextInput
        value={imagingRequest.displayId}
        label={<TranslatedText stringId="general.requestId.label" fallback="Request ID" />}
        disabled
        data-testid="textinput-jqfd"
      />
      <TextInput
        value={imagingTypes[imagingRequest.imagingType]?.label || 'Unknown'}
        label={<TranslatedText stringId="general.requestType.label" fallback="Request type" />}
        disabled
        data-testid="textinput-wgcp"
      />
      <TextInput
        value={imagingPriorities.find(p => p.value === imagingRequest.priority)?.label || ''}
        label={<TranslatedText stringId="imaging.priority.label" fallback="Priority" />}
        disabled
        data-testid="textinput-z6l1"
      />
      <NoteModalActionBlocker>
        <Field
          name="status"
          label={<TranslatedText stringId="general.status.label" fallback="Status" />}
          component={TranslatedSelectField}
          enumValues={IMAGING_REQUEST_STATUS_LABELS}
          transformOptions={options => {
            return isCancelled
              ? [
                  {
                    label: IMAGING_REQUEST_STATUS_LABELS[IMAGING_REQUEST_STATUS_TYPES.CANCELLED],
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
          data-testid="field-mfc2"
        />
      </NoteModalActionBlocker>
      <DateTimeInput
        value={imagingRequest.requestedDate}
        label={
          <TranslatedText stringId="general.requestDateTime.label" fallback="Request date & time" />
        }
        disabled
        data-testid="datetimeinput-xhue"
      />
      {allowLocationChange && (
        <Field
          label={<TranslatedText stringId="imaging.facilityArea.label" fallback="Facility area" />}
          name="locationGroupId"
          component={AutocompleteField}
          suggester={locationGroupSuggester}
          data-testid="field-3ny4"
        />
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
        label={<TranslatedText stringId="imaging.areas.label" fallback="Areas to be imaged" />}
        style={{ gridColumn: '1 / -1', minHeight: '60px' }}
        disabled
        data-testid="textinput-qs8j"
      />
      <TextInput
        multiline
        value={imagingRequest.notes
          ?.filter(note => note.noteTypeId === NOTE_TYPES.OTHER)
          .map(note => note.content)
          .join('\n')}
        label={<TranslatedText stringId="general.notes.label" fallback="Notes" />}
        style={{ gridColumn: '1 / -1', minHeight: '60px' }}
        disabled
        data-testid="textinput-ll77"
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
  const Wrapper = !disabled ? NoteModalActionBlocker : React.Fragment;

  return (
    <FormGrid columns={2} data-testid="formgrid-j2u1">
      <Wrapper>
        <Field
          label={<TranslatedText stringId="imaging.completedBy.label" fallback="Completed by" />}
          name="newResult.completedById"
          placeholder={getTranslation('imaging.completedBy.placeholder', 'Search')}
          component={AutocompleteField}
          suggester={practitionerSuggester}
          disabled={disabled}
          data-testid="field-ta7y"
        />
        <Field
          label={<TranslatedText stringId="imaging.completedDate.label" fallback="Completed" />}
          name="newResult.completedAt"
          component={DateTimeField}
          disabled={disabled}
          data-testid="field-wxo5"
        />
        <Field
          label={
            <TranslatedText stringId="imaging.description.label" fallback="Result description" />
          }
          name="newResult.description"
          placeholder={getTranslation('imaging.description.placeholder', 'Result description...')}
          multiline
          component={TextField}
          style={{ gridColumn: '1 / -1', minHeight: '3em' }}
          disabled={disabled}
          data-testid="field-2pjt"
        />
      </Wrapper>
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
    <BottomAlignFormGrid columns={externalUrl ? 3 : 2} data-testid="bottomalignformgrid-b6k1">
      <TextInput
        label={<TranslatedText stringId="imaging.completedBy.label" fallback="Completed by" />}
        value={completedBy?.displayName ?? (externalUrl && 'External provider') ?? ''}
        disabled
        data-testid="textinput-j2ac"
      />
      <DateTimeInput
        label={<TranslatedText stringId="imaging.completedAt.label" fallback="Completed" />}
        value={completedAt}
        disabled
        data-testid="datetimeinput-qfj9"
      />
      {externalUrl && (
        <Button color="secondary" onClick={onOpenUrl} data-testid="button-qol1">
          View image (external link)
        </Button>
      )}
      <TextInput
        label={
          <TranslatedText stringId="imaging.description.label" fallback="Result description" />
        }
        value={description ?? ''}
        multiline
        disabled
        style={{ gridColumn: '1 / -1', minHeight: '3em' }}
        data-testid="textinput-xfsd"
      />
      <hr />
    </BottomAlignFormGrid>
  );
};

const ImagingResultsSection = ({ results }) => {
  if (results?.length === 0) return null;

  return (
    <>
      <h3>Results</h3>
      {results?.map((result, index) => (
        <ImagingResultRow
          key={result.id}
          result={result}
          data-testid={`imagingresultrow-ih51-${index}`}
        />
      ))}
    </>
  );
};

const ImagingRequestInfoPane = React.memo(({ imagingRequest, onSubmit }) => {
  const api = useApi();
  const { facilityId } = useAuth();
  const { getCurrentDateTime } = useDateTime();

  const isCancelled = imagingRequest.status === IMAGING_REQUEST_STATUS_TYPES.CANCELLED;
  const getCanAddResult = values => values.status === IMAGING_REQUEST_STATUS_TYPES.COMPLETED;
  // completedAt is pre-filled with the current time, so it can't tell us whether the user actually
  // entered a result. Only submit newResult when they've filled in a clinician or a description,
  // otherwise every save of a completed request would append a blank result row.
  const hasEnteredResult = newResult =>
    Boolean(newResult?.completedById || newResult?.description);

  return (
    <Form
      // Only submit specific fields for update
      onSubmit={async values => {
        const updatedValues = pick(values, 'status', 'completedById', 'locationGroupId');
        if (getCanAddResult(values) && hasEnteredResult(values.newResult)) {
          updatedValues.newResult = values.newResult;
        }

        await api.put(`imagingRequest/${imagingRequest.id}`, { ...updatedValues, facilityId });

        onSubmit(updatedValues);
      }}
      // Updates form to reflect changes in initialValues
      enableReinitialize
      initialStatus={{}}
      formType={FORM_TYPES.EDIT_FORM}
      initialValues={{
        ...imagingRequest,
        newResult: {
          completedAt: getCurrentDateTime(),
        },
      }}
      validationSchema={yup.object().shape({
        status: yup
          .string()
          .required()
          .translatedLabel(<TranslatedText stringId="general.status.label" fallback="Status" />),
      })}
      render={({ values }) => {
        const canAddResult = getCanAddResult(values);
        return (
          <>
            <ImagingRequestSection
              currentStatus={values.status}
              imagingRequest={imagingRequest}
              data-testid="imagingrequestsection-dv93"
            />
            <ImagingResultsSection
              results={imagingRequest.results}
              data-testid="imagingresultssection-5wyc"
            />
            <h4>
              {imagingRequest.results.length > 0 ? (
                <TranslatedText
                  stringId="imaging.action.addAdditionalResult"
                  fallback="Add additional result"
                />
              ) : (
                <TranslatedText stringId="imaging.action.addResult" fallback="Add result" />
              )}
            </h4>
            <NewResultSection disabled={!canAddResult} data-testid="newresultsection-poyy" />
            <ButtonRow style={{ marginTop: 20 }} data-testid="buttonrow-52n1">
              {!isCancelled && (
                <NoteModalActionBlocker>
                  <FormSubmitButton
                    text={<TranslatedText stringId="general.action.save" fallback="Save" />}
                    data-testid="formsubmitbutton-nisz"
                  />
                </NoteModalActionBlocker>
              )}
            </ButtonRow>
          </>
        );
      }}
      data-testid="form-vzo9"
    />
  );
});

export const ImagingRequestView = () => {
  const imagingRequest = useSelector(state => state.imagingRequest);
  const patient = useSelector(state => state.patient);

  const params = useParams();
  const navigate = useNavigate();
  const onNavigateBackToImaging = () => {
    navigate(
      `/patients/${params.category}/${params.patientId}/encounter/${params.encounterId}?tab=${ENCOUNTER_TAB_NAMES.IMAGING}`,
    );
  };

  const isCancellable = ![
    IMAGING_REQUEST_STATUS_TYPES.CANCELLED,
    IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR,
    IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
  ].includes(imagingRequest.status);

  if (patient.loading || imagingRequest.loading)
    return <LoadingIndicator data-testid="loadingindicator-31bz" />;

  return (
    <>
      <SimpleTopBar
        title={<TranslatedText stringId="imaging.topbar.title" fallback="Imaging request" />}
        data-testid="simpletopbar-gn10"
      >
        {isCancellable && (
          <CancelModalButton
            imagingRequest={imagingRequest}
            onCancel={onNavigateBackToImaging}
            data-testid="cancelmodalbutton-e5ch"
          />
        )}
        <PrintModalButton
          imagingRequest={imagingRequest}
          patient={patient}
          data-testid="printmodalbutton-l9eq"
        />
      </SimpleTopBar>
      <ContentPane data-testid="contentpane-ukth">
        <ImagingRequestInfoPane
          imagingRequest={imagingRequest}
          onSubmit={onNavigateBackToImaging}
          data-testid="imagingrequestinfopane-rnz1"
        />
      </ContentPane>
    </>
  );
};
