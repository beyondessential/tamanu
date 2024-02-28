import React, { useCallback, useState } from 'react';
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
import { ContactCard, ContactInfo } from './ContactCard';
import { RemoveContactModal } from './RemoveContactModal';
import { Button } from '~/ui/components/Button';
import { ScrollView } from 'react-native-gesture-handler';
import { Routes } from '~/ui/helpers/routes';

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
  const [selectedContact, setSelectedContact] = useState();
  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onNavigateAddReminder = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.AddReminder);
  }, [navigation]);

  return (
    <FullView background={theme.colors.WHITE}>
      <ScrollView>
        <StyledSafeAreaView>
          <StyledView paddingTop={20} paddingLeft={15} paddingRight={15} paddingBottom={20}>
            <StyledTouchableOpacity onPress={onNavigateBack}>
              <ArrowLeftIcon
                fill={theme.colors.PRIMARY_MAIN}
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
                {contactMockData.length > 0 ? (
                  <>
                    The below contact list is registered to receive reminders for{' '}
                    {joinNames(selectedPatient)}.
                  </>
                ) : (
                  <>
                    There are no contacts registered to receive reminders for{' '}
                    {joinNames(selectedPatient)}. Please select 'Add contact' to register a contact.
                  </>
                )}
              </StyledText>
            </StyledView>
            {contactMockData.map(x => (
              <ContactCard key={x.contactId} setSelectedContact={setSelectedContact} {...x} />
            ))}
            <Button
              onPress={onNavigateAddReminder}
              backgroundColor={theme.colors.WHITE}
              borderColor={theme.colors.PRIMARY_MAIN}
              borderWidth={1}
              marginTop={10}
              width={screenPercentageToDP(35, Orientation.Width)}
            >
              <StyledText color={theme.colors.PRIMARY_MAIN} fontSize={16} fontWeight={600}>
                + Add contact
              </StyledText>
            </Button>
            {selectedContact && (
              <RemoveContactModal
                open={!!selectedContact}
                onClose={() => setSelectedContact(undefined)}
                {...(selectedContact as Object)}
              >
                <ContactInfo {...(selectedContact as Object)} />
              </RemoveContactModal>
            )}
          </StyledView>
        </StyledSafeAreaView>
      </ScrollView>
    </FullView>
  );
};

export const PatientReminderScreen = compose(withPatient)(Screen);
