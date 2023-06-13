import React from 'react';
import * as yup from 'yup';
import { Modal } from './Modal';
import { ConfirmCancelRow } from './ButtonRow';
import { SelectField, Form, Field, TextField } from './Field';
import { FormGrid } from './FormGrid';
import { FormSeparatorLine } from './FormSeparatorLine';
import { formatShortest, formatTime } from './DateDisplay';

export const EditVitalCellModal = ({ cell, onConfirm, onClose }) => {
  const vitalLabel = cell?.vitalLabel;
  const date = formatShortest(cell?.recordedDate);
  const time = formatTime(cell?.recordedDate);
  const title = `${vitalLabel} | ${date} | ${time}`;
  return (
    <Modal width="sm" title={title} onClose={onClose} open={cell !== null}>
      <Form
        onSubmit={onConfirm}
        validationSchema={yup.object().shape({
          reasonForCancellation: yup.string().required('Reason for cancellation is mandatory'),
        })}
        initialValues={{ value: cell?.value }}
        render={({
          // value: formValue,
          submitForm,
        }) => (
          <FormGrid columns={4}>
            <Field component={TextField} label={vitalLabel} name="value" />
            <Field
              required
              component={SelectField}
              label="Reason for change to record"
              name="reasonForChange"
              // options={options}
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
            <ConfirmCancelRow onCancel={onClose} onConfirm={submitForm} confirmText="Save" />
          </FormGrid>
        )}
      />
    </Modal>
  );
};
