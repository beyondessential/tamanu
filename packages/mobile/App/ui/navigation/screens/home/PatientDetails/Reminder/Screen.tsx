import React, { useCallback } from 'react';
import { compose } from 'redux';
import { ArrowLeftIcon } from '~/ui/components/Icons';
import { withPatient } from '~/ui/containers/Patient';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { joinNames } from '~/ui/helpers/user';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import {
  FullView,
  StyledSafeAreaView,
  StyledText,
  StyledTouchableOpacity,
  StyledView,
} from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { ContactCard } from './ContactCard';

const contactMockData = [
  {
    contactId: '1',
    contactName: 'Lorem Ipsum',
    relationShip: 'Friend',
    contactMethod: 'Telegram',
  },
  {
    contactId: '2',
    contactName: 'dolor sit',
    relationShip: 'Father',
    contactMethod: 'Telegram',
  },
  {
    contactId: '3',
    contactName: 'consectetur adipisicing',
    relationShip: 'Cousin',
    contactMethod: 'Telegram',
  },
];
const Screen = ({ navigation, selectedPatient }: BaseAppProps) => {
  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <FullView background={theme.colors.WHITE}>
      <StyledSafeAreaView>
        <StyledView paddingTop={20} paddingLeft={15} paddingRight={15} paddingBottom={20}>
          <StyledTouchableOpacity onPress={onNavigateBack}>
            <ArrowLeftIcon
              color={theme.colors.PRIMARY_MAIN}
              size={screenPercentageToDP(4, Orientation.Height)}
            />
          </StyledTouchableOpacity>

          <StyledView paddingTop={15}>
            <StyledText
              color={theme.colors.MAIN_SUPER_DARK}
              fontSize={screenPercentageToDP(3, Orientation.Height)}
              fontWeight={500}
            >
              Reminder contacts
            </StyledText>
          </StyledView>
          <StyledView paddingTop={10}>
            <StyledText
              color={theme.colors.MAIN_SUPER_DARK}
              fontSize={screenPercentageToDP(2, Orientation.Height)}
              fontWeight={400}
            >
              The below contact list is registered to receive reminders for{' '}
              {joinNames(selectedPatient)}.
            </StyledText>
          </StyledView>
          {contactMockData.map(x => (
            <ContactCard key={x.contactId} patientId={selectedPatient.id} {...x} />
          ))}
        </StyledView>
      </StyledSafeAreaView>
    </FullView>
  );
};

export const PatientReminderScreen = compose(withPatient)(Screen);
