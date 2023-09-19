import React, { useCallback, ReactElement } from 'react';
import {
  FullView,
  StyledView,
  StyledTouchableOpacity,
  RowView,
  StyledText,
  StyledSafeAreaView,
  CenterView,
} from '/styled/common';
import { ArrowLeftIcon } from '/components/Icons';
import { theme } from '/styled/theme';
import { SectionHeader } from '/components/SectionHeader';
import { Formik } from 'formik';
import { TextField } from '/components/TextField/TextField';
import { Checkbox } from '/components/Checkbox';
import { Field } from '/components/Forms/FormField';
import { SubmitButton } from '/components/Forms/SubmitButton';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { ExportDataScreenProps } from '/interfaces/Screens/HomeStack/ExportDataScreenProps';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';

const formInitialValues = {
  email: '',
  dataTypeName: null,
};

export const ExportDataScreen = ({
  navigation,
}: ExportDataScreenProps): ReactElement => {
  const navigationBack = useCallback(() => {
    navigation.goBack();
  }, []);

  const addEmailField = useCallback(() => {
    console.log('add Field');
  }, []);

  const renderForm = useCallback(
    ({ handleSubmit }) => (
      <StyledSafeAreaView flex={1}>
        <StyledView
          paddingTop={screenPercentageToDP(2.43, Orientation.Height)}
          paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}
          paddingRight={screenPercentageToDP(4.86, Orientation.Width)}
        >
          <StyledView
            marginBottom={screenPercentageToDP(1.21, Orientation.Height)}
          >
            <SectionHeader h3>EMAIL ADDRESS</SectionHeader>
          </StyledView>
          <Field name="email" component={TextField} label="Email" />
          <Button
            marginTop={screenPercentageToDP(1.21, Orientation.Height)}
            outline
            borderColor={theme.colors.BOX_OUTLINE}
            onPress={addEmailField}
          >
            <StyledText
              color={theme.colors.TEXT_DARK}
              fontSize={screenPercentageToDP(1.94, Orientation.Height)}
              fontWeight={500}
            >
              Add another Email
            </StyledText>
          </Button>
        </StyledView>
        <StyledView
          flex={1}
          marginTop={screenPercentageToDP(3.64, Orientation.Height)}
          paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}
          paddingRight={screenPercentageToDP(4.86, Orientation.Width)}
        >
          <Field
            component={Checkbox}
            name="dataTypeName"
            text="Data Type name one"
          />
        </StyledView>
        <CenterView
          height={screenPercentageToDP(10.93, Orientation.Height)}
          background={theme.colors.WHITE}
        >
          <SubmitButton
            backgroundColor={theme.colors.PRIMARY_MAIN}
            buttonText="Export"
            width={screenPercentageToDP(90.02, Orientation.Width)}
            onPress={handleSubmit}
          />
        </CenterView>
      </StyledSafeAreaView>
    ),
    [],
  );

  const onSubmitForm = useCallback(values => {
    console.log(values);
  }, []);

  return (
    <ErrorBoundary>
      <FullView>
        <StyledSafeAreaView background={theme.colors.PRIMARY_MAIN}>
          <RowView>
            <StyledTouchableOpacity onPress={navigationBack} padding={20}>
              <ArrowLeftIcon />
            </StyledTouchableOpacity>
            <StyledView
              position="absolute"
              width="100%"
              height="100%"
              alignItems="center"
              justifyContent="center"
              zIndex={-1}
            >
              <StyledText
                fontSize={screenPercentageToDP(1.94, Orientation.Height)}
                color={theme.colors.WHITE}
              >
                Export Data
              </StyledText>
            </StyledView>
          </RowView>
        </StyledSafeAreaView>
        <FullView flex={1} background={theme.colors.BACKGROUND_GREY}>
          <Formik initialValues={formInitialValues} onSubmit={onSubmitForm}>
            {renderForm}
          </Formik>
        </FullView>
        <StyledSafeAreaView background="white" />
      </FullView>
    </ErrorBoundary>
  );
};
