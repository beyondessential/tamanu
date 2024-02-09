import React, { useState } from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';

import { BaseModal } from './BaseModal';
import { Field, SelectField } from './Field';
import { ModalBackCancelConfirmRow } from './ModalActionRow';
import { AddReminderQrCodeModal } from './AddReminderQrCodeModal';

const StyledHeaderText = styled(Typography)`
  margin: 7px 0 9px 0;
  font-size: 14px;
  line-height: 18px;
  font-weight: 500;
`;

const StyledText = styled(Typography)`
  margin: 0;
  font-size: 14px;
  line-height: 18px;

  span {
    font-weight: 500;
  }
`;

const StyledFooterText = styled(Typography)`
  font-size: 14px;
  line-height: 18px;
  margin-bottom: 31px;
  font-weight: 500;
`;

const StyledFormContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 20px;
  margin-bottom: 38px;

  > div {
    flex: 1;
  }
`;

export const AddReminderContactModal = ({
  openAddReminderContactModal,
  handleCloseAddReminder,
  handleBackAddReminder,
  patient = {},
}) => {
  const [openReminderQrCodeModal, setOpenReminderQrCodeModal] = useState(false);

  const handleOpenCloseQrCodeModal = value => {
    setOpenReminderQrCodeModal(value);
  };

  const handleConfirmConnect = () => {
    setOpenReminderQrCodeModal(true);
    handleCloseAddReminder();
  };

  return (
    <>
      <BaseModal
        width="md"
        title="Add reminder contact"
        open={openAddReminderContactModal}
        onClose={handleCloseAddReminder}
      >
        <StyledHeaderText>Please provide details below to add a new contact.</StyledHeaderText>
        <StyledText>
          By providing their details, the individual consents to receiving automated reminder
          messages for{' '}
          <span>
            {patient.firstName} {patient.lastName}
          </span>
        </StyledText>

        <StyledFormContainer>
          <Field name={'Contact name'} label="Contact name" required={true} />

          <Field
            name={'Relationship'}
            label="Relationship"
            component={SelectField}
            options={[
              {
                label: 'site',
                value: 'site',
              },
            ]}
            required={true}
          />
        </StyledFormContainer>

        <StyledFooterText>Connect using the QR code on the following screen.</StyledFooterText>
        <ModalBackCancelConfirmRow
          onBack={handleBackAddReminder}
          confirmText="Confirm & connect"
          confirmColor="primary"
          onConfirm={handleConfirmConnect}
          onCancel={handleCloseAddReminder}
        />
      </BaseModal>
      <AddReminderQrCodeModal
        openReminderQrCodeModal={openReminderQrCodeModal}
        patient={patient}
        handleOpenCloseQrCodeModal={handleOpenCloseQrCodeModal}
      />
    </>
  );
};
