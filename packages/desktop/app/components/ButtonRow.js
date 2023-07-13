import React, { Children } from 'react';
import styled from 'styled-components';

import { Button, FormSubmitButton, OutlinedButton } from './Button';

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

export const ConfirmCancelRow = React.memo(
  ({
    onCancel,
    onConfirm,
    confirmText = 'Confirm',
    confirmColor = 'primary',
    cancelText = 'Cancel',
    confirmDisabled,
    ...props
  }) => (
    <ButtonRow {...props}>
      {onCancel && <OutlinedButton onClick={onCancel}>{cancelText}</OutlinedButton>}
      {onConfirm && (
        <FormSubmitButton color={confirmColor} onSubmit={onConfirm} disabled={confirmDisabled}>
          {confirmText}
        </FormSubmitButton>
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

export const ConfirmCancelBackRow = ({ onBack, backButtonText = 'Back', ...props }) => (
  <FlexSpaceBetween>
    {onBack && (
      <GoBackButtonContainer>
        <OutlinedButton onClick={onBack}>{backButtonText}</OutlinedButton>
      </GoBackButtonContainer>
    )}
    <ConfirmCancelRow {...props} />
  </FlexSpaceBetween>
);
