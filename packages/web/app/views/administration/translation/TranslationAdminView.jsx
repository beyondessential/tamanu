import React, { useState } from 'react';
import { TranslationForm } from './TranslationForm';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { ImportExportView } from '../components/ImportExportView';
import { useTranslation } from '../../../contexts/Translation';
import { Button, FormSubmitButton, OutlinedButton } from '../../../components/Button';
import { Modal, ModalButtonActionRow } from '../../../components';
import styled from 'styled-components';

const TRANSLATED_STRING_REFDATA_TYPE = 'translatedString';

const ContentText = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const ButtonActionContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const StyledConfirmButton = styled(Button)`
  margin-left: 16px;
`;

const ConfirmPaidModal = ({ open, onClose, onConfirm }) => {
  return (
    <Modal
      title={
        <TranslatedText
          stringId="admin.translation.importOrOverwriteModalTitle"
          fallback="Overwrite existing translations"
        />
      }
      open={open}
      onClose={onClose}
      width="md"
    >
      <ContentText>
        <TranslatedText
          stringId="admin.translation.importOrOverwriteModalMessage"
          fallback="Would you like to import new defaults or overwrite existing translations?"
        />
      </ContentText>
      <ModalButtonActionRow>
        <ButtonActionContainer>
          <OutlinedButton onClick={onClose}>
            <TranslatedText stringId="general.action.back" fallback="Back" />
          </OutlinedButton>
          <div>
            <OutlinedButton onClick={onConfirm}>
              <TranslatedText
                stringId="admin.translation.importNewDefaults"
                fallback="Import new defaults"
              />
            </OutlinedButton>
            <StyledConfirmButton onClick={e => onConfirm(e, { overwrite: true })}>
              <TranslatedText
                stringId="admin.translation.overwriteExisting"
                fallback="Overwrite existing translations"
              />
            </StyledConfirmButton>
          </div>
        </ButtonActionContainer>
      </ModalButtonActionRow>
    </Modal>
  );
};

const ImportButton = ({ onSubmit, ...props }) => {
  const [preImportModalOpen, setPreImportModalOpen] = useState(false);
  const onConfirm = (e, extraValues) => {
    setPreImportModalOpen(false);
    onSubmit(e, extraValues);
  };
  return (
    <>
      <FormSubmitButton
        {...props}
        onSubmit={() => {
          setPreImportModalOpen(true);
        }}
        type="button"
      />
      <ConfirmPaidModal
        open={preImportModalOpen}
        onClose={() => setPreImportModalOpen(false)}
        onConfirm={onConfirm}
      />
    </>
  );
};

export const TranslationAdminView = () => {
  const { getTranslation } = useTranslation();

  const editTab = {
    label: <TranslatedText stringId="admin.translation.edit" fallback="Edit" />,
    key: 'edit',
    icon: 'fa fa-edit',
    render: TranslationForm,
  };

  return (
    <ImportExportView
      title={getTranslation('admin.translation.title', 'Translation')}
      endpoint="referenceData"
      dataTypes={[TRANSLATED_STRING_REFDATA_TYPE]}
      buildTabs={(importTab, exportTab) => [editTab, importTab, exportTab]}
      defaultTab="edit"
      ImportButton={ImportButton}
    />
  );
};
