import React, { FunctionComponent } from 'react';
import { SvgProps } from 'react-native-svg';
import { NavigationProp } from 'react-navigation';
import {
  StyledSafeAreaView,
  StyledText,
  StyledView,
} from '../../styled/common';
import { screenPercentageToDp, Orientation } from '../../helpers/screen';
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
        marginTop={screenPercentageToDp('11.05', Orientation.Height)}
        fontSize={21}
        fontWeight="bold"
        color={theme.colors.WHITE}
      >
        Welcome,
        {user.name}!
      </StyledText>
      <StyledView marginTop={screenPercentageToDp('11.17', Orientation.Height)}>
        <Icon />
      </StyledView>
      <StyledText
        marginTop={screenPercentageToDp('7.29', Orientation.Height)}
        color={theme.colors.WHITE}
        fontWeight="bold"
        fontSize={18}
      >
        {title}
      </StyledText>
      <StyledText
        marginLeft={screenPercentageToDp('12.16', Orientation.Width)}
        marginRight={screenPercentageToDp('12.16', Orientation.Width)}
        textAlign="center"
        marginTop={screenPercentageToDp('1.21', Orientation.Height)}
        color={theme.colors.WHITE}
      >
        {message}
      </StyledText>
    </StyledSafeAreaView>
  );
};
