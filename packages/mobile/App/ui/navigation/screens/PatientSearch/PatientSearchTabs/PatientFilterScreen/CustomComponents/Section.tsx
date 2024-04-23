import React, { PropsWithChildren, ReactElement } from 'react';

import { useSettings } from '~/ui/contexts/SettingContext';
import { StyledView } from '~/ui/styled/common';
import { SectionHeader } from '~/ui/components/SectionHeader';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { Separator } from '~/ui/components/Separator';

interface ISection {
  // either specify a title...
  title?: string;

  // ...or a path to a localised field
  localisationPath?: string;
}

export const Section = ({
  title: propTitle,
  localisationPath,
  children,
}: PropsWithChildren<ISection>): ReactElement => {
  const { getSetting } = useSettings();

  let title: string;
  if (localisationPath) {
    const isHidden = getSetting<boolean>(`${localisationPath}.hidden`);
    if (isHidden) {
      return null;
    }
    title = getSetting<string>(`${localisationPath}.longLabel`);
  } else if (title) {
    title = propTitle;
  }
  return (
    <>
      <StyledView paddingTop={20} paddingLeft={20} paddingRight={20} marginBottom={20}>
        <SectionHeader h1 marginBottom={screenPercentageToDP(2.43, Orientation.Height)}>
          {title}
        </SectionHeader>
        {children}
      </StyledView>
      <Separator />
    </>
  );
};
