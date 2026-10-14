import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router';
import {
  FormErrorMessage,
  FormPrimaryButton,
  FormSecondaryButton,
  notifySuccess,
  TranslatedText,
  useTranslation,
} from '@tamanu/ui-components';
import { UpdatePatientDetailsRequestSchema } from '@tamanu/shared/schemas/patientPortal';

import { useUpdatePatientDetails } from '@api/mutations';
import { usePortalSettingsQuery } from '@api/queries/usePortalSettingsQuery';
import {
  BackLink,
  PageColumn,
  PageLoading,
  PageTitle,
  Panel,
  Section,
  SectionTitle,
} from '@components/layout';
import { DiscardChangesDialog } from '@components/DiscardChangesDialog';
import { useUnsavedChangesGuard } from '@components/useUnsavedChangesGuard';
import { useCurrentUser } from '@routes/PrivateRoute';
import {
  DETAIL_GROUPS,
  type DetailField,
  type DetailGroup,
  getEditableFields,
  getShownFields,
} from '../../features/details/detailFields';
import { DetailInputField } from '../../features/details/DetailInputField';
import { DetailGrid, DetailList, hasDetail } from '../../features/details/DetailsRecord';

const Note = styled.p`
  margin: 0;
  padding: 12px 16px;
  border-top: 1px solid var(--pf-line);
  color: var(--pf-text-secondary);
`;

const FixedDetails = styled(DetailGrid)`
  padding-top: 16px;
`;

const EditGroup = styled(Section)`
  margin-top: 28px;
`;

const Fields = styled(Panel)`
  padding: 4px 16px 20px;
`;

/** Save and Cancel, kept at the bottom of the screen however long the form is. */
const ActionBar = styled.div`
  position: sticky;
  bottom: 0;
  background: var(--pf-surface);
  border-top: var(--pf-border) solid var(--pf-outline);
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
`;

const SaveError = styled(FormErrorMessage)`
  max-width: 608px;
  margin: 0 auto 10px;
`;

const ActionBarContent = styled.div`
  max-width: 608px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 10px;
`;

type Values = Record<string, string>;

const toFormValues = (fields: DetailField[], patient: ReturnType<typeof useCurrentUser>) =>
  Object.fromEntries(fields.map(field => [field.name, field.getValue(patient) ?? '']));

/** Back on the dashboard, with the patient's details open. */
const DETAILS_PATH = '/#details';

/** The patient's details, all edited on one screen. */
export const EditPatientDetailsView = () => {
  const { data: settings, isLoading } = usePortalSettingsQuery();
  const patient = useCurrentUser();
  if (isLoading) return <PageLoading />;

  const fieldSettings = settings?.fields;
  const editableGroups = DETAIL_GROUPS.map(group => ({
    group,
    fields: getEditableFields(group, fieldSettings),
  })).filter(({ fields }) => fields.length > 0);
  const fixedFields = DETAIL_GROUPS.flatMap(group =>
    getShownFields(group, fieldSettings).filter(field => !field.input && hasDetail(field, patient)),
  );

  return (
    <EditDetailsForm
      editableGroups={editableGroups}
      fixedFields={fixedFields}
      fieldSettings={fieldSettings ?? {}}
    />
  );
};

