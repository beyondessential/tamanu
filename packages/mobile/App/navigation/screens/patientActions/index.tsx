import React, { useCallback } from 'react';
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
import { ChatIcon } from '/components/Icons/Chat';
import { PhoneIcon } from '/components/Icons/Phone';
import { EmailIcon } from '/components/Icons/Email';
import { Cross } from '/components/Icons';
import { NavigationProp } from '@react-navigation/native';
import { StatusBar } from 'react-native';

interface PatientActionsScreenProps {
  navigation: NavigationProp<any>;
}

export const PatientActionsScreen = React.memo(
  ({ navigation }: PatientActionsScreenProps) => {
    const goBack = useCallback(() => {
      navigation.goBack();
    }, []);
    return (
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
              <Cross size={20} />
            </StyledTouchableOpacity>
          </RowView>

          <StyledView
            flex={1}
            justifyContent="flex-end"
            paddingLeft={70}
            paddingRight={70}
            paddingBottom={50}
          >
            <Button
              outline
              borderColor={theme.colors.WHITE}
              onPress={() => console.log('message')}
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
              onPress={() => console.log('call')}
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
              onPress={() => console.log('Email')}
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
    );
  },
);
