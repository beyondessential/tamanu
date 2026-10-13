import React, { useId } from 'react';
import styled, { css } from 'styled-components';

import { TranslatedText } from '../../components';
import {
  AccessibilityIcon,
  AlertIcon,
  CheckIcon,
  ClockIcon,
  GlobeIcon,
  ReceptionIcon,
} from './KioskIcons';
import {
  Actions,
  CentredActions,
  PrimaryButton,
  scaled,
  SecondaryButton,
  StateIcon,
  TEXT_SIZE_SCALES,
  visuallyHidden,
} from './kioskStyles';

const Scrim = styled.div`
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${scaled(24)};
  background: var(--kiosk-scrim);
`;

const Dialog = styled.div`
  width: ${scaled(540)};
  max-width: 100%;
  max-height: 100%;
  overflow: auto;
  padding: ${scaled(44)} ${scaled(40)} ${scaled(36)};
  background: var(--kiosk-surface);
  border: var(--kiosk-border) solid var(--kiosk-surface);
  border-radius: 24px;
  text-align: center;

  ${StateIcon} {
    margin: 0 auto ${scaled(20)};
  }

  ${({ $isSettings }) =>
    $isSettings &&
    css`
      width: ${scaled(860)};
      padding: ${scaled(36)};
      text-align: left;
    `}

  ${({ $isCompact }) =>
    $isCompact &&
    css`
      width: ${scaled(560)};
    `}
`;

const DialogTitle = styled.h2`
  margin: 0 0 ${scaled(10)};
  font-size: ${scaled(28)};
  font-weight: 500;
  color: var(--kiosk-heading);

  ${({ $isSettings }) =>
    $isSettings &&
    css`
      font-size: ${scaled(30)};
      margin-bottom: ${scaled(24)};
    `}
`;

const DialogText = styled.p`
  margin: 0 0 ${scaled(30)};
  font-size: ${scaled(18)};
  line-height: 1.45;
  color: var(--kiosk-text-secondary);
`;

const KioskDialog = ({ icon, title, children, isSettings = false, isCompact = false }) => {
  const titleId = useId();
  return (
    <Scrim>
      <Dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        $isSettings={isSettings}
        $isCompact={isCompact}
      >
        {icon && <StateIcon>{icon}</StateIcon>}
        <DialogTitle id={titleId} $isSettings={isSettings}>
          {title}
        </DialogTitle>
        {children}
      </Dialog>
    </Scrim>
  );
};

/** Dialogs with an icon above the title, like Help and Start over. */
const MessageDialog = ({ icon, title, text, children }) => (
  <KioskDialog icon={icon} title={title}>
    <DialogText>{text}</DialogText>
    {children}
  </KioskDialog>
);

export const HelpDialog = ({ onClose }) => (
  <MessageDialog
    icon={<ReceptionIcon />}
    title={<TranslatedText stringId="kiosk.help.title" fallback="Need help?" />}
    text={
      <TranslatedText
        stringId="kiosk.help.text"
        fallback="Please go to reception. Our staff will help you check in."
      />
    }
  >
    <PrimaryButton $wide onClick={onClose} autoFocus>
      <TranslatedText stringId="general.action.close" fallback="Close" />
    </PrimaryButton>
  </MessageDialog>
);

export const StartOverDialog = ({ onCancel, onConfirm }) => (
  <MessageDialog
    icon={<AlertIcon />}
    title={<TranslatedText stringId="kiosk.startOver.title" fallback="Start over?" />}
    text={
      <TranslatedText
        stringId="kiosk.startOver.text"
        fallback="Any information you've entered will be lost."
      />
    }
  >
    <CentredActions>
      <SecondaryButton onClick={onCancel}>
        <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
      </SecondaryButton>
      <PrimaryButton $wide onClick={onConfirm}>
        <TranslatedText stringId="kiosk.action.startOver" fallback="Start over" />
      </PrimaryButton>
    </CentredActions>
  </MessageDialog>
);

const Countdown = styled.div`
  margin: ${scaled(-10)} 0 ${scaled(26)};
  font-size: ${scaled(52)};
  font-weight: 500;
  color: var(--kiosk-heading);
  font-variant-numeric: tabular-nums;
`;

