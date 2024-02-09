import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import QRCode from 'qrcode';
import { toast } from 'react-toastify';
import { Typography } from '@material-ui/core';

import { ModalCancelRow } from './ModalActionRow';

const StyledHeaderText = styled(Typography)`
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  margin: 15px 0 9px 0;
`;

const StyledText = styled(Typography)`
  font-size: 14px;
  line-height: 18px;
  font-weight: 400;

  span {
    font-weight: 500;
  }
`;

const StyledQrContainer = styled.div`
  text-align: center;
  margin-top: 23px;
  margin-bottom: 21px;

  img {
    height: 185px;
    width: 185px;
  }
`;

export const AddReminderQrCodeContainer = ({ patient, handleCloseRemindersModal }) => {
  const [qrCodeURL, setQRCodeURL] = useState('');
  const data = {
    patientContactId: 'ff306f40-5068-49eb-b9f6-93bb4d2539d8',
    contactName: 'Joe Smith',
    patientDisplayId: 'ABC123',
  };

  useEffect(() => {
    generateQRCode(data);
  }, [data]);

  const generateQRCode = async data => {
    try {
      // Convert the object to a JSON string
      const jsonString = JSON.stringify(data);

      // Generate QR code from the JSON string
      const url = await QRCode.toDataURL(jsonString);
      setQRCodeURL(url);
    } catch (error) {
      toast.error(`Error generating QR code: ${error}`);
    }
  };

  const handleSubmitQrCode = () => {
    handleCloseRemindersModal();
  };

  return (
    <>
      <StyledHeaderText className="headerText">Scan QR code below</StyledHeaderText>
      <StyledText>
        Please ask the contact to scan the QR code to register their Telegram account to received
        automated reminder messages for{' '}
        <span>
          {patient.firstName} {patient.lastName}.
        </span>
      </StyledText>
      <StyledText>
        They will receive a confirmation message from Telegram once their account is successfully
        registered.
      </StyledText>
      <StyledQrContainer>{qrCodeURL && <img src={qrCodeURL} alt="QR Code" />}</StyledQrContainer>
      <ModalCancelRow confirmText="Close" confirmColor="primary" onConfirm={handleSubmitQrCode} />
    </>
  );
};
