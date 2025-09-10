import React, { useState } from 'react';
import styled from 'styled-components';
import { TranslationForm } from './TranslationForm';
import { ImportExportView } from '../components/ImportExportView';
import { useTranslation } from '../../../contexts/Translation';
import {
  Button,
  FormSubmitButton,
  OutlinedButton,
  ButtonRow,
  Modal,
  TranslatedText,
} from '@tamanu/ui-components';
import { makeModalRow } from '../../../components';
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
          data-testid="translatedtext-sv9p"
        />
      }
      open={open}
      onClose={onClose}
      width="md"
      data-testid="modal-d5b2"
    >
      <ContentText data-testid="contenttext-0un8">
        <TranslatedText
          stringId="admin.translation.overwriteOrImportNewRowsModalMessage"
          fallback="Would you like to overwrite existing translations or import new rows only?"
          data-testid="translatedtext-o7zt"
        />
      </ContentText>
      <ModalActionRow data-testid="modalactionrow-5g9s">
        <ButtonActionContainer data-testid="buttonactioncontainer-3mo5">
          <OutlinedButton onClick={onClose} data-testid="outlinedbutton-i3b0">
            <TranslatedText
              stringId="general.action.back"
              fallback="Back"
              data-testid="translatedtext-0tra"
            />
          </OutlinedButton>
          <div>
            <OutlinedButton
              onClick={e => onConfirm(e, { skipExisting: true })}
              data-testid="outlinedbutton-0fwr"
            >
              <TranslatedText
                stringId="admin.translation.importNewRowsOnly"
                fallback="Import new rows only"
                data-testid="translatedtext-kuph"
              />
            </OutlinedButton>
            <StyledConfirmButton onClick={onConfirm} data-testid="styledconfirmbutton-hbgt">
              <TranslatedText
                stringId="admin.translation.overwriteExisting"
                fallback="Overwrite existing translations"
                data-testid="translatedtext-tr79"
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
        data-testid="formsubmitbutton-o28z"
      />
      <PreSubmitModal
        open={preImportModalOpen}
        onClose={() => setPreImportModalOpen(false)}
        onConfirm={onConfirm}
        data-testid="presubmitmodal-aqdg"
      />
    </>
  );
};

const ExportButton = props => {
  return (
    <ExportButtonRow data-testid="exportbuttonrow-agc8">
      <FormSubmitButton {...props} data-testid="formsubmitbutton-glr7" />
      <Field
        name="includeReferenceData"
        label={
          <TranslatedText
            stringId="admin.translation.includeReferenceData"
            fallback="Include reference data"
            data-testid="translatedtext-ngx9"
          />
        }
        component={ReferenceDataSwitchField}
        data-testid="field-lt5z"
      />
    </ExportButtonRow>
  );
};

export const TranslationAdminView = () => {
  const { getTranslation } = useTranslation();

  const editTab = {
    label: (
      <TranslatedText
        stringId="admin.translation.edit"
        fallback="Edit"
        data-testid="translatedtext-4wh9"
      />
    ),
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
      data-testid="importexportview-b1xg"
    />
  );
};
