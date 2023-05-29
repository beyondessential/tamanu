import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { Box } from '@material-ui/core';

import { DOCUMENT_SOURCES } from 'shared/constants';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import { useApi } from '../api';
import { Modal } from './Modal';
import { PatientLetterForm } from '../forms/PatientLetterForm';
import { Colors, SEX_VALUE_INDEX } from '../constants';
import { DateDisplay } from '.';

const Card = styled(Box)`
  background: white;
  border-radius: 5px;
  border: 1px solid ${Colors.outline};
  padding: 20px 10px;
  display: flex;
  align-items: flex-start;
  margin-top: 10px;
`;

const Column = styled.div`
  flex: 1;
  padding-left: 20px;

  :first-of-type {
    border-right: 1px solid ${Colors.outline};
  }
`;

const CardCell = styled.div`
  font-size: 14px;
  line-height: 18px;
  color: ${props => props.theme.palette.text.tertiary};
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const CardLabel = styled.div`
  margin-right: 5px;
`;

const CardValue = styled(CardLabel)`
  font-weight: 500;
  color: ${props => props.theme.palette.text.secondary};
`;

const CardItem = ({ label, value, ...props }) => (
  <CardCell {...props}>
    <CardLabel>{label}</CardLabel>
    <CardValue>{value}</CardValue>
  </CardCell>
);

const PatientDetails = ({ patient }) => (
  <Card mb={4}>
    <Column>
      <CardItem label="Patient ID" value={patient?.displayId} />
      <CardItem label="First name" value={patient?.firstName} />
      <CardItem label="Last name" value={patient?.lastName} />
    </Column>
    <Column>
      <CardItem label="DOB" value={<DateDisplay date={patient?.dateOfBirth} />} />
      <CardItem label="Sex" value={SEX_VALUE_INDEX[patient?.sex]?.label} />
    </Column>
  </Card>
);

export const PatientLetterModal = React.memo(
  ({ open, onClose, endpoint, refreshTable, patient, openDocumentPreview }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const api = useApi();

    const onSubmit = useCallback(
      async ({ printRequested, ...data }) => {
        setIsSubmitting(true);

        const document = await api.post(`${endpoint}/createPatientLetter`, {
          patientLetterData: {
            todo: 'TODO: will pass through in the next PR',
          },
          type: 'application/pdf',
          source: DOCUMENT_SOURCES.PATIENT_LETTER,
          name: data.title,
          clinicianId: data.clinicianId,
          documentCreatedAt: getCurrentDateTimeString(),
          documentUploadedAt: getCurrentDateTimeString(),
        });
        refreshTable();
        setIsSubmitting(false);
        onClose();

        if (printRequested) {
          openDocumentPreview(document);
        }
      },
      [onClose, api, endpoint, refreshTable, openDocumentPreview],
    );

    return (
      <Modal width="sm" title="Patient letter" open={open} onClose={onClose}>
        <PatientDetails patient={patient} />
        <PatientLetterForm onSubmit={onSubmit} onCancel={onClose} />
      </Modal>
    );
  },
);

PatientLetterModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  endpoint: PropTypes.string.isRequired,
  refreshTable: PropTypes.func.isRequired,
  patient: PropTypes.object.isRequired,
  openDocumentPreview: PropTypes.func.isRequired,
};

PatientLetterModal.defaultProps = {
  open: false,
};
