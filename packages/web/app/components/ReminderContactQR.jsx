import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import QRCode from 'qrcode';
import { toast } from 'react-toastify';
import { Typography } from '@material-ui/core';

import { ModalCancelRow } from './ModalActionRow';
import { TranslatedText } from './Translation/TranslatedText';
import { joinNames } from '../utils/user';
import { useTranslation } from '../contexts/Translation';

const StyledHeaderText = styled(Typography)`
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  margin-top: 15px;
`;

const StyledText = styled(Typography)`
  font-size: 14px;
  line-height: 18px;
  font-weight: 400;
  margin-top: 10px;

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

export const ReminderContactQR = ({ contact, onClose }) => {
  const { getTranslation } = useTranslation();
  const patient = useSelector(state => state.patient);

  const [qrCodeURL, setQRCodeURL] = useState('');

  const data = {
    id: contact?.id,
  };

  useEffect(() => {
    generateQRCode(data);
  }, []);

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

  const patientName = joinNames(patient);

  const description = getTranslation(
    'patient.details.reminderContactQr.description',
    'Please ask the contact to scan the QR code using their camera app to register their Telegram account to receive automated reminder messages for :patientName.',
    { patientName },
  );

  return (
    <>
      <StyledHeaderText>
        <TranslatedText
          stringId="patient.details.reminderContactQr.title"
          fallback="Scan QR code below"
        />
      </StyledHeaderText>
      <StyledText>
        {description.split(`${patientName}.`)[0]}
        <span>{patientName}.</span>
      </StyledText>
      <StyledText>
        <TranslatedText
          stringId="patient.details.reminderContactQr.subDescription"
          fallback="They will receive a confirmation message from Telegram once their account is successfully registered."
        />
      </StyledText>
      <StyledQrContainer>{qrCodeURL && <img src={qrCodeURL} alt="QR Code" />}</StyledQrContainer>
      <ModalCancelRow
        confirmText={<TranslatedText stringId="general.action.close" fallback="Close" />}
        confirmColor="primary"
        onConfirm={onClose}
      />
    </>
  );
};
