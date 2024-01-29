import React, { Children } from 'react';
import styled from 'styled-components';

import { Button, FormCancelButton, FormSubmitButton, OutlinedButton } from './Button';

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

const SectionRow = styled.div`
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  margin-top: 10px;
  width: 100%;

  // ensure the button row takes up the full width if it's used in a grid context
  grid-column: 1 / -1;

  div {
    margin-top: 1px;
  }

  > div:not(:first-child) { 
    margin-left: 20px;
  }
`;

const ConfirmButton = styled(Button)`
  min-width: 90px;
`;

export const ButtonRow = React.memo(({ children, ...props }) => (
  <Row items={Children.toArray(children).length || 1} {...props}>
    {children}
  </Row>
));

export const SectionButtonRow = React.memo(({ children, ...props }) => (
  <SectionRow items={Children.toArray(children).length || 1} {...props}>
    {children}
  </SectionRow>
));

export const FormSubmitCancelRow = React.memo(
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
      {onCancel && <FormCancelButton onClick={onCancel}>{cancelText}</FormCancelButton>}
      <FormSubmitButton color={confirmColor} onSubmit={onConfirm} disabled={confirmDisabled}>
        {confirmText}
      </FormSubmitButton>
    </ButtonRow>
  ),
);

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
      <ConfirmButton color={confirmColor} onClick={onConfirm} disabled={confirmDisabled}>
        {confirmText}
      </ConfirmButton>
    </ButtonRow>
  ),
);

export const ConfirmCancelBackRow = React.memo(
  ({
    onCancel,
    onConfirm,
    confirmText = 'Confirm',
    confirmColor = 'primary',
    cancelText = 'Cancel',
    confirmDisabled,
    onBack,
    backButtonText = 'Back',
    ...props
  }) => (
    <SectionButtonRow {...props}>
      {onBack && (
        <GoBackButtonContainer>
          <OutlinedButton onClick={onBack}>{backButtonText}</OutlinedButton>
        </GoBackButtonContainer>
      )}
      <FormSubmitCancelRow confirmText={confirmText} onCancel={onCancel} />
    </SectionButtonRow>
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

export const FormConfirmCancelBackRow = ({ onBack, backButtonText = 'Back', ...props }) => (
  <FlexSpaceBetween>
    {onBack && (
      <GoBackButtonContainer>
        <OutlinedButton onClick={onBack}>{backButtonText}</OutlinedButton>
      </GoBackButtonContainer>
    )}
    <FormSubmitCancelRow {...props} />
  </FlexSpaceBetween>
);
