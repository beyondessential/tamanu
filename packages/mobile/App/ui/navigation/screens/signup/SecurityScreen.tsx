import React, { ReactElement } from 'react';

import { StyledSafeAreaView, StyledText } from '../../../styled/common';
import { theme } from '../../../styled/theme';
import { Orientation, screenPercentageToDP } from '../../../helpers/screen';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

export const SecurityScreen = ({ isLoading }: { isLoading: boolean }): ReactElement => {
  return (
    <StyledSafeAreaView flex={1} background={theme.colors.PRIMARY_MAIN} alignItems="center">
      <StyledText
        marginTop={screenPercentageToDP('7.29', Orientation.Height)}
        color={theme.colors.WHITE}
        fontWeight="bold"
        fontSize={screenPercentageToDP('2.18', Orientation.Height)}
      >
        <TranslatedText
          stringId="general.device.security.title"
          fallback="Security check"
        />
      </StyledText>
      <StyledText
        marginLeft={screenPercentageToDP('12.16', Orientation.Width)}
        marginRight={screenPercentageToDP('12.16', Orientation.Width)}
        textAlign="center"
        marginTop={screenPercentageToDP('1.21', Orientation.Height)}
        color={theme.colors.WHITE}
        fontSize={screenPercentageToDP(1.94, Orientation.Height)}
      >
        {isLoading
          ? <TranslatedText
            stringId="general.device.security.loading"
            fallback="Loading..."
          />
          : <TranslatedText
            stringId="general.device.security.message"
            fallback="This device does not comply with the security requirements of the tamanu system. Please contact your administrator."
          />
        }
      </StyledText>
    </StyledSafeAreaView>
  );
};
