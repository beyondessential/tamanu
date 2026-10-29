import styled, { css, keyframes } from 'styled-components';

import {
  FormErrorMessage,
  FormInput,
  FormPrimaryButton,
  FormSecondaryButton,
  FormSelect,
  FormSubLabel,
  TAMANU_COLORS,
} from '@tamanu/ui-components';

/**
 * Kiosk sizes scale with the patient's chosen text size. Every font size and touch target is
 * written through this helper so the whole interface grows together.
 */
export const scaled = pixels => `calc(${pixels}px * var(--kiosk-scale))`;

/**
 * Styles for when the screen is narrower than `baseWidth` at standard text size. The text size
 * comes from the theme the kiosk provides, so the switch happens wherever the content would no
 * longer fit, however large the patient has made the text.
 */
const whenNarrowerThan =
  baseWidth =>
  (...styles) =>
  ({ theme }) => css`
    @media (max-width: ${baseWidth * (theme.kioskScale ?? 1)}px) {
      ${css(...styles)}
    }
  `;

/** The compact layout: portrait tablets, and landscape ones at large text sizes. */
export const whenCompact = whenNarrowerThan(840);

/** When the header's buttons no longer fit with their labels. */
export const whenHeaderCompact = whenNarrowerThan(780);

export const TEXT_SIZE_SCALES = /** @type {const} */ ({
  standard: 1,
  large: 1.2,
  extraLarge: 1.4,
});

const standardPalette = css`
  --kiosk-page: ${TAMANU_COLORS.background};
  --kiosk-surface: ${TAMANU_COLORS.white};
  --kiosk-surface-alt: ${TAMANU_COLORS.background2};
  --kiosk-option: ${TAMANU_COLORS.background};
  --kiosk-text: ${TAMANU_COLORS.darkestText};
  --kiosk-text-secondary: ${TAMANU_COLORS.darkText};
  /* Darker than the Tamanu mid grey, so small labels meet contrast guidelines */
  --kiosk-text-tertiary: #707070;
  --kiosk-heading: ${TAMANU_COLORS.primaryDark};
  --kiosk-primary: ${TAMANU_COLORS.primary};
  --kiosk-on-primary: ${TAMANU_COLORS.white};
  --kiosk-primary-tint: ${TAMANU_COLORS.primary10};
  --kiosk-primary-muted: ${TAMANU_COLORS.primary30};
  --kiosk-selected: ${TAMANU_COLORS.veryLightBlue};
  --kiosk-outline: ${TAMANU_COLORS.outline};
  --kiosk-line: #e7eaee;
  --kiosk-success: ${TAMANU_COLORS.green};
  --kiosk-success-tint: #e9f5ee;
  --kiosk-alert: ${TAMANU_COLORS.alert};
  --kiosk-info: ${TAMANU_COLORS.blue};
  --kiosk-info-tint: #e8f1fb;
  --kiosk-scrim: rgba(31, 35, 41, 0.45);
  --kiosk-border: 1px;
  /* Edges that only need drawing when colours alone can't separate surfaces */
  --kiosk-option-edge: transparent;
  --kiosk-dialog-edge: transparent;
`;

const highContrastPalette = css`
  --kiosk-page: #000000;
  --kiosk-surface: #000000;
  --kiosk-surface-alt: #000000;
  --kiosk-option: #000000;
  --kiosk-text: #ffffff;
  --kiosk-text-secondary: #ffffff;
  --kiosk-text-tertiary: #ffffff;
  --kiosk-heading: #ffffff;
  --kiosk-primary: #ffe14d;
  --kiosk-on-primary: #000000;
  --kiosk-primary-tint: #000000;
  --kiosk-primary-muted: #8a7a2a;
  --kiosk-selected: #000000;
  --kiosk-outline: #ffffff;
  --kiosk-line: #ffffff;
  --kiosk-success: #7ee2a8;
  --kiosk-success-tint: #000000;
  --kiosk-alert: #ff9b8c;
  --kiosk-info: #ffe14d;
  --kiosk-info-tint: #000000;
  --kiosk-scrim: rgba(0, 0, 0, 0.8);
  --kiosk-border: 2px;
  --kiosk-option-edge: #ffffff;
  --kiosk-dialog-edge: #ffffff;
`;

/** The shared patient form controls take the kiosk's sizes and colours. */
const patientFormAliases = css`
  --pf-scale: var(--kiosk-scale);
  --pf-radius: 14px;
  --pf-page: var(--kiosk-page);
  --pf-surface: var(--kiosk-surface);
  --pf-surface-alt: var(--kiosk-surface-alt);
  --pf-option: var(--kiosk-option);
  --pf-text: var(--kiosk-text);
  --pf-text-secondary: var(--kiosk-text-secondary);
  --pf-text-tertiary: var(--kiosk-text-tertiary);
  --pf-heading: var(--kiosk-heading);
  --pf-primary: var(--kiosk-primary);
  --pf-on-primary: var(--kiosk-on-primary);
  --pf-primary-tint: var(--kiosk-primary-tint);
  --pf-primary-muted: var(--kiosk-primary-muted);
  --pf-outline: var(--kiosk-outline);
  --pf-line: var(--kiosk-line);
  --pf-success: var(--kiosk-success);
  --pf-success-tint: var(--kiosk-success-tint);
  --pf-alert: var(--kiosk-alert);
  --pf-info: var(--kiosk-info);
  --pf-info-tint: var(--kiosk-info-tint);
  --pf-border: var(--kiosk-border);
  --pf-option-edge: var(--kiosk-option-edge);
`;

