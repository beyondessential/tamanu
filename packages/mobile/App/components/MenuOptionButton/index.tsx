import React, { FC } from 'react';
import { TouchableHighlight } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { StyledText, RowView, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { ArrowForward } from '../Icons';

export interface MenuOptionButton {
  Icon?: FC<SvgProps>;
  title: string;
  onPress: () => void;
  fontWeight?: number
}

export const MenuOptionButton: FC<MenuOptionButton> = ({
  Icon,
  title,
  onPress,
  fontWeight = 400,
}: MenuOptionButton): React.ReactElement => (
  <TouchableHighlight
    underlayColor={theme.colors.DEFAULT_OFF}
    onPress={onPress}
  >
    <RowView
      width="100%"
      paddingTop={screenPercentageToDP('1.7', Orientation.Height)}
      paddingBottom={screenPercentageToDP('1.7', Orientation.Height)}
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
          fontWeight={fontWeight}
          color={theme.colors.TEXT_DARK}
          fontSize={screenPercentageToDP('1.94', Orientation.Height)}
        >
          {title}
        </StyledText>
      </RowView>
      <StyledView marginRight={screenPercentageToDP('4.86', Orientation.Width)}>
        <ArrowForward
          fill={theme.colors.TEXT_SOFT}
          size={screenPercentageToDP('1.5', Orientation.Height)}
        />
      </StyledView>
    </RowView>
  </TouchableHighlight>
);
