import React, { ReactElement, ReactNode } from 'react';
import { StyledView } from '/styled/common';
import { SectionHeader } from '../../SectionHeader';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

type FormGroupProps = {
  sectionName: string;
  children: ReactNode;
  marginTop?: boolean;
};

export const FormGroup = ({
  sectionName,
  children,
  marginTop = null,
}: FormGroupProps): ReactElement => (
  <StyledView
    marginTop={marginTop ? screenPercentageToDP(2.43, Orientation.Height) : 0}
  >
    <StyledView marginBottom={screenPercentageToDP(0.6, Orientation.Height)}>
      <SectionHeader h3>{sectionName}</SectionHeader>
    </StyledView>
    <StyledView justifyContent="space-between">
      {React.Children.map(children, child => (
        <StyledView paddingBottom={10}>
          {child}
        </StyledView>
      ))}
    </StyledView>
  </StyledView>
);

