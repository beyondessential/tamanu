import React, { useState } from 'react';
import styled from 'styled-components';
import { Navigate, useNavigate, useParams } from 'react-router';
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
import { BackLink, Loading, PageColumn, PageTitle, Panel } from '@components/layout';
import { DiscardChangesDialog } from '@components/DiscardChangesDialog';
import { useUnsavedChangesGuard } from '@components/useUnsavedChangesGuard';
import { useCurrentUser } from '@routes/PrivateRoute';
import {
  DETAIL_GROUPS,
  type DetailField,
  getEditableFields,
} from '../../features/details/detailFields';
import { DetailInputField } from '../../features/details/DetailInputField';

const Note = styled.p`
  margin: -8px 0 16px;
  color: var(--pf-text-secondary);
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

/** One group of the patient's details, edited on its own screen. */
export const EditPatientDetailsView = () => {
  const { group: groupKey } = useParams();
  const group = DETAIL_GROUPS.find(({ key }) => key === groupKey);
  const { data: settings, isLoading } = usePortalSettingsQuery();

  if (!group) return <Navigate to="/details" replace />;
  if (isLoading) return <Loading />;
  const fields = getEditableFields(group, settings?.fields);
  if (fields.length === 0) return <Navigate to="/details" replace />;

  return (
    <EditDetailsForm
      key={group.key}
      groupKey={group.key}
      title={group.title}
      note={group.editNote}
      editableFields={fields}
      fieldSettings={settings?.fields ?? {}}
    />
  );
};

const EditDetailsForm = ({
  groupKey,
  title,
  note,
  editableFields,
  fieldSettings,
}: {
  groupKey: string;
  title: React.ReactNode;
  note?: React.ReactNode;
  editableFields: DetailField[];
  fieldSettings: Record<string, { required?: boolean }>;
}) => {
  const patient = useCurrentUser();
  const navigate = useNavigate();
  const { getTranslation } = useTranslation();
  // The form keeps the details it opened with, even if the field settings refresh meanwhile
  const [fields] = useState(editableFields);
  const [initialValues] = useState(() => toFormValues(fields, patient));
  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const updateDetails = useUpdatePatientDetails();
  const detailsPath = `/details#${groupKey}`;

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
    if (!validate()) return;
    if (changedNames.length === 0) {
      navigate(detailsPath);
      return;
    }
    const changes = Object.fromEntries(changedNames.map(name => [name, values[name].trim()]));
    updateDetails.mutate(changes, {
      onSuccess: () => {
        allowLeaving();
        notifySuccess(getTranslation('patientPortal.details.saved', 'Details saved'), {
          autoClose: 3000,
        });
        navigate(detailsPath);
      },
    });
  };

  return (
    <>
      <PageColumn as="form" id="edit-details" onSubmit={handleSubmit} noValidate>
        <BackLink to={detailsPath}>
          <TranslatedText stringId="patientPortal.details.title" fallback="Your details" />
        </BackLink>
        <PageTitle>{title}</PageTitle>
        {note && <Note>{note}</Note>}
        <Fields>
          {fields.map(field => (
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
        {updateDetails.isError && (
          <FormErrorMessage role="alert">
            <TranslatedText
              stringId="patientPortal.details.saveError"
              fallback="Your details couldn't be saved. Please try again."
            />
          </FormErrorMessage>
        )}
      </PageColumn>
      <ActionBar>
        <ActionBarContent>
          <FormSecondaryButton onClick={() => navigate(detailsPath)}>
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
