import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { useFormikContext } from 'formik';
import { Link } from 'react-router';
import { red } from '@material-ui/core/colors';
import {
  Button as MuiButton,
  ButtonBase as MuiButtonBase,
  CircularProgress,
  IconButton,
} from '@material-ui/core';
import { ChevronLeft, Lock } from '@material-ui/icons';
import MuiToggleButton, { toggleButtonClasses } from '@mui/material/ToggleButton';
import { toggleButtonGroupClasses } from '@mui/material/ToggleButtonGroup';

import { TAMANU_COLORS } from '../../constants';
import { withPermissionCheck } from '../withPermissionCheck';
import { withPermissionTooltip } from '../withPermissionTooltip';
import { TranslatedText } from '../Translation';
import { useFormButtonSubmitting } from '../useFormButtonSubmitting';

export const ButtonBase = props => {
  delete props.functionallyDisabled;
  const locationsProps = getLocationProps(props);
  return <MuiButtonBase {...props} {...locationsProps} />;
};

const StyledButton = styled(({ ...props }) => {
  delete props.functionallyDisabled;
  delete props.confirmStyle;
  return <MuiButton {...props} />;
})`
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  text-transform: none;
  padding: 11px 18px 12px 18px;
  box-shadow: none;
  min-width: 100px;

  /* Button is already disabled functionally,
  this is only to visually make it more obvious that the button is disabled */
  ${props => (props.functionallyDisabled ? 'pointer-events: none;' : '')}

  .MuiSvgIcon-root {
    width: 19.5px;
    height: auto;
    margin-right: 10px;
  }

  &.MuiButton-sizeSmall {
    padding-left: 14px;
    padding-right: 14px;
  }

  &.MuiButton-outlinedPrimary:not(.Mui-disabled) {
    border-color: ${props => props.theme.palette.primary.main};
  }

  &.MuiButton-containedPrimary.Mui-disabled {
    color: ${TAMANU_COLORS.white};
    box-shadow: none;
    background-color: ${TAMANU_COLORS.primary30};
  }

  &.MuiButton-outlinedPrimary.Mui-disabled {
    color: ${TAMANU_COLORS.primary30};
    border-color: ${TAMANU_COLORS.primary30};
  }

  ${props => props.confirmStyle ?? ''}
`;

const StyledCircularProgress = styled(CircularProgress)`
  margin-right: 5px;
`;

const BaseButton = ({
  children,
  variant = 'contained',
  color = 'primary',
  type = 'button',
  disabled = false,
  isSubmitting = false,
  functionallyDisabled = false, // for disable the function of button, but still keep the visual the same
  hasPermission = true,
  loadingColor = TAMANU_COLORS.white,
  showLoadingIndicator,
  ...props
}) => {
  const locationsProps = getLocationProps(props);
  const displayLock = !isSubmitting && !hasPermission;

  const buttonComponent = functionallyDisabled
    ? forwardRef((buttonProps, ref) => (
        // Workaround to display a disabled button with non-disabled styling. MaterialUI doesn't
        // see the disabled prop so it won't add its own styling, but the underlying button element
        // is still disabled.
        // eslint-disable-next-line react/button-has-type
        <button type={type} {...buttonProps} ref={ref} disabled data-testid="button-0nnt" />
      ))
    : undefined;

  return (
    <StyledButton
      variant={variant}
      color={color}
      type={type}
      disabled={disabled || !hasPermission}
      functionallyDisabled={functionallyDisabled}
      {...props}
      {...locationsProps}
      {...(buttonComponent && { component: buttonComponent })}
    >
      {displayLock && <Lock data-testid="lock-zz2l" />}
      {showLoadingIndicator && (
        <StyledCircularProgress
          color={loadingColor}
          size={25}
          data-testid="styledcircularprogress-4end"
        />
      )}
      {!showLoadingIndicator && children}
    </StyledButton>
  );
};

export const Button = ({ isSubmitting = false, ...props }) => (
  <BaseButton
    isSubmitting={isSubmitting}
    functionallyDisabled={isSubmitting}
    showLoadingIndicator={isSubmitting}
    {...props}
  />
);

const StyledOutlinedButton = styled(StyledButton)`
  border-color: ${props => props.theme.palette.primary.main};
  :disabled {
    border-color: ${TAMANU_COLORS.softText};
  }
`;

export const OutlinedButton = props => (
  <StyledOutlinedButton variant="outlined" color="primary" {...props} />
);

export const GreyOutlinedButton = styled(props => <StyledButton {...props} />)`
  border: 1px solid #dedede;
  color: ${props => props.theme.palette.text.secondary};
`;

export const RedOutlinedButton = styled(props => <StyledButton {...props} />)`
  border: 1px solid ${TAMANU_COLORS.alert};
  color: ${TAMANU_COLORS.alert};
`;

const StyledLargeButton = styled(StyledButton)`
  font-size: 15px;
  line-height: 18px;
  padding: 12px 25px;
  border: 1px solid ${props => props.theme.palette.primary.main};
`;

export const LargeButton = props => (
  <StyledLargeButton variant="contained" color="primary" {...props} />
);