const EditDetailsForm = ({
  editableGroups,
  fixedFields,
  fieldSettings,
}: {
  editableGroups: { group: DetailGroup; fields: DetailField[] }[];
  fixedFields: DetailField[];
  fieldSettings: Record<string, { required?: boolean }>;
}) => {
  const patient = useCurrentUser();
  const navigate = useNavigate();
  const { getTranslation } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  // The form keeps the details it opened with, even if the field settings refresh meanwhile
  const [groups] = useState(editableGroups);
  const [fields] = useState(() => groups.flatMap(({ fields }) => fields));
  const [initialValues] = useState(() => toFormValues(fields, patient));
  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const updateDetails = useUpdatePatientDetails();

  const changedNames = fields
    .map(({ name }) => name)
    .filter(name => values[name].trim() !== initialValues[name].trim());
  const { blocker, allowLeaving } = useUnsavedChangesGuard(changedNames.length > 0);

  const formatMessages: Record<string, string> = {
    email: getTranslation('patientPortal.details.invalidEmail', 'Enter a valid email address'),
    phone: getTranslation(
      'patientPortal.details.invalidPhone',
      'Enter a phone number using digits, spaces, +, - or brackets',
    ),
  };

  /**
   * Every required detail must be filled in, but only the details the patient changed are
   * checked for format, so a value staff recorded differently doesn't stop them saving the rest.
   */
  const validate = () => {
    const shape = UpdatePatientDetailsRequestSchema.shape as Record<string, any>;
    const nextErrors: Record<string, string> = {};
    for (const { name, input } of fields) {
      const value = values[name].trim();
      if (!value && fieldSettings[name]?.required) {
        nextErrors[name] = getTranslation('patientPortal.details.required', 'Required');
      } else if (changedNames.includes(name) && !shape[name]?.safeParse(value).success) {
        nextErrors[name] =
          formatMessages[input?.kind ?? ''] ??
          getTranslation('patientPortal.details.invalid', 'Check this detail');
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      // Once the errors have rendered, take the patient to the first of them
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }
    if (changedNames.length === 0) {
      navigate(DETAILS_PATH);
      return;
    }
    const changes = Object.fromEntries(changedNames.map(name => [name, values[name].trim()]));
    updateDetails.mutate(changes, {
      onSuccess: () => {
        allowLeaving();
        notifySuccess(getTranslation('patientPortal.details.saved', 'Details saved'), {
          autoClose: 3000,
        });
        navigate(DETAILS_PATH);
      },
    });
  };

  return (
    <>
      <PageColumn as="form" id="edit-details" ref={formRef} onSubmit={handleSubmit} noValidate>
        <BackLink to={DETAILS_PATH}>
          <TranslatedText stringId="patientPortal.home" fallback="Home" />
        </BackLink>
        <PageTitle>
          <TranslatedText stringId="patientPortal.details.editTitle" fallback="Edit your details" />
        </PageTitle>
        {fixedFields.length > 0 && (
          <Panel>
            <FixedDetails>
              <DetailList fields={fixedFields} />
            </FixedDetails>
            <Note>
              <TranslatedText
                stringId="patientPortal.details.fixedNote"
                fallback="To change these, talk to your clinic."
              />
            </Note>
          </Panel>
        )}
        {groups.map(({ group, fields: groupFields }) => (
          <EditGroup key={group.key} aria-labelledby={`edit-${group.key}`}>
            <SectionTitle id={`edit-${group.key}`}>{group.title}</SectionTitle>
            <Fields>
              {groupFields.map(field => (
                <DetailInputField
                  key={field.name}
                  field={field}
                  value={values[field.name]}
                  onChange={value => setValues(previous => ({ ...previous, [field.name]: value }))}
                  required={Boolean(fieldSettings[field.name]?.required)}
                  error={errors[field.name]}
                />
              ))}
            </Fields>
          </EditGroup>
        ))}
      </PageColumn>
      <ActionBar>
        {updateDetails.isError && (
          <SaveError role="alert">
            <TranslatedText
              stringId="patientPortal.details.saveError"
              fallback="Your details couldn't be saved. Please try again."
            />
          </SaveError>
        )}
        <ActionBarContent>
          <FormSecondaryButton onClick={() => navigate(DETAILS_PATH)}>
            <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
          </FormSecondaryButton>
          <FormPrimaryButton type="submit" form="edit-details" disabled={updateDetails.isPending}>
            <TranslatedText stringId="general.action.save" fallback="Save" />
          </FormPrimaryButton>
        </ActionBarContent>
      </ActionBar>
      {blocker.state === 'blocked' && (
        <DiscardChangesDialog onKeepEditing={blocker.reset} onDiscard={blocker.proceed} />
      )}
    </>
  );
};
