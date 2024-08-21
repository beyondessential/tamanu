import React, { ReactElement } from 'react';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { Button } from '/components/Button';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

const SubmitSection = ({ onSubmit }: { onSubmit: () => void }): ReactElement => (
  <StyledView
    background={theme.colors.WHITE}
    height={90}
    marginBottom={screenPercentageToDP(4.86, Orientation.Height)}
    marginLeft={20}
    marginRight={20}
  >
    <Button
      width="100%"
      backgroundColor={theme.colors.PRIMARY_MAIN}
      height={50}
      fontSize={screenPercentageToDP(2.28, Orientation.Height)}
      fontWeight={500}
      buttonText={<TranslatedText stringId="general.action.search" fallback="Search" />}
      onPress={onSubmit}
    />
  </StyledView>
);

export default SubmitSection;