const formatCountdown = seconds =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export const InactivityDialog = ({ secondsRemaining, onStartOver, onStillHere }) => (
  <MessageDialog
    icon={<ClockIcon />}
    title={<TranslatedText stringId="kiosk.inactivity.title" fallback="Are you still there?" />}
    text={
      <TranslatedText
        stringId="kiosk.inactivity.text"
        fallback="For your privacy, this check-in will end soon and the information you entered will be cleared."
      />
    }
  >
    <Countdown role="timer" aria-live="off">
      {formatCountdown(Math.max(secondsRemaining, 0))}
    </Countdown>
    <CentredActions>
      <SecondaryButton onClick={onStartOver}>
        <TranslatedText stringId="kiosk.action.startOver" fallback="Start over" />
      </SecondaryButton>
      <PrimaryButton $wide onClick={onStillHere} autoFocus>
        <TranslatedText stringId="kiosk.inactivity.stillHere" fallback="I'm still here" />
      </PrimaryButton>
    </CentredActions>
  </MessageDialog>
);

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: ${scaled(24)};

  @media (orientation: portrait) {
    grid-template-columns: 1fr;
  }
`;

const SettingsCard = styled.section`
  padding: ${scaled(26)};
  background: var(--kiosk-surface);
  border: var(--kiosk-border) solid var(--kiosk-outline);
  border-radius: 16px;
`;

const CardHeading = styled.h3`
  display: flex;
  align-items: center;
  gap: ${scaled(8)};
  margin: 0 0 ${scaled(18)};
  font-size: ${scaled(15)};
  font-weight: 500;
  color: var(--kiosk-text-secondary);

  svg {
    width: ${scaled(20)};
    height: ${scaled(20)};
    color: var(--kiosk-primary);
  }
`;

const LanguageGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${scaled(10)};
`;

const LanguageOption = styled.button.attrs({ type: 'button' })`
  min-height: ${scaled(60)};
  padding: ${scaled(8)} ${scaled(18)};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${scaled(8)};
  border: none;
  border-radius: 14px;
  background: var(--kiosk-option);
  color: var(--kiosk-text);
  font-size: ${scaled(18)};
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  box-shadow: inset 0 0 0 var(--kiosk-border) var(--kiosk-option);

  &[aria-pressed='true'] {
    background: var(--kiosk-primary-tint);
    color: var(--kiosk-heading);
    box-shadow: inset 0 0 0 2px var(--kiosk-primary);
  }

  svg {
    width: ${scaled(24)};
    height: ${scaled(24)};
    padding: ${scaled(4)};
    flex: none;
    border-radius: 50%;
    background: var(--kiosk-primary);
    color: var(--kiosk-on-primary);
  }
`;

const SettingLabel = styled.div`
  margin-bottom: ${scaled(12)};
  font-size: ${scaled(17)};
  font-weight: 500;
`;

const Setting = styled.div`
  & + & {
    margin-top: ${scaled(28)};
  }
`;

const Segmented = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${scaled(4)};
  padding: ${scaled(4)};
  border-radius: 14px;
  background: var(--kiosk-option);
  box-shadow: inset 0 0 0 var(--kiosk-border) var(--kiosk-outline);
`;

const SegmentButton = styled.button.attrs({ type: 'button' })`
  min-height: ${scaled(56)};
  border: none;
  border-radius: 11px;
  background: transparent;
  color: var(--kiosk-text-secondary);
  font-weight: 500;
  cursor: pointer;

  &[aria-pressed='true'] {
    background: var(--kiosk-surface);
    color: var(--kiosk-primary);
    box-shadow: inset 0 0 0 var(--kiosk-border) var(--kiosk-outline);
  }
`;

const ToggleRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${scaled(16)};
  font-size: ${scaled(17)};
  font-weight: 500;
  cursor: pointer;
`;

