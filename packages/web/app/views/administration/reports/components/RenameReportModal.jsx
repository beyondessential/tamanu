import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import EditIcon from '@mui/icons-material/Edit';
import { IconButton } from '@material-ui/core';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { route } from '@tamanu/api-client';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { Form, FormGrid, TextField } from '@tamanu/ui-components';
import { useApi } from '../../../../api';
import { Field } from '../../../../components';
import { FormModal } from '../../../../components/FormModal';
import { ModalFormActionRow } from '../../../../components/ModalActionRow';
import { TranslatedText } from '../../../../components/Translation/TranslatedText';
import { useTranslation } from '../../../../contexts/Translation';
import { Colors } from '../../../../constants';

const StyledIconButton = styled(IconButton)`
  padding: 0;
  margin-left: 8px;
  vertical-align: text-bottom;
`;

const StyledEditIcon = styled(EditIcon)`
  width: 1rem;
  height: 1rem;
  color: ${Colors.primary};
`;

const validationSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required()
    .translatedLabel(
      <TranslatedText
        stringId="admin.report.reportName.label"
        fallback="Report name"
        data-testid="translatedtext-rename-report-validation"
      />,
    ),
});

// spec: REPORTS
const RenameReportModal = ({ report, open, onClose }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const initialValues = useMemo(() => ({ name: report.name }), [report.name]);

  const handleSubmit = async ({ name }) => {
    try {
      const renamed = await api.patch(route('admin/reports/:reportId', { reportId: report.id }), {
        name: name.trim(),
      });
      await Promise.all([
        queryClient.invalidateQueries(['version']),
        queryClient.invalidateQueries(['reportList']),
      ]);
      toast.success(
        <TranslatedText
          stringId="admin.report.notification.renameReportSuccess"
          fallback="Report renamed to :name"
          replacements={{ name: renamed.name }}
          data-testid="translatedtext-rename-report-success"
        />,
      );
      onClose();
    } catch (err) {
      toast.error(
        <TranslatedText
          stringId="admin.report.notification.renameReportFailed"
          fallback="Failed to rename report: :message"
          replacements={{ message: err.message }}
          data-testid="translatedtext-rename-report-failed"
        />,
      );
    }
  };

  return (
    <FormModal
      title={
        <TranslatedText
          stringId="admin.report.rename.title"
          fallback="Rename report"
          data-testid="translatedtext-rename-report-title"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="formmodal-rename-report"
    >
      <Form
        onSubmit={handleSubmit}
        validationSchema={validationSchema}
        formType={FORM_TYPES.EDIT_FORM}
        initialValues={initialValues}
        enableReinitialize
        render={({ submitForm, dirty }) => (
          <FormGrid columns={1} data-testid="formgrid-rename-report">
            <Field
              name="name"
              component={TextField}
              required
              autoFocus
              autoComplete="off"
              label={
                <TranslatedText
                  stringId="admin.report.reportName.label"
                  fallback="Report name"
                  data-testid="translatedtext-rename-report-name"
                />
              }
              data-testid="field-rename-report-name"
            />
            <ModalFormActionRow
              confirmText={
                <TranslatedText
                  stringId="general.action.save"
                  fallback="Save"
                  data-testid="translatedtext-rename-report-save"
                />
              }
              confirmDisabled={!dirty}
              onConfirm={submitForm}
              onCancel={onClose}
              data-testid="modalformactionrow-rename-report"
            />
          </FormGrid>
        )}
        data-testid="form-rename-report"
      />
    </FormModal>
  );
};

export const RenameReportButton = ({ report }) => {
  const { getTranslation } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <StyledIconButton
        aria-label={getTranslation('admin.report.rename.title', 'Rename report')}
        onClick={() => setIsModalOpen(true)}
        data-testid="iconbutton-rename-report"
      >
        <StyledEditIcon />
      </StyledIconButton>
      <RenameReportModal report={report} open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
