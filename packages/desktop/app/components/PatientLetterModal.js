import React, { useState } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { Box } from '@material-ui/core';
import { useQuery } from '@tanstack/react-query'
import { Typography } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';

import { Modal, ModalLoader } from './Modal';
import { PatientLetterForm } from '../forms/PatientLetterForm';
// import { PatientLetterForm } from '../forms/PatientLetterForm';
import { Colors, SEX_VALUE_INDEX } from '../constants';
import { ConfirmCancelRow } from './ButtonRow';
import {
  Button,
  BodyText,
  FormSeparatorLine,
  DateDisplay,
  Table,
  useSelectableColumn,
  OutlinedButton,
} from '../components';

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
      <CardItem label="DOB" value={<DateDisplay date={patient?.dateOfBirth} />}/>
      <CardItem label="Sex" value={SEX_VALUE_INDEX[patient?.sex]?.label} />
    </Column>
  </Card>
);

export const PatientLetterModal = React.memo(({ open, onClose, patient, onSubmit, isSubmitting, isError }) => {
  return (
    <Modal width="sm" title="Patient letter" open={open} onClose={onClose}>
      <PatientDetails patient={patient} />
      <PatientLetterForm onSubmit={onSubmit}/>
    </Modal>
  );
});

PatientLetterModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  isError: PropTypes.bool,
};

PatientLetterModal.defaultProps = {
  open: false,
  isSubmitting: false,
  isError: false,
};
