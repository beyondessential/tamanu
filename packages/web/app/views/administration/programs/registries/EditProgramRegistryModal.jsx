import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';
import * as yup from 'yup';

import { CURRENTLY_AT_TYPES } from '@tamanu/constants';
import { FORM_TYPES } from '@tamanu/constants/forms';
import {
  Button,
  Field,
  Form,
  FormGridThatFits,
  OutlinedButton,
  ReadOnlyTextField,
  SelectField,
  TextField,
  TranslatedText,
} from '@tamanu/ui-components';
import { FormModal } from '../../../../components';
import { notifySuccess } from '../../../../utils';
import { VisibilityStatusSelectField, visibilityStatusSelectOptions } from '../components';
import { useProgramRegistryMutation, useProgramRegistryQuery } from './queries';

const Footer = styled.footer`
  border-block-start: 1px solid ${props => props.theme.palette.divider};
  display: flex;
  flex-direction: row-reverse;
  gap: 16px;
  justify-content: flex-start;
  margin-block-start: 24px;
  padding-block-start: 20px;
`;

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
            <FormGridThatFits>
              <Field component={ReadOnlyTextField} label="code" name="code" required />
              <Field
                component={TextField}
                disabled={isSubmitting}
                label="name"
                name="name"
                required
              />
              <VisibilityStatusSelectField
                disabled={isSubmitting}
                label="visibilityStatus"
                name="visibilityStatus"
                required
              />
              <Field
                component={SelectField}
                disabled={isSubmitting}
                isClearable={false}
                label="currentlyAtType"
                name="currentlyAtType"
                options={currentlyAtTypeSelectOptions}
                required
              />
            </FormGridThatFits>
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
