import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';
import * as yup from 'yup';

import { FORM_TYPES } from '@tamanu/constants/forms';
import {
  Button,
  Field,
  Form,
  OutlinedButton,
  ReadOnlyTextField,
  TextField,
  TranslatedText,
} from '@tamanu/ui-components';
import { FormModal } from '../../../../components';
import { notifySuccess } from '../../../../utils';
import { useProgramMutation, useProgramQuery } from './queries';

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

const metadataValidationSchema = yup.object().shape({
  name: yup.string().trim().required('Required'),
});

function EditProgramMetadataModal({ onClose, open }) {
  const { programId } = useParams();
  const { data: program } = useProgramQuery(programId, { enabled: open });

  const { mutateAsync: mutateProgram } = useProgramMutation(programId, {
    onSuccess: () => {
      onClose();
      notifySuccess(
        <TranslatedText
          stringId="admin.programs.metadataUpdateSuccess"
          fallback="Program updated"
        />,
      );
    },
  });

  const initialValues = useMemo(() => ({ name: program?.name ?? '' }), [program?.name]);

  return (
    <FormModal
      onClose={onClose}
      open={open}
      title={
        <TranslatedText stringId="admin.programs.editMetadata" fallback="Edit program metadata" />
      }
    >
      <Form
        enableReinitialize
        formType={FORM_TYPES.EDIT_FORM}
        initialValues={initialValues}
        onSubmit={async values => {
          if (!programId) return;
          await mutateProgram({ name: values.name });
        }}
        render={({ submitForm, isSubmitting }) => (
          <>
            <Fieldset disabled={isSubmitting}>
              <ReadOnlyTextField
                // Not to be confused with `program.code`
                field={{ name: 'programCode', value: program?.programCode ?? '' }}
                label="programCode"
                required
              />
              <Field name="name" component={TextField} label="programName" />
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

export function EditProgramButton({ disabled: disabledProp, ...rest }) {
  const { programId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button {...rest} disabled={disabledProp || !programId} onClick={() => setIsModalOpen(true)}>
        <TranslatedText stringId="admin.programs.editMetadata" fallback="Edit program metadata" />
      </Button>
      <EditProgramMetadataModal onClose={() => setIsModalOpen(false)} open={isModalOpen} />
    </>
  );
}