export const LargeOutlineButton = props => (
  <StyledLargeButton variant="outlined" color="primary" {...props} />
);

const StyledDeleteButton = styled(Button)`
  background: ${red[600]};
  color: ${TAMANU_COLORS.white};

  :hover {
    background: ${red[800]};
  }
`;

export const DeleteButton = props => {
  const { children } = props;
  return (
    <StyledDeleteButton variant="contained" {...props}>
      {children || 'Delete'}
    </StyledDeleteButton>
  );
};

const StyledTextButton = styled(Button)`
  color: #5b84ad;
  font-size: 1rem;
  min-block-size: auto;
  min-inline-size: auto;
  padding: 0;
  text-transform: capitalize;
  :hover {
    background: transparent;
    color: #23476b;
    font-weight: 500;
  }
`;

export const TextButton = ({ children, ...props }) => (
  <StyledTextButton variant="text" color="primary" {...props}>
    {children}
  </StyledTextButton>
);

const StyledNavButton = styled(TextButton)`
  color: ${TAMANU_COLORS.primary};
  padding-right: 8px;
  font-size: 12px;
  & svg {
    font-size: 20px;
  }
`;

export const BackButton = ({ to, text = true, ...props }) => (
  <StyledNavButton to={to} {...props}>
    <ChevronLeft />
    {text && (
      <>
        {' '}
        <TranslatedText stringId="general.action.back" fallback="Back" />
      </>
    )}
  </StyledNavButton>
);

export const FormSubmitButton = ({
  children,
  text = 'Confirm',
  color = 'primary',
  onSubmit,
  ...props
}) => {
  const { isSubmitting, showLoadingIndicator } = useFormButtonSubmitting();

  return (
    <Button
      isSubmitting={isSubmitting}
      showLoadingIndicator={showLoadingIndicator}
      color={color}
      onClick={onSubmit}
      functionallyDisabled={isSubmitting}
      type="submit"
      {...props}
    >
      {children || text}
    </Button>
  );
};

export const FormCancelButton = ({ ...props }) => {
  const { isSubmitting } = useFormikContext();

  return (
    <OutlinedButton
      functionallyDisabled={isSubmitting}
      {...props}
      data-testid="outlinedbutton-8rnr"
    />
  );
};

export const StyledPrimarySubmitButton = styled(FormSubmitButton)`
  font-size: 16px;
  line-height: 18px;
  padding-top: 16px;
  padding-bottom: 16px;
`;

const StyledLargeSubmitButton = styled(FormSubmitButton)`
  font-size: 15px;
  line-height: 18px;
  padding: 12px 25px;
  border: 1px solid ${props => props.theme.palette.primary.main};
`;

export const LargeSubmitButton = props => (
  <StyledLargeSubmitButton variant="contained" color="primary" {...props} />
);

export const DefaultIconButton = styled(({ children, ...props }) => (
  <IconButton {...props} data-testid="iconbutton-zsiq">
    {children}
  </IconButton>
))`
  border-radius: 20%;
  padding: 0px;
`;

const getLocationProps = ({ to }) => {
  if (to) {
    return { component: Link, to };
  }
  return {};
};

const ButtonWithPermissionTooltip = withPermissionTooltip(Button);
export const ButtonWithPermissionCheck = withPermissionCheck(ButtonWithPermissionTooltip);

/**
 * To be extended by custom components which need button semantics, but are not visually or
 * conceptually “a button”.
 */
export const UnstyledHtmlButton = styled.button`
  appearance: none;
  background-color: unset;
  border: none;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  font-style: inherit;
  line-height: inherit;
  text-align: inherit;
  text-decoration-thickness: from-font;
  touch-action: manipulation;
`;

/**
 * @privateRemarks It’s a bit of a mission to override MUI’s baked-in styles. When creating a
 * `styled` version of this component, the selector will need specificity higher than (0,5,0) to
 * override the styles declared here.
 */
export const ToggleButton = styled(MuiToggleButton)`
  .${toggleButtonGroupClasses.root}
    &.${toggleButtonClasses.root}.${toggleButtonGroupClasses.grouped}:is(
   .${toggleButtonGroupClasses.firstButton},
   .${toggleButtonGroupClasses.middleButton},
   .${toggleButtonGroupClasses.lastButton}
 ) {
    appearance: none;
    background-color: ${TAMANU_COLORS.white};
    border-color: ${TAMANU_COLORS.softText};
    border-radius: calc(infinity * 1px);
    border-style: solid;
    border-width: max(0.0625rem, 1px);
    color: ${TAMANU_COLORS.softText};
    cursor: pointer;
    display: initial;
    font-family: inherit;
    font-size: inherit;
    font-style: inherit;
    font-weight: inherit;
    inline-size: fit-content;
    line-height: inherit;
    margin: 0;
    padding: 0;
    text-align: center;
    text-decoration-thickness: from-font;
    text-transform: none;
    touch-action: manipulation;

    &:disabled,
    &.${toggleButtonClasses.disabled} {
      background-color: ${TAMANU_COLORS.softOutline};
      border-color: ${TAMANU_COLORS.softText};
      color: ${TAMANU_COLORS.softText};
      cursor: not-allowed;
    }
  }
`;
