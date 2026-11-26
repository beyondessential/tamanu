import React from 'react';
import { PATIENT_ISSUE_LABELS } from '@tamanu/constants';
import { DateDisplay, TranslatedEnum } from '@tamanu/ui-components';
import { TranslatedText } from '../Translation/TranslatedText';
import { ResolveOngoingConditionForm } from '../../forms/OngoingConditionForm';
import { InfoPaneAddEditForm } from './InfoPaneAddEditForm';
import {
  InfoPaneFormContainer,
  InfoPaneItemDetails,
  InfoPaneTextLink,
  PractitionerName,
} from './InfoPaneListItem';
import { PANE_SECTION_IDS } from './paneSections';

const recordedDateField = ({ recordedDate }) => ({
  key: 'recordedDate',
  label: <TranslatedText stringId="general.recordedDate.label" fallback="Date recorded" />,
  value: recordedDate && <DateDisplay date={recordedDate} />,
});

const notesField = ({ note }) => ({
  key: 'note',
  label: <TranslatedText stringId="general.notes.label" fallback="Notes" />,
  value: note,
});

const clinicianField = practitionerId => ({
  key: 'clinician',
  label: (
    <TranslatedText stringId="general.localisedField.clinician.label.short" fallback="Clinician" />
  ),
  value: <PractitionerName id={practitionerId} />,
});

const resolutionFields = ({ resolutionDate, resolutionPractitionerId, resolutionNote }) => [
  {
    key: 'resolutionDate',
    label: <TranslatedText stringId="conditions.resolutionDate.label" fallback="Date resolved" />,
    value: resolutionDate && <DateDisplay date={resolutionDate} />,
  },
  {
    key: 'resolutionClinician',
    label: (
      <TranslatedText
        stringId="patient.ongoingCondition.resolutionPractitionerId.label"
        fallback=":clinician confirming resolution"
        replacements={{
          clinician: (
            <TranslatedText
              stringId="general.localisedField.clinician.label.short"
              fallback="Clinician"
            />
          ),
        }}
      />
    ),
    value: <PractitionerName id={resolutionPractitionerId} />,
  },
  {
    key: 'resolutionNote',
    label: (
      <TranslatedText stringId="conditions.resolutionNote.label" fallback="Notes on resolution" />
    ),
    value: resolutionNote,
  },
];

export const OngoingConditionDetails = ({
  item,
  onEdit,
  readonly,
  isResolving,
  onResolve,
  onCloseResolve,
}) => {
  const fields = [
    recordedDateField(item),
    notesField(item),
    clinicianField(item.examinerId),
    ...(item.resolved ? resolutionFields(item) : []),
  ];
  const canResolve = !item.resolved && !readonly && !isResolving;

  return (
    <InfoPaneItemDetails
      fields={fields}
      onEdit={onEdit}
      action={
        canResolve && (
          <InfoPaneTextLink
            type="button"
            onClick={onResolve}
            data-testid="mark-condition-resolved-button"
          >
            <TranslatedText
              stringId="conditions.action.markAsResolved"
              fallback="Mark as resolved"
            />
          </InfoPaneTextLink>
        )
      }
    >
      {isResolving && (
        <InfoPaneFormContainer>
          <InfoPaneAddEditForm
            Form={ResolveOngoingConditionForm}
            endpoint="ongoingCondition"
            item={item}
            id={PANE_SECTION_IDS.CONDITIONS}
            onClose={onCloseResolve}
          />
        </InfoPaneFormContainer>
      )}
    </InfoPaneItemDetails>
  );
};

export const AllergyDetails = ({ item, onEdit }) => (
  <InfoPaneItemDetails
    fields={[recordedDateField(item), notesField(item), clinicianField(item.practitionerId)]}
    onEdit={onEdit}
  />
);

export const FamilyHistoryDetails = ({ item, onEdit }) => (
  <InfoPaneItemDetails
    fields={[
      recordedDateField(item),
      {
        key: 'relationship',
        label: (
          <TranslatedText stringId="familyHistory.relations.label" fallback="Relation to patient" />
        ),
        value: item.relationship,
      },
      notesField(item),
    ]}
    onEdit={onEdit}
  />
);

export const PatientIssueDetails = ({ item, onEdit }) => (
  <InfoPaneItemDetails
    fields={[
      {
        key: 'type',
        label: <TranslatedText stringId="general.type.label" fallback="Type" />,
        value: <TranslatedEnum value={item.type} enumValues={PATIENT_ISSUE_LABELS} />,
      },
      recordedDateField(item),
    ]}
    onEdit={onEdit}
  />
);
