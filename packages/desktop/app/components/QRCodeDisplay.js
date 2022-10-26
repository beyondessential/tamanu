import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import QRCode from 'qrcode';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { Box, Checkbox, Collapse, FormControlLabel, Typography } from '@material-ui/core';
import { Colors } from '../constants';

// TODO make all this configurable
const TEMP_TEST_BOT_NAME = 'tamanu_prototype_bot';
const TEMP_TEST_CHAT_APP_NAME = 'Telegram';

const QRCodeImage = styled.img`
  width: 200px;
  height: 200px;
`;

const StyledFormControlLabel = styled(FormControlLabel)`
  .MuiTypography-root {
    margin-left: 8px;
    font-size: 14px;
    color: ${Colors.midText};
  }
`;

const SmallText = styled(Typography)`
  font-size: 14px;
  color: ${Colors.midText};
`;

const SlightlySmallerText = styled(Typography)`
  margin-top: 10px;
  font-size: 13px;
  color: ${Colors.midText};
`;

export const QRCodeDisplay = ({
  patientId,
  registrationId,
  botName = TEMP_TEST_BOT_NAME,
  chatAppName = TEMP_TEST_CHAT_APP_NAME,
}) => {
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQRData] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await QRCode.toDataURL(`https://t.me/${botName}?start=${patientId}`);
      setQRData(data);
    })();
  }, [patientId, botName]);

  const handleToggleQRVisible = () => setShowQR(!showQR);

  return (
    <Box>
      {registrationId ? (
        <Box display="flex">
          <CheckCircleIcon style={{ fill: '#47CA80' }} />
          <Box ml={1}>
            <Typography variant="body2">
              This patient is registered to receive reminder notifications for future vaccinations
              (via Telegram)
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box>
          <StyledFormControlLabel
            label={`Register this patient for reminder notifications. via ${chatAppName} messaging service.`}
            control={
              <Checkbox
                color="primary"
                name="registerReminder"
                value={showQR}
                onChange={handleToggleQRVisible}
              />
            }
          />
          <Collapse in={showQR} timeout="auto" unmountOnExit>
            <Box display="flex" justifyContent="center" mb={2} mt={2}>
              <QRCodeImage src={qrData} />
            </Box>
            <SmallText>
              Please ask the patient (or their Parent/Guardian) to scan this QR Code to register for
              reminder notifications via the {chatAppName} messaging app (requires {chatAppName} on
              their phone).
            </SmallText>
            <SlightlySmallerText>
              Scanning this QR Code gives Tamanu consent to send notifications about vaccination
              reminders to this patient’s mobile device.
            </SlightlySmallerText>
          </Collapse>
        </Box>
      )}
    </Box>
  );
};