const Switch = styled.button.attrs({ type: 'button', role: 'switch' })`
  position: relative;
  flex: none;
  width: ${scaled(60)};
  height: ${scaled(34)};
  border: none;
  border-radius: ${scaled(17)};
  background: var(--kiosk-outline);
  cursor: pointer;

  &::after {
    content: '';
    position: absolute;
    top: ${scaled(3)};
    left: ${scaled(3)};
    width: ${scaled(28)};
    height: ${scaled(28)};
    border-radius: 50%;
    background: var(--kiosk-surface);
    transition: left 120ms;
  }

  &[aria-checked='true'] {
    background: var(--kiosk-primary);
  }

  &[aria-checked='true']::after {
    left: ${scaled(29)};
    background: var(--kiosk-on-primary);
  }
`;

const VisuallyHidden = styled.span`
  ${visuallyHidden}
`;

/** The A glyph shown for each text size, at a fixed size so the choices can be compared. */
const TEXT_SIZE_GLYPH_PIXELS = { standard: 16, large: 21, extraLarge: 27 };

const TEXT_SIZE_LABELS = {
  standard: <TranslatedText stringId="kiosk.textSize.standard" fallback="Standard text" />,
  large: <TranslatedText stringId="kiosk.textSize.large" fallback="Large text" />,
  extraLarge: <TranslatedText stringId="kiosk.textSize.extraLarge" fallback="Extra large text" />,
};

const AccessibilitySettings = ({
  textSize,
  onChangeTextSize,
  isHighContrast,
  onToggleHighContrast,
}) => {
  const highContrastId = useId();
  return (
    <>
      <Setting>
        <SettingLabel>
          <TranslatedText stringId="kiosk.accessibility.textSize" fallback="Text size" />
        </SettingLabel>
        <Segmented>
          {Object.keys(TEXT_SIZE_SCALES).map(size => (
            <SegmentButton
              key={size}
              aria-pressed={textSize === size}
              onClick={() => onChangeTextSize(size)}
            >
              <span aria-hidden="true" style={{ fontSize: TEXT_SIZE_GLYPH_PIXELS[size] }}>
                A
              </span>
              <VisuallyHidden>{TEXT_SIZE_LABELS[size]}</VisuallyHidden>
            </SegmentButton>
          ))}
        </Segmented>
      </Setting>
      <Setting>
        <ToggleRow htmlFor={highContrastId}>
          <TranslatedText stringId="kiosk.accessibility.highContrast" fallback="High contrast" />
          <Switch
            id={highContrastId}
            aria-checked={isHighContrast}
            onClick={onToggleHighContrast}
          />
        </ToggleRow>
      </Setting>
    </>
  );
};

export const DisplaySettingsDialog = ({
  languages,
  language,
  onChangeLanguage,
  onClose,
  ...accessibilityProps
}) => {
  const doneButton = (
    <Actions style={{ justifyContent: 'flex-end', paddingTop: scaled(32) }}>
      <PrimaryButton $wide onClick={onClose}>
        <TranslatedText stringId="general.action.done" fallback="Done" />
      </PrimaryButton>
    </Actions>
  );

  if (languages.length <= 1) {
    return (
      <KioskDialog
        isSettings
        isCompact
        title={<TranslatedText stringId="kiosk.accessibility.title" fallback="Accessibility" />}
      >
        <AccessibilitySettings {...accessibilityProps} />
        {doneButton}
      </KioskDialog>
    );
  }

  return (
    <KioskDialog
      isSettings
      title={
        <TranslatedText
          stringId="kiosk.languageAndAccessibility.title"
          fallback="Language and accessibility"
        />
      }
    >
      <SettingsGrid>
        <SettingsCard>
          <CardHeading>
            <GlobeIcon />
            <TranslatedText stringId="kiosk.language.title" fallback="Language" />
          </CardHeading>
          <LanguageGrid>
            {languages.map(({ code, name }) => (
              <LanguageOption
                key={code}
                lang={code}
                aria-pressed={code === language}
                onClick={() => onChangeLanguage(code)}
              >
                {name}
                {code === language && <CheckIcon />}
              </LanguageOption>
            ))}
          </LanguageGrid>
        </SettingsCard>
        <SettingsCard>
          <CardHeading>
            <AccessibilityIcon />
            <TranslatedText stringId="kiosk.accessibility.title" fallback="Accessibility" />
          </CardHeading>
          <AccessibilitySettings {...accessibilityProps} />
        </SettingsCard>
      </SettingsGrid>
      {doneButton}
    </KioskDialog>
  );
};
