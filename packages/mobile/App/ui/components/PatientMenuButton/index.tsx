import React from 'react';
import { TouchableHighlight, StyleSheet } from 'react-native';
import { theme } from '/styled/theme';
import { StyledView, StyledText } from '/styled/common';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { MenuOptionButtonProps } from '~types/MenuOptionButtonProps';

const styles = StyleSheet.create({
  buttonContainer: {
    elevation: 1,
  },
  textContainer: {
    // Vertically centers itself in available space
    marginTop: 'auto',
    marginBottom: 'auto',
  },
});

export const PatientMenuButton = ({ title, Icon, onPress }: MenuOptionButtonProps): JSX.Element => (
  <TouchableHighlight underlayColor={theme.colors.BOX_OUTLINE} onPress={onPress}>
    <StyledView
      style={styles.buttonContainer}
      paddingTop={screenPercentageToDP(3, Orientation.Height)}
      height={screenPercentageToDP(16.5, Orientation.Height)}
      width={screenPercentageToDP(29, Orientation.Width)}
      borderRadius={5}
      background={theme.colors.WHITE}
      alignItems="center"
      boxShadow="0px 0px 5px rgba(0,0,0,0.1)"
    >
      <Icon
        height={screenPercentageToDP('5.9', Orientation.Height)}
        width={screenPercentageToDP('5.9', Orientation.Height)}
      />
      <StyledView style={styles.textContainer}>
        <StyledText
          textAlign="center"
          color={theme.colors.PRIMARY_MAIN}
          fontWeight="500"
          fontSize={screenPercentageToDP('2.2', Orientation.Height)}
        >
          {title}
        </StyledText>
      </StyledView>
    </StyledView>
  </TouchableHighlight>
);
