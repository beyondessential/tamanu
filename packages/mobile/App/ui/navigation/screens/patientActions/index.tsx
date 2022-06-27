import React, { useCallback, memo, useState } from 'react';
import {
  FullView,
  StyledView,
  StyledTouchableOpacity,
  StyledSafeAreaView,
  RowView,
  StyledText,
} from '/styled/common';
import { theme } from '/styled/theme';
import { Button } from '/components/Button';
import { ChatIcon, PhoneIcon, EmailIcon, CrossIcon } from '/components/Icons';
import { StatusBar, Linking } from 'react-native';
import { PatientActionsScreenProps } from '../../../interfaces/Screens/HomeStack/PatientActionsScreenProps';
import { compose } from 'redux';
import { withPatient } from '/containers/Patient';
import { sendEmail } from '/helpers/email';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';

const Screen = memo(
  ({ navigation, selectedPatient }: PatientActionsScreenProps) => {
    const [error, setError] = useState<string | null>(null);
    const goBack = useCallback(() => {
      navigation.goBack();
    }, []);

    const onCallPatientPhone = useCallback(async () => {
      try {
        const url = `tel:${selectedPatient.telephone}`;
        if (Linking.canOpenURL(url)) {
          await Linking.openURL(url);
        }
      } catch (phoneDialError) {
        setError('Not able to open Phone Dialer, try again later');
        setTimeout(() => {
          setError(null);
        }, 3000);
        console.log(phoneDialError);
      }
    }, []);

    const onSendEmail = useCallback(async () => {
      try {
        sendEmail(selectedPatient.email);
      } catch (emailError) {
        setError('Not able to load or send Email, try again later');
        setTimeout(() => {
          setError(null);
        }, 3000);
        console.log(emailError);
      }
    }, []);

    return (
      <ErrorBoundary>
        <StyledSafeAreaView background={theme.colors.PRIMARY_MAIN} flex={1}>
          <StatusBar barStyle="light-content" />
          <FullView background={theme.colors.PRIMARY_MAIN}>
            <RowView justifyContent="flex-end">
              <StyledTouchableOpacity
                paddingLeft={20}
                paddingRight={20}
                paddingTop={20}
                paddingBottom={20}
                onPress={goBack}
              >
                <CrossIcon height={20} width={20} />
              </StyledTouchableOpacity>
            </RowView>
            <StyledView
              flex={1}
              justifyContent="flex-end"
              paddingLeft={70}
              paddingRight={70}
              paddingBottom={50}
            >
              {error && (
                <StyledText
                  marginBottom={10}
                  textAlign="center"
                  color={theme.colors.WHITE}
                >
                  {error}
                </StyledText>
              )}
              <Button
                outline
                borderColor={theme.colors.WHITE}
                onPress={(): void => console.log('message')}
                marginBottom={5}
              >
                <ChatIcon />
                <StyledText
                  fontWeight="bold"
                  color={theme.colors.WHITE}
                  marginLeft={10}
                >
                  Message
                </StyledText>
              </Button>
              <Button
                outline
                borderColor={theme.colors.WHITE}
                onPress={onCallPatientPhone}
                marginBottom={5}
              >
                <PhoneIcon />
                <StyledText
                  fontWeight="bold"
                  color={theme.colors.WHITE}
                  marginLeft={10}
                >
                  Call
                </StyledText>
              </Button>
              <Button
                outline
                borderColor={theme.colors.WHITE}
                onPress={onSendEmail}
              >
                <EmailIcon />
                <StyledText
                  fontWeight="bold"
                  color={theme.colors.WHITE}
                  marginLeft={10}
                >
                  Email
                </StyledText>
              </Button>
            </StyledView>
          </FullView>
        </StyledSafeAreaView>
      </ErrorBoundary>
    );
  },
);
export const PatientActionsScreen = compose(withPatient)(Screen);
