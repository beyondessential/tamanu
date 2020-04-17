import React, { ReactElement } from 'react';
import { FullView } from '/styled/common';
import { ProgramsForm } from '/components/Forms/ProgramsForm';
import { ScreenProps } from '../../../../../interfaces/screens/ProgramsStack/ProgramAddDetails/ScreenProps';

export const Screen = ({
  onSubmitForm,
  scrollTo,
  ...props
}: ScreenProps): ReactElement => {
  return (
    <FullView>
      <ProgramsForm
        {...props}
        scrollToField={scrollTo}
        onSubmit={onSubmitForm}
      />
    </FullView>
  );
};
