import React, { ReactElement } from 'react';
import { FullView, StyledText } from '~/ui/styled/common';
import { ProgramsForm } from '~/ui/components/Forms/ProgramsForm';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { ScreenProps } from '~/ui/interfaces/screens/ProgramsStack/ProgramAddDetails/ScreenProps';
import { useCancelableEffect } from '~/ui/hooks';

export const Screen = ({
  survey,
  onSubmitForm,
  ...props
}: ScreenProps): ReactElement => {
  const [components, error] = useCancelableEffect(() => survey.getComponents());

  if (error) {
    return <ErrorScreen error={error} />;
  }

  if (!components) {
    return <LoadingScreen />;
  }

  return (
    <FullView>
      <ProgramsForm
        {...props}
        components={components}
        onSubmit={onSubmitForm}
      />
    </FullView>
  );
};
