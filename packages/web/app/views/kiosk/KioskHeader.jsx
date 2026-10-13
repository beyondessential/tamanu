import React from 'react';
import styled from 'styled-components';

import { useTranslation } from '../../contexts/Translation';
import { LogoDark, LogoLight } from '../../components/Logo';
import { AccessibilityIcon, GlobeIcon, HelpIcon, RestartIcon } from './KioskIcons';
import { scaled, whenHeaderCompact } from './kioskStyles';

const Header = styled.header`
  flex: none;
  display: flex;
  align-items: center;
  gap: ${scaled(14)};
  min-height: ${scaled(80)};
  padding: ${scaled(12)} ${scaled(36)};
`;

const LOGO_HEIGHT = scaled(30);

const FacilityName = styled.div`
  ${whenHeaderCompact`
    display: none;
  `}
  padding-left: ${scaled(14)};
  border-left: var(--kiosk-border) solid var(--kiosk-outline);
  color: var(--kiosk-text-secondary);
  font-size: ${scaled(15)};
`;

const Spacer = styled.div`
  flex: 1;
`;

const HeaderButton = styled.button.attrs({ type: 'button' })`
  min-height: ${scaled(48)};
  padding: 0 ${scaled(20)};
  display: inline-flex;
  align-items: center;
  gap: ${scaled(8)};
  border: var(--kiosk-border) solid var(--kiosk-primary);
  border-radius: ${scaled(24)};
  background: var(--kiosk-surface);
  color: var(--kiosk-primary);
  font-size: ${scaled(16)};
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;

  svg {
    width: ${scaled(22)};
    height: ${scaled(22)};
    flex: none;
  }
`;

const TextHeaderButton = styled(HeaderButton)`
  border-color: transparent;
  background: none;
  color: var(--kiosk-text-secondary);
  padding: 0 ${scaled(12)};
`;

/** Button text that gives way to the icon alone in the compact layout. */
const Label = styled.span`
  ${whenHeaderCompact`
    display: none;
  `}
`;

const Separator = styled.span`
  width: var(--kiosk-border);
  height: ${scaled(22)};
  margin: 0 ${scaled(2)};
  background: var(--kiosk-primary-muted);
`;

export const KioskHeader = ({
  isHighContrast,
  facilityName,
  languageName,
  isStartOverShown,
  onStartOver,
  onOpenDisplaySettings,
  onOpenHelp,
}) => {
  const { getTranslation } = useTranslation();
  const startOverLabel = getTranslation('kiosk.action.startOver', 'Start over');
  const accessibilityLabel = getTranslation('kiosk.accessibility.title', 'Accessibility');
  const helpLabel = getTranslation('kiosk.action.help', 'Help');

  // Labels stay as accessible names when the compact layout shows the icons alone
  return (
    <Header>
      {isHighContrast ? <LogoLight height={LOGO_HEIGHT} /> : <LogoDark height={LOGO_HEIGHT} />}
      {facilityName && <FacilityName>{facilityName}</FacilityName>}
      <Spacer />
      {isStartOverShown && (
        <TextHeaderButton onClick={onStartOver} aria-label={startOverLabel}>
          <RestartIcon />
          <Label>{startOverLabel}</Label>
        </TextHeaderButton>
      )}
      <HeaderButton
        onClick={onOpenDisplaySettings}
        aria-haspopup="dialog"
        aria-label={languageName ? `${languageName}, ${accessibilityLabel}` : accessibilityLabel}
      >
        {languageName ? (
          <>
            <GlobeIcon />
            <Label>{languageName}</Label>
            <Separator aria-hidden="true" />
            <AccessibilityIcon />
          </>
        ) : (
          <>
            <AccessibilityIcon />
            <Label>{accessibilityLabel}</Label>
          </>
        )}
      </HeaderButton>
      <HeaderButton onClick={onOpenHelp} aria-haspopup="dialog" aria-label={helpLabel}>
        <HelpIcon />
        <Label>{helpLabel}</Label>
      </HeaderButton>
    </Header>
  );
};
