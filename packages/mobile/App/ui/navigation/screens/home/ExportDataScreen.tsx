import React, { ReactElement, useCallback } from 'react';
import {
  CenterView,
  FullView,
  RowView,
  StyledSafeAreaView,
  StyledText,
  StyledTouchableOpacity,
  StyledView,
} from '/styled/common';
import { ArrowLeftIcon } from '/components/Icons';
import { theme } from '/styled/theme';
import { SectionHeader } from '/components/SectionHeader';
import { Formik } from 'formik';
import { TextField } from '/components/TextField/TextField';
import { Checkbox } from '/components/Checkbox';
import { Field } from '/components/Forms/FormField';
import { SubmitButton } from '/components/Forms/SubmitButton';
import { Button } from '/components/Button';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { ExportDataScreenProps } from '/interfaces/Screens/HomeStack/ExportDataScreenProps';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

const formInitialValues = {
  email: '',
  dataTypeName: null,
};

export const ExportDataScreen = ({ navigation }: ExportDataScreenProps): ReactElement => {
  const navigationBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

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
          <StyledView marginBottom={screenPercentageToDP(1.21, Orientation.Height)}>
            <SectionHeader h3>
              <TranslatedText
                stringId="report.export.form.heading.emailAddress"
                fallback="EMAIL ADDRESS"
                casing="upper"
              />
            </SectionHeader>
          </StyledView>
          <Field
            name="email"
            component={TextField}
            label={<TranslatedText stringId="report.export.form.email.label" fallback="Email" />}
          />
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
              <TranslatedText
                stringId="report.export.action.addAnotherEmail"
                fallback="Add another Email"
              />
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
            text={
              <TranslatedText
                stringId="report.export.form.dataTypeName.label"
                fallback="Data Type name one"
              />
            }
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
    [addEmailField],
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
                <TranslatedText stringId="report.action.exportData" fallback="Export Data" />
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
