import React, { ReactElement, PropsWithChildren } from 'react';

import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { StyledView } from '~/ui/styled/common';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { screenPercentageToDP, Orientation } from '~/ui/helpers/screen';
import { Separator } from '~/ui/components/Separator';

interface Section {
  // either specify a title...
  title?: string;

  // ...or a name, and an optional defaultTitle
  name?: string;
  defaultTitle?: string;
}

export const Section = ({
  title: propTitle,
  defaultTitle,
  name,
  children,
}: PropsWithChildren<Section>): ReactElement => {
  const { getString, getBool } = useLocalisation();

  let title: string;
  if (name) {
    const isHidden = getBool(`fields.${name}.hidden`);
    if (isHidden) {
      return null;
    }
    title = getString(`fields.${name}.longLabel`, defaultTitle);
  } else if (title) {
    title = propTitle;
  }
  return (
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
};
