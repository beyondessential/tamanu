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
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { useTranslation } from '~/ui/contexts/TranslationContext';

interface IReminderContactQR extends BaseAppProps {
  route: {
    params: {
      contactId: string;
    };
  };
}

const Screen = ({ navigation, route, selectedPatient }: IReminderContactQR) => {
  const { getTranslation } = useTranslation();

  const patientName = joinNames(selectedPatient);

  const data = {
    patientContactId: route.params.contactId,
    contactName: patientName,
    patientDisplayId: selectedPatient.displayId,
  };

  const onNavigateBack = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.Index);
  }, [navigation]);

  const description = getTranslation(
    'patient.details.reminderContactQr.description',
    'Please ask the contact to scan the QR code using their camera app to register their Telegram account to receive automated reminder messages for :patientName.',
    { patientName },
  );

  return (
    <FullView
      background={theme.colors.WHITE}
      padding={screenPercentageToDP(5.6, Orientation.Width)}
    >
      <StyledView borderRadius={5}>
        <StyledView height={screenPercentageToDP(4, Orientation.Height)}>
          <StyledView position="absolute" right={0}>
            <StyledTouchableOpacity onPress={onNavigateBack}>
              <CrossIcon
                fill={theme.colors.TEXT_SUPER_DARK}
                size={screenPercentageToDP(2.5, Orientation.Height)}
              />
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
      </StyledView>

      <StyledText
        color={theme.colors.TEXT_SUPER_DARK}
        fontSize={screenPercentageToDP(3, Orientation.Height)}
        fontWeight={500}
        marginBottom={35}
      >
        <TranslatedText
          stringId="patient.details.reminderContactQr.title"
          fallback="Scan QR code below"
        />
      </StyledText>
      <StyledText
        fontSize={screenPercentageToDP(2, Orientation.Height)}
        color={theme.colors.TEXT_DARK}
        fontWeight={400}
        marginBottom={10}
      >
        <StyledText>{description.split(`${patientName}.`)[0]}</StyledText>
        <StyledText fontWeight={600}>{patientName}.</StyledText>
      </StyledText>
      <StyledText
        fontSize={screenPercentageToDP(2, Orientation.Height)}
        color={theme.colors.TEXT_DARK}
        fontWeight={400}
        marginBottom={60}
      >
        <TranslatedText
          stringId="patient.details.reminderContactQr.subDescription"
          fallback="They will receive a confirmation message from Telegram once their account is successfully registered."
        />
      </StyledText>
      <StyledView alignSelf="center">
        <QRCode value={JSON.stringify(data)} size={250} color="black" backgroundColor="white" />
      </StyledView>
    </FullView>
  );
};

export const ReminderContactQRScreen = compose(withPatient)(Screen);
