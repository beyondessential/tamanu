import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { SvgXml } from 'react-native-svg';
import Collapsible from 'react-native-collapsible';
import { Checkbox } from '~/ui/components/Checkbox';
import { StyledText, StyledView } from '~/ui/styled/common';
import { GivenOnTimeIcon } from '../../Icons';
import { theme } from '~/ui/styled/theme';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';

interface Props {
  patientId: string;
  registrationId: string;
  chatAppName?: string;
  botName?: string;
}

// TODO make all this configurable
const TEMP_TEST_BOT_NAME = 'tamanu_prototype_bot';
const TEMP_TEST_CHAT_APP_NAME = 'Telegram';

export const QRCodeDisplay: React.FC<Props> = ({
  patientId,
  registrationId,
  botName = TEMP_TEST_BOT_NAME,
  chatAppName = TEMP_TEST_CHAT_APP_NAME,
}): JSX.Element => {
  const [showQR, setShowQR] = useState<boolean>(false);
  const [qrData, setQrData] = useState<string | null>(null);

  const createPatientQRCode = async (): Promise<void> => {
    const data = await QRCode.toString(`https://t.me/${botName}?start=${patientId}`, { type: 'svg' });
    setQrData(data);
  };

  useEffect(() => {
    createPatientQRCode();
  }, [patientId]);

  return (
    <StyledView paddingTop={10}>
      {registrationId ? (
        <StyledView alignItems="center" flexDirection="row">
          <GivenOnTimeIcon size={screenPercentageToDP(2.8, Orientation.Height)} />
          <StyledText
            marginLeft={10}
            fontSize={screenPercentageToDP('1.70', Orientation.Height)}
            color={theme.colors.TEXT_MID}>
            This patient is registered to receive reminder notifications
            for future vaccinations(via {chatAppName})
          </StyledText>
        </StyledView>
      ) : (
        <StyledView>
          <Checkbox
            id="registerReminder"
            onChange={setShowQR}
            value={showQR}
            // Force newline to avoid issue with checkbox label being cut off
            text={`This patient is NOT registered for reminder notifications\nvia ${chatAppName} messaging service. Register this patient for reminder notifications.`}
          />
          <Collapsible collapsed={!showQR}>
            <StyledView>
              <StyledView paddingTop={15} alignItems="center">
                <SvgXml width={200} height={200} xml={qrData} />
              </StyledView>
              <StyledView>
                <StyledText paddingTop={15} fontSize={screenPercentageToDP('1.70', Orientation.Height)}>
                  Please ask the patient (or their Parent/Guardian) to scan this QR Code to 
                  register for reminder notifications via the {chatAppName} messaging app
                  (requires {chatAppName} on their phone).
                </StyledText>
                <StyledText paddingTop={10} fontSize={screenPercentageToDP('1.50', Orientation.Height)} color="#888888">
                  Scanning this QR Code gives Tamanu consent to send
                  notifications about vaccination reminders to this patient’s mobile device.
                </StyledText>
              </StyledView>
            </StyledView>
          </Collapsible>
        </StyledView>
      )}
    </StyledView>
  );
};
