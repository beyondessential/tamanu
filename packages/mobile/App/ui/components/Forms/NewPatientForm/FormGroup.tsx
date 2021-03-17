import React, { ReactElement, useMemo, ReactNode } from 'react';
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
  marginTop,
}: FormGroupProps): ReactElement => {
  const height = useMemo(() => {
    const count = React.Children.count(children);
    return count > 0
      ? screenPercentageToDP(count * 7.29, Orientation.Height)
      : screenPercentageToDP(7.29, Orientation.Height);
  }, [children]);
  return (
    <StyledView
      marginTop={marginTop ? screenPercentageToDP(2.43, Orientation.Height) : 0}
    >
      <StyledView marginBottom={screenPercentageToDP(0.6, Orientation.Height)}>
        <SectionHeader h3>{sectionName}</SectionHeader>
      </StyledView>
      <StyledView height={height} justifyContent="space-between">
        {children}
      </StyledView>
    </StyledView>
  );
};

FormGroup.defaultProps = {
  marginTop: null,
};
