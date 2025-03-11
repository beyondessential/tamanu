import React, { useState } from 'react';
import styled from 'styled-components';
import { TranslationForm } from './TranslationForm';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { ImportExportView } from '../components/ImportExportView';
import { useTranslation } from '../../../contexts/Translation';
import { Button, FormSubmitButton, OutlinedButton } from '../../../components/Button';
import { ButtonRow } from '../../../components/ButtonRow';
import { Modal, makeModalRow } from '../../../components';
import { Field } from '../../../components/Field';
import { ReferenceDataSwitchField } from './ReferenceDataSwitch';

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

const ExportButtonRow = styled.div`
  display: flex;
`;

const PreSubmitModal = ({ open, onClose, onConfirm }) => {
  const ModalActionRow = makeModalRow(ButtonRow, true);
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
          stringId="admin.translation.overwriteOrImportNewRowsModalMessage"
          fallback="Would you like to overwrite existing translations or import new rows only?"
        />
      </ContentText>
      <ModalActionRow>
        <ButtonActionContainer>
          <OutlinedButton onClick={onClose}>
            <TranslatedText stringId="general.action.back" fallback="Back" />
          </OutlinedButton>
          <div>
            <OutlinedButton onClick={e => onConfirm(e, { skipExisting: true })}>
              <TranslatedText
                stringId="admin.translation.importNewRowsOnly"
                fallback="Import new rows only"
              />
            </OutlinedButton>
            <StyledConfirmButton onClick={onConfirm}>
              <TranslatedText
                stringId="admin.translation.overwriteExisting"
                fallback="Overwrite existing translations"
              />
            </StyledConfirmButton>
          </div>
        </ButtonActionContainer>
      </ModalActionRow>
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
      <PreSubmitModal
        open={preImportModalOpen}
        onClose={() => setPreImportModalOpen(false)}
        onConfirm={onConfirm}
      />
    </>
  );
};

const ExportButton = props => {
  return (
    <ExportButtonRow>
      <FormSubmitButton {...props} />
      <Field
        name="includeReferenceData"
        label={
          <TranslatedText
            stringId="admin.translation.includeReferenceData"
            fallback="Include reference data"
          />
        }
        component={ReferenceDataSwitchField}
      />
    </ExportButtonRow>
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
      ExportButton={ExportButton}
    />
  );
};
