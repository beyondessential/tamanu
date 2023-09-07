import React, { FC } from 'react';
import { TouchableHighlight } from 'react-native';
import { StyledText, RowView, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { ArrowForwardIcon } from '../Icons';
import { MenuOptionButtonProps } from '~/types/MenuOptionButtonProps';

export const MenuOptionButton: FC<MenuOptionButtonProps> = ({
  Icon,
  title,
  onPress,
  fontWeight = 500,
  textProps,
  arrowForwardIconProps,
}: MenuOptionButtonProps): React.ReactElement => (
  <TouchableHighlight underlayColor={theme.colors.DEFAULT_OFF} onPress={onPress}>
    <RowView
      width="100%"
      height={screenPercentageToDP('6.29', Orientation.Height)}
      paddingLeft={screenPercentageToDP('4.86', Orientation.Width)}
      alignItems="center"
    >
      {Icon && (
        <StyledView paddingRight={screenPercentageToDP(4.86, Orientation.Width)}>
          <Icon
            size={screenPercentageToDP(2.43, Orientation.Height)}
            fill={theme.colors.TEXT_SOFT}
          />
        </StyledView>
      )}
      <RowView flex={1}>
        <StyledText
          fontWeight={fontWeight}
          color={theme.colors.TEXT_SUPER_DARK}
          fontSize={screenPercentageToDP('1.94', Orientation.Height)}
          {...textProps}
        >
          {title}
        </StyledText>
      </RowView>
      <StyledView marginRight={screenPercentageToDP('4.86', Orientation.Width)}>
        <ArrowForwardIcon
          fill={theme.colors.TEXT_SOFT}
          height={screenPercentageToDP('1.5', Orientation.Height)}
          width={screenPercentageToDP('1.5', Orientation.Height)}
          {...arrowForwardIconProps}
        />
      </StyledView>
    </RowView>
  </TouchableHighlight>
);
