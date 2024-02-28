import React, { ReactElement, useCallback, useState } from 'react';
import * as yup from 'yup';
import { ScrollView } from 'react-native-gesture-handler';
import { compose } from 'redux';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { ArrowLeftIcon } from '~/ui/components/Icons';
import { withPatient } from '~/ui/containers/Patient';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { joinNames } from '~/ui/helpers/user';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import {
  StyledSafeAreaView,
  StyledView,
  StyledTouchableOpacity,
  StyledText,
} from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { Form } from '~/ui/components/Forms/Form';
import { Button } from '~/ui/components/Button';
import { TextField } from '~/ui/components/TextField/TextField';
import { Routes } from '~/ui/helpers/routes';

const Screen = ({ navigation, selectedPatient }: BaseAppProps) => {
  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const submit = async () => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.ReminderContactQR, {
      contactId: undefined,
    });
  };

  return (
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
              Add reminder contacts
            </StyledText>
          </StyledView>
          <StyledView paddingTop={10}>
            <StyledText
              color={theme.colors.MAIN_SUPER_DARK}
              fontSize={screenPercentageToDP(2, Orientation.Height)}
              fontWeight={500}
            >
              Please provide details below to add a new contact.
            </StyledText>
          </StyledView>
          <StyledView paddingTop={10}>
            <StyledText
              color={theme.colors.MAIN_SUPER_DARK}
              fontSize={screenPercentageToDP(2, Orientation.Height)}
              fontWeight={400}
            >
              By providing their details, the individual consents to receiving automated reminder
              messages for {joinNames(selectedPatient)}
            </StyledText>
          </StyledView>
          <Form
            initialValues={{}}
            validationSchema={yup.object().shape({
              contactName: yup.string().required('Contact name is required'),
              relationship: yup.string().required('Relationship is required'),
            })}
            onSubmit={submit}
          >
            {({ handleSubmit }): ReactElement => {
              return (
                <>
                  <StyledView marginTop={20} marginRight={20}>
                    <LocalisedField name="contactName" component={TextField} required />
                  </StyledView>
                  <StyledView marginRight={20}>
                    <LocalisedField name="relationship" component={TextField} required />
                  </StyledView>
                  <Button
                    buttonText="Confirm and connect"
                    backgroundColor={theme.colors.PRIMARY_MAIN}
                    onPress={handleSubmit}
                  />
                  <Button
                    onPress={onNavigateBack}
                    backgroundColor={theme.colors.WHITE}
                    borderColor={theme.colors.PRIMARY_MAIN}
                    borderWidth={1}
                    marginTop={10}
                  >
                    <StyledText color={theme.colors.PRIMARY_MAIN} fontSize={16} fontWeight={600}>
                      Cancel
                    </StyledText>
                  </Button>
                </>
              );
            }}
          </Form>
        </StyledView>
      </StyledSafeAreaView>
    </ScrollView>
  );
};

export const AddPatientReminderScreen = compose(withPatient)(Screen);
