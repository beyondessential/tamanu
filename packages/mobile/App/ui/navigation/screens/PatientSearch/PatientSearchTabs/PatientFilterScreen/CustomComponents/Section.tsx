import React, { PropsWithChildren, ReactElement } from 'react';

import { SectionHeader } from '~/ui/components/SectionHeader';
import { Separator } from '~/ui/components/Separator';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledView } from '~/ui/styled/common';

interface Section {
  // either specify a title...
  title?: string;

  // ...or a path to a localised field
  localisationPath?: string;
}

export const Section = ({
  title: propTitle,
  localisationPath,
  children,
}: PropsWithChildren<Section>): ReactElement => {
  const { getString, getBool } = useLocalisation();

  let title: string;
  if (localisationPath) {
    const isHidden = getBool(`${localisationPath}.hidden`);
    if (isHidden) {
      return null;
    }
    title = getString(`${localisationPath}.longLabel`);
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
