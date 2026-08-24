import { CircularProgress, IconButton } from '@material-ui/core';
import { red } from '@material-ui/core/colors';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import Lock from '@mui/icons-material/Lock';
import MuiButton, { buttonClasses } from '@mui/material/Button';
import { svgIconClasses } from '@mui/material/SvgIcon';
import MuiToggleButton, { toggleButtonClasses } from '@mui/material/ToggleButton';
import { toggleButtonGroupClasses } from '@mui/material/ToggleButtonGroup';
import { useFormikContext } from 'formik';
import React from 'react';
import styled from 'styled-components';

import { TAMANU_COLORS } from '../../constants';
import { TranslatedText } from '../Translation';
import { useFormButtonSubmitting } from '../useFormButtonSubmitting';
import { VisuallyHidden } from '../VisuallyHidden';
import { withPermissionCheck } from '../withPermissionCheck';
import { withPermissionTooltip } from '../withPermissionTooltip';

const StyledButton = styled(MuiButton)`
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  text-transform: none;
  padding: 11px 18px 12px 18px;
  box-shadow: none;
  min-width: 100px;

  /* This style targets SVG icons provided as a child. Prefer using props startIcon or endIcon. */
  & > .${svgIconClasses.root},
  & :not(.MuiButton-startIcon, .MuiButton-endIcon) > .${svgIconClasses.root} {
    width: 19.5px;
    height: auto;
    margin-right: 10px;
  }

  &.MuiButton-sizeSmall {
    padding-inline: 14px;
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
`;

const StyledCircularProgress = styled(CircularProgress)`
  margin-right: 5px;
`;

const BaseButton = ({
  children,
  type = 'button',
  disabled = false,
  isSubmitting = false,
  hasPermission = true,
  loadingColor = TAMANU_COLORS.white,
  showLoadingIndicator,
  ...props
}) => {
  const displayLock = !isSubmitting && !hasPermission;

  return (
    <StyledButton type={type} disabled={disabled || !hasPermission} {...props}>
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

export const Button = ({ isSubmitting = false, disabled, ...props }) => (
  <BaseButton
    isSubmitting={isSubmitting}
    disabled={disabled || isSubmitting}
    showLoadingIndicator={isSubmitting}
    {...props}
  />
);

export const OutlinedButton = styled(StyledButton).attrs({
  color: 'primary',
  variant: 'outlined',
})`
  :disabled {
    border-color: ${TAMANU_COLORS.softText};
  }
`;

export const GreyOutlinedButton = styled(StyledButton).attrs(p => ({
  color: p.theme.palette.text.secondary,
  variant: 'outlined',
}))`
  border: 1px solid #dedede;
`;

export const RedOutlinedButton = styled(StyledButton).attrs({
  color: 'error',
  variant: 'outlined',
})``;

export const LargeButton = styled(StyledButton)`
  font-size: 15px;
  line-height: 18px;
  padding: 12px 25px;
  border: 1px solid ${props => props.theme.palette.primary.main};
`;

export const LargeOutlineButton = props => <LargeButton variant="outlined" {...props} />;

export const DeleteButton = styled(Button).attrs({
  children: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
})`
  background-color: ${red[600]};
  color: ${TAMANU_COLORS.white};
  &:hover {
    background-color: ${red[800]};
  }
`;

export const TextButton = styled(Button).attrs({
  variant: 'text',
})`
  color: #5b84ad;
  font-size: 1rem;
  min-block-size: auto;
  min-inline-size: auto;
  padding: 0;
  :hover {
    background: transparent;
    color: #23476b;
    font-weight: 500;
  }
  .${buttonClasses.startIcon} {
    /* Zero-ing padding (above) wreaks havoc on the built-in icon alignment */
    margin-left: 0;
  }
`;

const LabelledBackButton = styled(TextButton).attrs({
  startIcon: <ChevronLeft />,
})`
  color: ${TAMANU_COLORS.primary};
  padding-right: 8px;
  font-size: 12px;
  & svg {
    font-size: 20px;
  }
`;

export const BackButton = ({
  children = <TranslatedText stringId="general.action.back" fallback="Back" />,
  text = true,
  ...props
}) => {
  return text ? (
    <LabelledBackButton {...props}>{children}</LabelledBackButton>
  ) : (
    <IconButton size="small" {...props}>
      <ChevronLeft />
      <VisuallyHidden>{children}</VisuallyHidden>
    </IconButton>
  );
};

export const FormSubmitButton = ({
  children,
  disabled,
  text = <TranslatedText stringId="general.action.confirm" fallback="Confirm" />,
  color = 'primary',
  onSubmit,
  ...props
}) => {
  const { isSubmitting, showLoadingIndicator } = useFormButtonSubmitting();

  return (
    <Button
      disabled={disabled || isSubmitting}
      isSubmitting={isSubmitting}
      showLoadingIndicator={showLoadingIndicator}
      color={color}
      onClick={onSubmit}
      type="submit"
      {...props}
    >
      {children || text}
    </Button>
  );
};

export const FormCancelButton = ({ disabled, ...props }) => {
  const { isSubmitting } = useFormikContext();
  return (
    <OutlinedButton
      disabled={disabled || isSubmitting}
      {...props}
      data-testid="outlinedbutton-8rnr"
    />
  );
};

export const DefaultIconButton = styled(IconButton).attrs({
  'data-testid': 'iconbutton-zsiq',
})`
  border-radius: 20%;
  padding: 0px;
`;

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
  padding: 0;
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
