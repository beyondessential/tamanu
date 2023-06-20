import React, { useState, useCallback } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Box, IconButton, Typography } from '@material-ui/core';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import { Modal } from './Modal';
import { ConfirmCancelRow } from './ButtonRow';
import { SelectField, Form, Field, TextField } from './Field';
import { useLocalisation } from '../contexts/Localisation';
import { FormGrid } from './FormGrid';
import { FormSeparatorLine } from './FormSeparatorLine';
import { formatShortest, formatTime } from './DateDisplay';

const Text = styled(Typography)`
  font-size: 14px;
  line-height: 24px;
  font-weight: 500;
  text-decoration: underline;
`;

const DeleteEntryButton = ({ disabled, onClick }) => (
  <Box display="flex" alignSelf="end">
    <IconButton color="primary" edge="start" disabled={disabled} onClick={onClick} disableRipple>
      <DeleteOutlineIcon fontSize="small" />
      <Text>Delete entry</Text>
    </IconButton>
  </Box>
);

export const EditVitalCellModal = ({ cell, onConfirm, onClose }) => {
  const [isDeleted, setIsDeleted] = useState(false);
  const handleDeleteEntry = useCallback(setFieldValue => {
    setFieldValue('value', '');
    setIsDeleted(true);
  }, []);
  const handleClose = useCallback(() => {
    setIsDeleted(false);
    onClose();
  }, [onClose]);
  const { getLocalisation } = useLocalisation();
  const vitalEditReasons = getLocalisation('vitalEditReasons') || [];
  const vitalLabel = cell?.vitalLabel;
  const date = formatShortest(cell?.recordedDate);
  const time = formatTime(cell?.recordedDate);
  const title = `${vitalLabel} | ${date} | ${time}`;
  const initialValue = cell?.value;
  const showDeleteEntryButton = initialValue !== undefined;
  return (
    <Modal width="sm" title={title} onClose={handleClose} open={cell !== null}>
      <Form
        onSubmit={onConfirm}
        validationSchema={yup.object().shape({
          reasonForCancellation: yup.string().required('Reason for cancellation is mandatory'),
        })}
        initialValues={{ value: initialValue }}
        render={({
          // value: formValue,
          setFieldValue,
          submitForm,
        }) => (
          <FormGrid columns={4}>
            <Field component={TextField} label={vitalLabel} name="value" disabled={isDeleted} />
            {showDeleteEntryButton && (
              <DeleteEntryButton
                disabled={isDeleted}
                onClick={() => handleDeleteEntry(setFieldValue)}
              />
            )}
            <Field
              required
              component={SelectField}
              label="Reason for change to record"
              name="reasonForChange"
              options={vitalEditReasons}
              style={{ gridColumn: '1 / 4' }}
            />
            <FormSeparatorLine />
            <Field
              name="history"
              label="History"
              component={TextField}
              multiline
              style={{ gridColumn: '1 / -1' }}
              rows={6}
            />
            <ConfirmCancelRow onCancel={handleClose} onConfirm={submitForm} confirmText="Save" />
          </FormGrid>
        )}
      />
    </Modal>
  );
};
