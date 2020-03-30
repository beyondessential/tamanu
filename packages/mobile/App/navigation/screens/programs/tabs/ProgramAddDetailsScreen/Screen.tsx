import React, { ReactElement } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { FullView } from '/styled/common';
import { Formik } from 'formik';
import { Button } from '/components/Button';
import { theme } from '/styled/theme';
import { VerticalPosition, AddDetailsFormFieldsProps } from './Container';
import * as Yup from 'yup';
import { ProgramModel } from '/models/Program';

interface ScreenProps {
  formValidationSchema: Yup.ObjectSchema;
  initialValues: { [key: string]: any };
  containerScrollView: any;
  verticalPositions: VerticalPosition[];
  program: ProgramModel;
  scrollTo: (position: { x: number; y: number }) => void;
  FormFields: (props: AddDetailsFormFieldsProps) => ReactElement;
}

export const Screen = ({
  formValidationSchema,
  initialValues,
  containerScrollView,
  verticalPositions,
  scrollTo,
  program,
  FormFields,
}: ScreenProps): ReactElement => {
  return (
    <FullView>
      <Formik
        validationSchema={formValidationSchema}
        initialValues={initialValues}
        onSubmit={(values): void => console.log(values)}
      >
        {({ handleSubmit }): ReactElement => (
          <FullView paddingLeft={20} paddingRight={20} paddingBottom={40}>
            <KeyboardAvoidingView
              behavior="padding"
              style={{ flex: 1 }}
              contentContainerStyle={{
                flexGrow: 1,
                paddingBottom: 150,
              }}
            >
              <ScrollView
                style={{
                  paddingBottom: 150,
                }}
                ref={containerScrollView}
                showsVerticalScrollIndicator={false}
                scrollToOverflowEnabled
                overScrollMode="always"
              >
                <FormFields
                  program={program}
                  verticalPositions={verticalPositions}
                  scrollTo={scrollTo}
                />
                <Button
                  marginTop={10}
                  backgroundColor={theme.colors.PRIMARY_MAIN}
                  buttonText="Submit"
                  onPress={handleSubmit}
                />
              </ScrollView>
            </KeyboardAvoidingView>
          </FullView>
        )}
      </Formik>
    </FullView>
  );
};
