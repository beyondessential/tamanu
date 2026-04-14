import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';
import * as yup from 'yup';

import { CURRENTLY_AT_TYPES, NONPATIENT_VISIBILITY_STATUS_VALUES } from '@tamanu/constants';
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
  TranslatedVisibilityStatus,
} from '@tamanu/ui-components';
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

const visibilityStatusSelectOptions = NONPATIENT_VISIBILITY_STATUS_VALUES.map(value => ({
  value,
  label: <TranslatedVisibilityStatus visibilityStatus={value} />,
}));

const currentlyAtTypeText = /** @type {const} */ {
  [CURRENTLY_AT_TYPES.VILLAGE]: (
    <TranslatedText stringId="general.currentlyAtType.village" fallback="Village" />
  ),
  [CURRENTLY_AT_TYPES.FACILITY]: (
    <TranslatedText stringId="general.currentlyAtType.facility" fallback="Facility" />
  ),
};

const currentlyAtTypeSelectOptions = Object.values(CURRENTLY_AT_TYPES).map(value => ({
  value,
  label: currentlyAtTypeText[value],
}));

const metadataValidationSchema = yup.object().shape({
  name: yup.string().trim().required('Required'),
  visibilityStatus: yup
    .string()
    .required('Required')
    .oneOf(visibilityStatusSelectOptions.map(option => option.value)),
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
              <OutlinedButton disabled={isSubmitting} onClick={onClose}>
                <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
              </OutlinedButton>
            </Footer>
          </>
        )}
        validationSchema={metadataValidationSchema}
      />
    </FormModal>
  );
}

export function EditProgramRegistryButton(props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button {...props} onClick={() => setIsModalOpen(true)}>
        <TranslatedText
          stringId="admin.programRegistries.editMetadata"
          fallback="Edit program registry metadata"
        />
      </Button>
      <EditProgramRegistryModal onClose={() => setIsModalOpen(false)} open={isModalOpen} />
    </>
  );
}
