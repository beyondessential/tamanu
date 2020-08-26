import React, { ReactElement } from 'react';
import { FullView, StyledText } from '/styled/common';
import { ProgramsForm } from '/components/Forms/ProgramsForm';
import { ScreenProps } from '/interfaces/screens/ProgramsStack/ProgramAddDetails/ScreenProps';

import { useCancelableEffect } from '~/ui/helpers/hooks';

export const Screen = ({
  survey,
  onSubmitForm,
  scrollTo,
  ...props
}: ScreenProps): ReactElement => {

  const [components, error] = useCancelableEffect(() => survey.getComponents());

  if(error) {
    return <FullView>
      <StyledText>Error</StyledText>
      <StyledText>{ error.message }</StyledText>
      <StyledText>{ JSON.stringify(error, null, 2) }</StyledText>
    </FullView>
  }

  if(!components) {
    return <StyledText>loading components</StyledText>;
  }

  return (
    <FullView>
      <ProgramsForm
        {...props}
        components={components}
        scrollToField={scrollTo}
        onSubmit={onSubmitForm}
      />
    </FullView>
  );
};
