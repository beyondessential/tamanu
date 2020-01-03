import React, { FunctionComponent } from 'react';
import { TouchableHighlight } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { StyledText, RowView, StyledView } from '../../styled/common';
import { ArrowForward } from '../Icons';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';
import theme from '../../styled/theme';

export interface MenuOptionButton {
  Icon?: FunctionComponent<SvgProps>;
  title: string;
  onPress: () => void;
}

export const MenuOptionButton = ({
  Icon,
  title,
  onPress,
}: MenuOptionButton) => (
  <TouchableHighlight
    underlayColor={theme.colors.DEFAULT_OFF}
    onPress={onPress}
  >
    <RowView
      width="100%"
      paddingTop={screenPercentageToDP('2.43', Orientation.Height)}
      paddingBottom={screenPercentageToDP('2.43', Orientation.Height)}
      paddingLeft={screenPercentageToDP('4.86', Orientation.Width)}
      alignItems="center"
    >
      {Icon && (
        <StyledView
          paddingRight={screenPercentageToDP('4.86', Orientation.Width)}
        >
          <Icon
            height={screenPercentageToDP('3.13', Orientation.Height)}
            width={screenPercentageToDP('3.13', Orientation.Height)}
            fill={theme.colors.TEXT_SOFT}
          />
        </StyledView>
      )}
      <RowView flex={1}>
        <StyledText
          fontWeight={500}
          fontSize={screenPercentageToDP('1.94', Orientation.Height)}
        >
          {title}
        </StyledText>
      </RowView>
      <StyledView marginRight={screenPercentageToDP('4.86', Orientation.Width)}>
        <ArrowForward
          fill={theme.colors.TEXT_SOFT}
          height={screenPercentageToDP('3.13', Orientation.Height)}
          width={screenPercentageToDP('3.13', Orientation.Height)}
        />
      </StyledView>
    </RowView>
  </TouchableHighlight>
);