export const KioskRoot = styled.div`
  ${({ $isHighContrast }) => ($isHighContrast ? highContrastPalette : standardPalette)}
  --kiosk-scale: ${({ $scale }) => $scale};
  ${patientFormAliases}

  position: relative;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  background: var(--kiosk-page);

  @media (max-height: 560px) {
    height: auto;
    min-height: 100dvh;
    overflow: visible;
  }
  color: var(--kiosk-text);
  font-family: Roboto, system-ui, sans-serif;
  font-size: ${scaled(16)};
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
  user-select: none;

  input,
  textarea,
  select {
    user-select: text;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  button {
    font-family: inherit;
    touch-action: manipulation;
  }

  :focus-visible {
    outline: 3px solid var(--kiosk-primary);
    outline-offset: 2px;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
`;

/** Each screen fades in, so moving between them reads as one flow rather than a flash. */
export const ScreenFrame = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  animation: ${fadeIn} 150ms ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** The white outlined panel content sits in. */
export const Panel = styled.main`
  flex: 1;
  min-height: 0;
  margin: 0 ${scaled(28)} ${scaled(28)};
  padding: ${scaled(36)} ${scaled(44)};
  background: var(--kiosk-surface);
  border: var(--kiosk-border) solid var(--kiosk-outline);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: auto;

  ${whenCompact`
    margin: 0 ${scaled(16)} ${scaled(16)};
    padding: ${scaled(28)} ${scaled(28)};
  `}

  ${({ $centred }) =>
    $centred &&
    css`
      align-items: center;
      justify-content: center;
      text-align: center;
    `}
`;

export const Title = styled.h1`
  margin: 0 0 ${scaled(8)};
  font-size: ${scaled(36)};
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.2;
  color: var(--kiosk-heading);
`;

export const Lead = styled.p`
  margin: 0 0 ${scaled(28)};
  font-size: ${scaled(18)};
  line-height: 1.45;
  color: var(--kiosk-text-secondary);
`;

/**
 * The screen's main buttons. They stay pinned to the bottom of the panel when large text makes
 * the content scroll, so the way forward is always in view.
 */
export const Actions = styled.div`
  position: sticky;
  bottom: ${scaled(-36)};
  margin: auto 0 ${scaled(-36)};
  padding: ${scaled(24)} 0 ${scaled(36)};
  background: var(--kiosk-surface);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${scaled(14)};

  ${whenCompact`
    bottom: ${scaled(-28)};
    margin-bottom: ${scaled(-28)};
    padding-bottom: ${scaled(28)};
    flex-wrap: wrap;

    > button {
      flex: 1 1 auto;
    }
  `}
`;

export const CentredActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${scaled(14)};
`;

export const PrimaryButton = FormPrimaryButton;

export const SecondaryButton = FormSecondaryButton;

export const StateIcon = styled.div`
  width: ${scaled(88)};
  height: ${scaled(88)};
  border-radius: 50%;
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  margin-bottom: ${scaled(24)};

  svg {
    width: 50%;
    height: 50%;
  }

  ${({ $tone = 'info' }) =>
    $tone === 'success'
      ? css`
          width: ${scaled(112)};
          height: ${scaled(112)};
          background: var(--kiosk-success-tint);
          color: var(--kiosk-success);
          border: var(--kiosk-border) solid var(--kiosk-success-tint);
        `
      : css`
          background: var(--kiosk-info-tint);
          color: var(--kiosk-info);
          border: var(--kiosk-border) solid var(--kiosk-info-tint);
        `}
`;

/** A label/value pair list, e.g. the searched details or the appointment summary. */
export const SummaryList = styled.dl`
  display: inline-flex;
  flex-wrap: wrap;
  gap: ${scaled(12)} ${scaled(40)};
  margin: 0 0 ${scaled(32)};
  padding: ${scaled(18)} ${scaled(32)};
  text-align: left;
  background: var(--kiosk-surface-alt);
  border: var(--kiosk-border) solid var(--kiosk-outline);
  border-radius: 14px;

  dt {
    font-size: ${scaled(14)};
    color: var(--kiosk-text-tertiary);
    margin-bottom: ${scaled(4)};
  }

  dd {
    margin: 0;
    font-size: ${scaled(20)};
    font-weight: 500;
  }
`;

export const visuallyHidden = css`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;

export const FieldLabel = styled.label`
  display: block;
  margin-bottom: ${scaled(10)};
  font-size: ${scaled(17)};
  font-weight: 500;
`;

export const SubLabel = FormSubLabel;

/** The kiosk's own fields, like the search for an appointment, are larger than form questions. */
const kioskFieldSize = css`
  min-height: ${scaled(68)};
  font-size: ${scaled(24)};
`;

export const KioskInput = styled(FormInput)`
  ${kioskFieldSize}
  padding: 0 ${scaled(22)};
`;

export const KioskSelect = styled(FormSelect)`
  ${kioskFieldSize}
  padding-left: ${scaled(22)};
  padding-right: ${scaled(56)};
  background-position: right ${scaled(20)} center;
`;

export const ErrorMessage = FormErrorMessage;
