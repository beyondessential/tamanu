import styled, { css } from 'styled-components';

import { TAMANU_COLORS } from '../../constants';

/**
 * Forms patients fill in themselves (at the kiosk, in the patient portal) share these controls.
 * Each surface sizes them through `--pf-scale` and colours them through the `--pf-*` custom
 * properties, so the kiosk can make them large and high contrast while the portal keeps them
 * phone sized. Every size is written through this helper so a whole form scales together.
 */
export const formScaled = pixels => `calc(${pixels}px * var(--pf-scale, 1))`;

/**
 * Styles for when the screen is narrower than `baseWidth` at the standard size. The scale comes
 * from the styled-components theme (`formScale`), so the switch happens wherever the content
 * would no longer fit, however large the text has been made.
 */
export const whenFormNarrowerThan =
  baseWidth =>
  (...styles) =>
  ({ theme }) => css`
    @media (max-width: ${baseWidth * (theme.formScale ?? 1)}px) {
      ${css(...styles)}
    }
  `;

/** The compact form layout: phones, portrait tablets, and landscape ones at large text sizes. */
export const whenFormCompact = whenFormNarrowerThan(840);

/** The standard Tamanu palette for patient forms. A surface sets these on its root element. */
export const patientFormPalette = css`
  --pf-page: ${TAMANU_COLORS.background};
  --pf-surface: ${TAMANU_COLORS.white};
  --pf-surface-alt: ${TAMANU_COLORS.background2};
  --pf-option: ${TAMANU_COLORS.background};
  --pf-text: ${TAMANU_COLORS.darkestText};
  --pf-text-secondary: ${TAMANU_COLORS.darkText};
  /* Darker than the Tamanu mid grey, so small labels meet contrast guidelines */
  --pf-text-tertiary: #707070;
  --pf-heading: ${TAMANU_COLORS.primaryDark};
  --pf-primary: ${TAMANU_COLORS.primary};
  --pf-on-primary: ${TAMANU_COLORS.white};
  --pf-primary-tint: ${TAMANU_COLORS.primary10};
  --pf-primary-muted: ${TAMANU_COLORS.primary30};
  --pf-outline: ${TAMANU_COLORS.outline};
  --pf-line: #e7eaee;
  --pf-success: ${TAMANU_COLORS.green};
  --pf-success-tint: #e9f5ee;
  --pf-alert: ${TAMANU_COLORS.alert};
  --pf-alert-tint: #fff0ee;
  --pf-info: ${TAMANU_COLORS.blue};
  --pf-info-tint: #e8f1fb;
  --pf-border: 1px;
  /* Edges that only need drawing when colours alone can't separate surfaces */
  --pf-option-edge: transparent;
  --pf-radius: 14px;
`;

const inputBase = css`
  width: 100%;
  min-height: ${formScaled(60)};
  padding: 0 ${formScaled(20)};
  border: none;
  border-radius: var(--pf-radius, 14px);
  background: var(--pf-surface);
  box-shadow: inset 0 0 0 var(--pf-border) var(--pf-outline);
  color: var(--pf-text);
  font-family: inherit;
  font-size: ${formScaled(20)};
  outline: none;
  appearance: none;

  &::placeholder {
    color: var(--pf-text-tertiary);
  }

  &:focus {
    box-shadow: inset 0 0 0 2px var(--pf-primary);
  }

  &[aria-invalid='true'] {
    box-shadow: inset 0 0 0 2px var(--pf-alert);
  }

  &[readonly] {
    background: var(--pf-option);
    box-shadow: inset 0 0 0 var(--pf-border) var(--pf-option-edge);
    color: var(--pf-text-secondary);
  }
`;

export const FormInput = styled.input`
  ${inputBase}
`;

const CHEVRON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 9.5l6 6 6-6' fill='none' stroke='%23888888' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

export const FormSelect = styled.select`
  ${inputBase}
  padding-right: ${formScaled(52)};
  background-image: url('${CHEVRON}');
  background-repeat: no-repeat;
  background-position: right ${formScaled(18)} center;
  background-size: ${formScaled(24)};
  cursor: pointer;
`;

export const FormSubLabel = styled.label`
  display: block;
  margin-bottom: ${formScaled(6)};
  font-size: ${formScaled(14)};
  color: var(--pf-text-tertiary);
`;

export const FormErrorMessage = styled.div`
  margin-top: ${formScaled(8)};
  color: var(--pf-alert);
  font-size: ${formScaled(15)};
  font-weight: 500;
`;

const buttonBase = css`
  min-height: ${formScaled(64)};
  padding: ${formScaled(8)} ${formScaled(36)};
  border-radius: var(--pf-radius, 14px);
  font-family: inherit;
  font-size: ${formScaled(20)};
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${formScaled(10)};
  cursor: pointer;
  touch-action: manipulation;
  transition:
    background-color 120ms,
    transform 80ms;

  svg {
    width: ${formScaled(22)};
    height: ${formScaled(22)};
    flex: none;
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  ${({ $wide }) =>
    $wide &&
    css`
      min-width: min(${formScaled(280)}, 100%);
    `}
`;

export const FormPrimaryButton = styled.button.attrs(({ type }) => ({ type: type ?? 'button' }))`
  ${buttonBase}
  background: var(--pf-primary);
  color: var(--pf-on-primary);
  border: var(--pf-border) solid var(--pf-primary);

  &:disabled {
    cursor: default;
    background: var(--pf-primary-muted);
    border-color: var(--pf-primary-muted);
  }
`;

export const FormSecondaryButton = styled.button.attrs(({ type }) => ({ type: type ?? 'button' }))`
  ${buttonBase}
  background: var(--pf-surface);
  color: var(--pf-primary);
  border: var(--pf-border) solid var(--pf-primary);

  &:disabled {
    cursor: default;
    opacity: 0.4;
  }
`;
