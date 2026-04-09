import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import { CURRENTLY_AT_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { FORM_TYPES } from '@tamanu/constants/forms';
import {
  Button,
  Field,
  Form,
  OutlinedButton,
  ReadOnlyTextField,
  SelectField,
  TextField,
  TranslatedText,
} from '@tamanu/ui-components';
import * as yup from 'yup';
import { FormModal } from '../../../../components';
import { notifySuccess } from '../../../../utils';
import { useProgramRegistryMutation, useProgramRegistryQuery } from './queries';

const Fieldset = styled.fieldset`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 0.8rem;
`;

const Footer = styled.footer`
  border-block-start: 1px solid ${props => props.theme.palette.divider};
  display: flex;
  flex-direction: row-reverse;
  gap: 16px;
  justify-content: flex-start;
  margin-block-start: 24px;
  padding-block-start: 20px;
`;

const visibilityStatusSelectOptions = /** @type {const} */ ([
  { value: VISIBILITY_STATUSES.CURRENT, label: VISIBILITY_STATUSES.CURRENT },
  { value: VISIBILITY_STATUSES.HISTORICAL, label: VISIBILITY_STATUSES.HISTORICAL },
]);

const currentlyAtTypeSelectOptions = Object.values(CURRENTLY_AT_TYPES).map(value => ({
  value,
  label: value,
}));

const metadataValidationSchema = yup.object().shape({
  name: yup.string().trim().required('Required'),
  visibilityStatus: yup
    .string()
    .required('Required')
    .oneOf([VISIBILITY_STATUSES.CURRENT, VISIBILITY_STATUSES.HISTORICAL]),
  currentlyAtType: yup.string().required('Required'),
});

function EditProgramRegistryModal({ onClose, open }) {
  const { programRegistryId } = useParams();
  const { data: registry } = useProgramRegistryQuery(programRegistryId);

  const { mutateAsync: mutateProgramRegistry } = useProgramRegistryMutation({
    onSuccess: () => {
      onClose();
      notifySuccess(
        <TranslatedText
          stringId="admin.programRegistries.metadataUpdateSuccess"
          fallback="Program registry updated"
        />,
      );
    },
  });

  const initialValues = useMemo(
    () => ({
      code: registry?.code ?? '',
      name: registry?.name ?? '',
      visibilityStatus: registry?.visibilityStatus ?? '',
      currentlyAtType: registry?.currentlyAtType ?? '',
    }),
    [registry],
  );

  return (
    <FormModal
      onClose={onClose}
      open={open}
      title={
        <TranslatedText
          stringId="admin.programRegistries.editMetadata"
          fallback="Edit program registry metadata"
        />
      }
    >
      {open && registry /* redundant `registry` check for type inference */ && (
        <Form
          enableReinitialize
          formType={FORM_TYPES.EDIT_FORM}
          initialValues={initialValues}
          onSubmit={async values => {
            if (!programRegistryId) return;
            await mutateProgramRegistry({
              programRegistryId,
              name: values.name,
              visibilityStatus: values.visibilityStatus,
              currentlyAtType: values.currentlyAtType,
            });
          }}
          render={({ submitForm, isSubmitting }) => (
            <>
              <Fieldset>
                <Field name="code" component={ReadOnlyTextField} label="code" />
                <Field name="name" component={TextField} disabled={isSubmitting} label="name" />
                <Field
                  name="visibilityStatus"
                  component={SelectField}
                  disabled={isSubmitting}
                  isClearable={false}
                  label="visibilityStatus"
                  options={visibilityStatusSelectOptions}
                />
                <Field
                  name="currentlyAtType"
                  component={SelectField}
                  disabled={isSubmitting}
                  isClearable={false}
                  label="currentlyAtType"
                  options={currentlyAtTypeSelectOptions}
                />
              </Fieldset>
              <Footer>
                <Button isSubmitting={isSubmitting} onClick={submitForm} type="submit">
                  <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
                </Button>
                <OutlinedButton disabled={isSubmitting} onClick={onClose} type="button">
                  <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                </OutlinedButton>
              </Footer>
            </>
          )}
          validationSchema={metadataValidationSchema}
        />
      )}
    </FormModal>
  );
}

export function EditProgramRegistryMetadataButton(props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Button {...props} onClick={() => setIsModalOpen(true)} style={{ marginInlineStart: 'auto' }}>
      <TranslatedText
        stringId="admin.programRegistries.editMetadata"
        fallback="Edit program registry metadata"
      />
      <EditProgramRegistryModal onClose={() => setIsModalOpen(false)} open={isModalOpen} />
    </Button>
  );
}
