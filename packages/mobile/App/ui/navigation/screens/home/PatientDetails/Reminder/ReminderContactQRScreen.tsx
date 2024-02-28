import React, { useCallback } from 'react';
import QRCode from 'react-native-qrcode-svg';
import { FullView, StyledText, StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { joinNames } from '~/ui/helpers/user';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { theme } from '~/ui/styled/theme';
import { CrossIcon } from '~/ui/components/Icons';
import { compose } from 'redux';
import { withPatient } from '~/ui/containers/Patient';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import { Routes } from '~/ui/helpers/routes';

const Screen = ({ navigation, route, selectedPatient }: BaseAppProps) => {
  const data = {
    patientContactId: route.params.contactId,
    contactName: joinNames(selectedPatient),
    patientDisplayId: selectedPatient.displayId,
  };

  const onNavigateBack = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.Reminder);
  }, [navigation]);

  return (
    <FullView
      background={theme.colors.WHITE}
      padding={screenPercentageToDP(5.6, Orientation.Width)}
    >
      <StyledView
        padding={screenPercentageToDP(3.6, Orientation.Width)}
        paddingBottom={screenPercentageToDP(1.6, Orientation.Height)}
        paddingTop={screenPercentageToDP(2.43, Orientation.Height)}
        borderRadius={5}
      >
        <StyledView height={screenPercentageToDP(4, Orientation.Height)}>
          <StyledView position="absolute" right={0}>
            <StyledTouchableOpacity onPress={onNavigateBack}>
              <CrossIcon
                fill={theme.colors.TEXT_SUPER_DARK}
                size={screenPercentageToDP(1.9, Orientation.Height)}
              />
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
      </StyledView>

      <StyledText
        fontSize={screenPercentageToDP(6, Orientation.Width)}
        color={theme.colors.TEXT_DARK}
        fontWeight={500}
        marginBottom={40}
      >
        Scan QR code below
      </StyledText>
      <StyledText
        fontSize={screenPercentageToDP(3.5, Orientation.Width)}
        color={theme.colors.TEXT_DARK}
        fontWeight={400}
        marginBottom={20}
      >
        Please ask the contact to scan the QR code to register their Telegram account to received
        automated reminder messages for {joinNames(selectedPatient)}.
      </StyledText>
      <StyledText
        fontSize={screenPercentageToDP(3.5, Orientation.Width)}
        color={theme.colors.TEXT_DARK}
        fontWeight={400}
        marginBottom={40}
      >
        They will receive a confirmation message from Telegram once their account is successfully
        registered.
      </StyledText>
      {data && (
        <StyledView alignSelf="center">
          <QRCode value={JSON.stringify(data)} size={250} color="black" backgroundColor="white" />
        </StyledView>
      )}
    </FullView>
  );
};

export const ReminderContactQRScreen = compose(withPatient)(Screen);
