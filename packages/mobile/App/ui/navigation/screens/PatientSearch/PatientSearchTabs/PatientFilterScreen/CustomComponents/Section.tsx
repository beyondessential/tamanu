import React, { ReactElement, PropsWithChildren } from 'react';
import { StyledView } from '/styled/common';
import { SectionHeader } from '/components/SectionHeader';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { Separator } from '/components/Separator';

interface Section {
  title: string;
}

export const Section = ({
  title,
  children,
}: PropsWithChildren<Section>): ReactElement => (
  <>
    <StyledView
      paddingTop={20}
      paddingLeft={20}
      paddingRight={20}
      marginBottom={20}
    >
      <SectionHeader
        h1
        marginBottom={screenPercentageToDP(2.43, Orientation.Height)}
      >
        {title}
      </SectionHeader>
      {children}
    </StyledView>
    <Separator />
  </>
);
