import React, { Children } from 'react';
import styled from 'styled-components';

import { Button, FormCancelButton, FormSubmitButton, OutlinedButton } from './Button';
import { TranslatedText } from './Translation/TranslatedText';

const FlexSpaceBetween = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Row = styled.div`
  display: flex;
  align-items: stretch;
  justify-content: ${p => (p.alignment === 'left' ? 'flex-start' : 'flex-end')};
  margin-top: 10px;
  width: 100%;

  // ensure the button row takes up the full width if it's used in a grid context
  grid-column: 1 / -1;

  > button:not(:first-child),
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

export const FormSubmitCancelRow = React.memo(
  ({
    onCancel,
    onConfirm,
    confirmText = <TranslatedText stringId="general.action.confirm" fallback="Confirm" />,
    confirmColor = 'primary',
    cancelText = <TranslatedText stringId="general.action.cancel" fallback="Cancel" />,
    confirmDisabled,
    confirmStyle,
    CustomConfirmButton,
    ...props
  }) => (
    <ButtonRow {...props}>
      {onCancel && <FormCancelButton onClick={onCancel}>{cancelText}</FormCancelButton>}
      {CustomConfirmButton ? (
        <CustomConfirmButton onClick={onConfirm} disabled={confirmDisabled} />
      ) : (
        <FormSubmitButton
          color={confirmColor}
          onSubmit={onConfirm}
          disabled={confirmDisabled}
          {...(confirmStyle && { confirmStyle })}
        >
          {confirmText}
        </FormSubmitButton>
      )}
    </ButtonRow>
  ),
);

export const ConfirmCancelRow = React.memo(
  ({
    onCancel,
    onConfirm,
    confirmText = <TranslatedText stringId="general.action.confirm" fallback="Confirm" />,
    confirmColor = 'primary',
    cancelText = <TranslatedText stringId="general.action.cancel" fallback="Cancel" />,
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

const GoBackButtonContainer = styled(ButtonRow)`
  align-items: stretch;
  justify-content: flex-start;

  > button,
  > div {
    margin-left: 0px;
  }
`;

export const FormConfirmCancelBackRow = ({
  onBack,
  backButtonText = <TranslatedText stringId="general.action.back" fallback="Back" />,
  ...props
}) => (
  <FlexSpaceBetween>
    {onBack && (
      <GoBackButtonContainer>
        <OutlinedButton onClick={onBack}>{backButtonText}</OutlinedButton>
      </GoBackButtonContainer>
    )}
    <FormSubmitCancelRow {...props} />
  </FlexSpaceBetween>
);

export const ConfirmCancelBackRow = ({
  onBack,
  backButtonText = <TranslatedText stringId="general.action.back" fallback="Back" />,
  backDisabled = false,
  ...props
}) => (
  <FlexSpaceBetween>
    {onBack && (
      <GoBackButtonContainer>
        <OutlinedButton onClick={onBack} disabled={backDisabled}>
          {backButtonText}
        </OutlinedButton>
      </GoBackButtonContainer>
    )}
    <ConfirmCancelRow {...props} />
  </FlexSpaceBetween>
);
