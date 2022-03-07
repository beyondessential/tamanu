import React, { useCallback, ReactElement } from 'react';
import { StyledView, StyledText, StyledSafeAreaView } from '/styled/common';
import { theme } from '/styled/theme';

import { Button } from '../Button';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

type ModalInfoProps = {
  isVisible: boolean;
  message: string;
  buttonPrompt?: string;
  buttonUrl?: string;
  onVisibilityChange: (value: boolean) => void;
  screenPosition?: string | number;
};

export const ModalInfo = ({
  isVisible,
  message,
  buttonPrompt,
  onFollowPrompt,
  onVisibilityChange,
  screenPosition,
}: ModalInfoProps): ReactElement | null => {
  const dismissModal = useCallback(() => {
    onVisibilityChange(false);
  }, []);

  if (!isVisible) return null;

  const action = (buttonPrompt && onFollowPrompt) ? (
      <React.Fragment>
        <Button
          backgroundColor="green"
          onPress={onFollowPrompt}
          textColor={theme.colors.TEXT_LIGHT}
          buttonText={buttonPrompt}
          marginTop={5}
        />
        <Button
          backgroundColor="transparent"
          onPress={dismissModal}
          textColor={theme.colors.TEXT_DARK}
          buttonText="Dismiss"
        />
      </React.Fragment>
    ) : (
      <Button
        backgroundColor="transparent"
        onPress={dismissModal}
        textColor={theme.colors.TEXT_DARK}
        buttonText="OK"
      />
    );

  return (
    <StyledSafeAreaView
      position="absolute"
      zIndex={3}
      background="rgba(0,0,0,0.2)"
      height="100%"
      width="100%"
      alignItems="center"
    >
      <StyledView
        position="absolute"
        top={screenPosition}
        background={theme.colors.WHITE}
        width={screenPercentageToDP(60, Orientation.Width)}
        paddingTop={screenPercentageToDP(2.43, Orientation.Height)}
        paddingRight={screenPercentageToDP(4.86, Orientation.Width)}
        paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}
        borderRadius={5}
      >
        <StyledText
          fontSize={screenPercentageToDP(1.57, Orientation.Height)}
          textAlign="center"
        >
          {message}
        </StyledText>
        { action }
      </StyledView>
    </StyledSafeAreaView>
  );
};

ModalInfo.defaultProps = {
  screenPosition: '50%',
};
