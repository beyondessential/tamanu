import React, { FunctionComponent } from 'react';
import { TouchableHighlight, StyleSheet } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { theme } from '/styled/theme';
import { StyledView, StyledText } from '/styled/common';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

interface PatientMenuButton {
  title: string;
  Icon: FunctionComponent<SvgProps>;
  onPress: () => void;
}

const styles = StyleSheet.create({
  buttonContainer: {
    elevation: 1,
  },
});

export const PatientMenuButton = ({
  title,
  Icon,
  onPress,
}: PatientMenuButton): Element => (
  <TouchableHighlight
    underlayColor={theme.colors.BOX_OUTLINE}
    onPress={onPress}
  >
    <StyledView
      style={styles.buttonContainer}
      paddingTop={screenPercentageToDP('2.77', Orientation.Height)}
      height={screenPercentageToDP(15.5, Orientation.Height)}
      width={screenPercentageToDP(29.68, Orientation.Width)}
      borderRadius={3}
      background={theme.colors.WHITE}
      alignItems="center"
      boxShadow="0px 0px 5px rgba(0,0,0,0.1)"
    >
      <Icon
        height={screenPercentageToDP('5.83', Orientation.Height)}
        width={screenPercentageToDP('5.83', Orientation.Height)}
      />
      <StyledView marginTop={screenPercentageToDP('0.82', Orientation.Height)}>
        <StyledText
          textAlign="center"
          color={theme.colors.PRIMARY_MAIN}
          fontSize={screenPercentageToDP('1.94', Orientation.Height)}
        >
          {title}
        </StyledText>
      </StyledView>
    </StyledView>
  </TouchableHighlight>
);
