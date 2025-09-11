import React, { Children } from 'react';
import styled from 'styled-components';

import { Button, FormCancelButton, FormSubmitButton, OutlinedButton } from './Button';
import { TranslatedText } from '../Translation';

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
  <Row items={Children.toArray(children).length || 1} {...props} data-testid="row-atzb">
    {children}
  </Row>
));

export const FormSubmitCancelRow = React.memo(
  ({
    onCancel,
    onConfirm,
    confirmText = (
      <TranslatedText
        stringId="general.action.confirm"
        fallback="Confirm"
        data-testid="translatedtext-ev3v"
      />
    ),
    confirmColor = 'primary',
    cancelText = (
      <TranslatedText
        stringId="general.action.cancel"
        fallback="Cancel"
        data-testid="translatedtext-bptd"
      />
    ),
    confirmDisabled,
    confirmStyle,
    CustomConfirmButton,
    'data-testid': testId = 'formsubmitcancelrow',
    ...props
  }) => (
    <ButtonRow {...props}>
      {onCancel && (
        <FormCancelButton onClick={onCancel} data-testid={`${testId}-cancelButton`}>
          {cancelText}
        </FormCancelButton>
      )}
      {CustomConfirmButton ? (
        <CustomConfirmButton
          onClick={onConfirm}
          disabled={confirmDisabled}
          data-testid={`${testId}-confirmButton`}
        />
      ) : (
        <FormSubmitButton
          color={confirmColor}
          onSubmit={onConfirm}
          disabled={confirmDisabled}
          {...(confirmStyle && { confirmStyle })}
          data-testid={`${testId}-confirmButton`}
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
    confirmText = (
      <TranslatedText
        stringId="general.action.confirm"
        fallback="Confirm"
        data-testid="translatedtext-soz8"
      />
    ),
    confirmColor = 'primary',
    cancelText = (
      <TranslatedText
        stringId="general.action.cancel"
        fallback="Cancel"
        data-testid="translatedtext-ve03"
      />
    ),
    confirmDisabled,
    ...props
  }) => (
    <ButtonRow {...props} data-testid="buttonrow-lft2">
      {onCancel && (
        <OutlinedButton onClick={onCancel} data-testid="outlinedbutton-95wy">
          {cancelText}
        </OutlinedButton>
      )}
      <ConfirmButton
        color={confirmColor}
        onClick={onConfirm}
        disabled={confirmDisabled}
        data-testid="confirmbutton-tok1"
      >
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
  backButtonText = (
    <TranslatedText
      stringId="general.action.back"
      fallback="Back"
      data-testid="translatedtext-ypnp"
    />
  ),
  ...props
}) => (
  <FlexSpaceBetween data-testid="flexspacebetween-p9lh">
    {onBack && (
      <GoBackButtonContainer data-testid="gobackbuttoncontainer-pfqw">
        <OutlinedButton onClick={onBack} data-testid="outlinedbutton-fa5a">
          {backButtonText}
        </OutlinedButton>
      </GoBackButtonContainer>
    )}
    <FormSubmitCancelRow {...props} data-testid="formsubmitcancelrow-il44" />
  </FlexSpaceBetween>
);

export const ConfirmCancelBackRow = ({
  onBack,
  backButtonText = (
    <TranslatedText
      stringId="general.action.back"
      fallback="Back"
      data-testid="translatedtext-yfq9"
    />
  ),
  backDisabled = false,
  onFinalise,
  finaliseText,
  finaliseDisabled = false,
  ...props
}) => (
  <FlexSpaceBetween data-testid="flexspacebetween-f194">
    {onBack && (
      <GoBackButtonContainer data-testid="gobackbuttoncontainer-79x5">
        <OutlinedButton onClick={onBack} disabled={backDisabled} data-testid="outlinedbutton-1xr6">
          {backButtonText}
        </OutlinedButton>
        {onFinalise && (
          <OutlinedButton onClick={onFinalise} disabled={finaliseDisabled}>
            {finaliseText}
          </OutlinedButton>
        )}
      </GoBackButtonContainer>
    )}
    <ConfirmCancelRow {...props} data-testid="confirmcancelrow-lked" />
  </FlexSpaceBetween>
);
