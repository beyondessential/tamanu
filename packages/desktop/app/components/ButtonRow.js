import React, { Children } from 'react';
import styled from 'styled-components';

import { Button, OutlinedButton } from './Button';
import { TranslatedText } from './Translation/TranslatedText';

const FlexSpaceBetween = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Row = styled.div`
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  margin-top: 10px;
  width: 100%;

  // ensure the button row takes up the full width if it's used in a grid context
  grid-column: 1 / -1;

  > button,
  > div {
    margin-left: 20px;
  }
`;

export const ButtonRow = React.memo(({ children, ...props }) => (
  <Row items={Children.toArray(children).length || 1} {...props}>
    {children}
  </Row>
));

const ConfirmButton = styled(Button)`
  min-width: 90px;
`;

export const ConfirmCancelRow = React.memo(
  ({
    onCancel,
    onConfirm,
    confirmText = <TranslatedText stringId="general.actions.confirm" fallback="Confirm" />,
    confirmColor = 'primary',
    cancelText = <TranslatedText stringId="general.actions.cancel" fallback="Cancel" />,
    confirmDisabled,
    ...props
  }) => (
    <ButtonRow {...props}>
      {onCancel && <OutlinedButton onClick={onCancel}>{cancelText}</OutlinedButton>}
      {onConfirm && (
        <ConfirmButton color={confirmColor} onClick={onConfirm} disabled={confirmDisabled}>
          {confirmText}
        </ConfirmButton>
      )}
    </ButtonRow>
  ),
);

const GoBackButtonContainer = styled(ButtonRow)`
  align-items: stretch;
  justify-content: flex-start;

  > button,
  > div {
    margin-left: 0px;
  }
`;

export const ConfirmCancelBackRow = ({
  onBack,
  backButtonText = <TranslatedText stringId="general.actions.back" fallback="Back" />,
  ...props
}) => (
  <FlexSpaceBetween>
    {onBack && (
      <GoBackButtonContainer>
        <OutlinedButton onClick={onBack}>{backButtonText}</OutlinedButton>
      </GoBackButtonContainer>
    )}
    <ConfirmCancelRow {...props} />
  </FlexSpaceBetween>
);
