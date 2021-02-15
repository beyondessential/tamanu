import React, { ReactElement, useCallback } from 'react';
import * as Yup from 'yup';

import { FullView, StyledText } from '~/ui/styled/common';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { useCancelableEffect, useBackend } from '~/ui/hooks';
import { VerticalPosition } from '~/ui/interfaces/VerticalPosition';
import { IProgram } from '~/types';
import { SurveyForm } from '~/ui/components/Forms/SurveyForm';

export interface SurveyScreenProps {
  onSubmitForm: (values: any) => void;
  containerScrollView: any;
  scrollTo: (position: { x: number; y: number }) => void;
  verticalPositions?: VerticalPosition;
  formValidationSchema?: Yup.ObjectSchema;
  program?: IProgram;
  initialValues?: { [key: string]: any };
  survey?: any;
  patient?: any;
}

export const SurveyScreen = ({
  survey,
  onSubmitForm,
  ...props
}: ScreenProps): ReactElement => {
  const [components, error] = useCancelableEffect(() => survey.getComponents());

  const onSubmit = useCallback(
    (values) => onSubmitForm(values, components), 
    [onSubmitForm, components]
  );

  if (error) {
    return <ErrorScreen error={error} />;
  }

  if (!components) {
    return <LoadingScreen />;
  }

  return (
    <FullView>
      <SurveyForm
        {...props}
        components={components}
        onSubmit={onSubmit}
      />
    </FullView>
  );
};
