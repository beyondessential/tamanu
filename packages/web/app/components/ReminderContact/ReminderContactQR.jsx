import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import QRCode from 'qrcode';
import { toast } from 'react-toastify';
import { Typography, CircularProgress } from '@material-ui/core';

import { ModalCancelRow } from '../ModalActionRow';
import { TranslatedText } from '../Translation/TranslatedText';
import { joinNames } from '../../utils/user';
import { useTranslation } from '../../contexts/Translation';
import { useTelegramBotInfoQuery } from '../../api/queries';
import { Colors } from '../../constants';

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

const ErrorMessage = styled.div`
  color: ${Colors.alert};
`;

export const ReminderContactQR = ({ contact, onClose }) => {
  const { getTranslation } = useTranslation();
  const patient = useSelector(state => state.patient);
  const { data: botInfo, isFetching, isError, error } = useTelegramBotInfoQuery();

  const [qrCodeURL, setQRCodeURL] = useState('');

  useEffect(() => {
    if (botInfo && botInfo.username) {
      generateQRCode();
    }
  }, [botInfo?.username]);

  const generateQRCode = async () => {
    try {
      const urlString = `https://t.me/${botInfo.username}?start=${contact.id}`;

      // Generate QR code from the URL string
      const url = await QRCode.toDataURL(urlString);
      setQRCodeURL(url);
    } catch (error) {
      toast.error(`Error generating QR code: ${error}`);
    }
  };

  const patientName = joinNames(patient);

  return (
    <>
      <StyledHeaderText>
        <TranslatedText
          stringId="patient.details.reminderContactQr.title"
          fallback="Scan QR code below"
          data-test-id='translatedtext-nkrn' />
      </StyledHeaderText>
      <StyledText
        dangerouslySetInnerHTML={{
          __html: getTranslation(
            'patient.details.reminderContactQr.description',
            'Please ask the contact to scan the QR code using their camera app to register their Telegram account to receive automated reminder messages for :patientName.',
            { replacements: { patientName: `<span>${patientName}</span>` } },
          ),
        }}
      ></StyledText>
      <StyledText>
        <TranslatedText
          stringId="patient.details.reminderContactQr.subDescription"
          fallback="They will receive a confirmation message from Telegram once their account is successfully registered."
          data-test-id='translatedtext-8lce' />
      </StyledText>
      <StyledQrContainer>
        {!isFetching && qrCodeURL && <img src={qrCodeURL} alt="QR Code" />}
        {isFetching && <CircularProgress />}
        {isError && <ErrorMessage>{error.message}</ErrorMessage>}
      </StyledQrContainer>
      <ModalCancelRow
        confirmText={<TranslatedText
          stringId="general.action.close"
          fallback="Close"
          data-test-id='translatedtext-2s8j' />}
        confirmColor="primary"
        onConfirm={onClose}
      />
    </>
  );
};
