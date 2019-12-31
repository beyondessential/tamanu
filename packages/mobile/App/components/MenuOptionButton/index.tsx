import React, { FunctionComponent } from 'react';
import { TouchableHighlight } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { StyledText, RowView, StyledView } from '../../styled/common';
import { ArrowForward } from '../Icons';
import { screenPercentageToDp, Orientation } from '../../helpers/screen';
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
      paddingTop={screenPercentageToDp('2.43', Orientation.Height)}
      paddingBottom={screenPercentageToDp('2.43', Orientation.Height)}
      paddingLeft={screenPercentageToDp('4.86', Orientation.Width)}
      alignItems="center"
    >
      {Icon && (
        <StyledView
          paddingRight={screenPercentageToDp('4.86', Orientation.Width)}
        >
          <Icon
            height={screenPercentageToDp('3.13', Orientation.Height)}
            width={screenPercentageToDp('3.13', Orientation.Height)}
            fill={theme.colors.TEXT_SOFT}
          />
        </StyledView>
      )}
      <RowView flex={1}>
        <StyledText
          fontWeight={500}
          fontSize={screenPercentageToDp('1.94', Orientation.Height)}
        >
          {title}
        </StyledText>
      </RowView>
      <StyledView marginRight={screenPercentageToDp('4.86', Orientation.Width)}>
        <ArrowForward
          fill={theme.colors.TEXT_SOFT}
          height={screenPercentageToDp('3.13', Orientation.Height)}
          width={screenPercentageToDp('3.13', Orientation.Height)}
        />
      </StyledView>
    </RowView>
  </TouchableHighlight>
);
