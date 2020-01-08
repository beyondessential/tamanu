import React, { FunctionComponent } from 'react';
import { SvgProps } from 'react-native-svg';
import { NavigationProp } from 'react-navigation';
import {
  StyledSafeAreaView,
  StyledText,
  StyledView,
} from '../../styled/common';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';
import { theme } from '../../styled/theme';

export interface IntroRouteProps {
  user: { name: string };
  message: string;
  Icon: FunctionComponent<SvgProps>;
  title: string;
  routeOutside: string | '';
}

interface IntroProps {
  navigation: NavigationProp<{ params: IntroRouteProps }>;
}

export const Intro = (props: IntroProps) => {
  const { user, message, Icon, title } = props.navigation.state.params;
  return (
    <StyledSafeAreaView
      flex={1}
      background={theme.colors.PRIMARY_MAIN}
      alignItems="center"
    >
      <StyledText
        marginTop={screenPercentageToDP('11.05', Orientation.Height)}
        fontSize={21}
        fontWeight="bold"
        color={theme.colors.WHITE}
      >
        Welcome,{user.name}!
      </StyledText>
      <StyledView marginTop={screenPercentageToDP('11.17', Orientation.Height)}>
        <Icon />
      </StyledView>
      <StyledText
        marginTop={screenPercentageToDP('7.29', Orientation.Height)}
        color={theme.colors.WHITE}
        fontWeight="bold"
        fontSize={18}
      >
        {title}
      </StyledText>
      <StyledText
        marginLeft={screenPercentageToDP('12.16', Orientation.Width)}
        marginRight={screenPercentageToDP('12.16', Orientation.Width)}
        textAlign="center"
        marginTop={screenPercentageToDP('1.21', Orientation.Height)}
        color={theme.colors.WHITE}
      >
        {message}
      </StyledText>
    </StyledSafeAreaView>
  );
};
