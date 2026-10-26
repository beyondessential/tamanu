// spec: KIOSK
import React, { useCallback, useEffect, useState } from 'react';
import { ThemeProvider } from 'styled-components';

import { TranslatedText } from '../../components';
import { useAuth } from '../../contexts/Auth';
import { useSettings } from '../../contexts/Settings';
import { useTranslation } from '../../contexts/Translation';
import { useTranslationLanguagesQuery } from '../../api/queries/useTranslationLanguagesQuery';
import { KioskHeader } from './KioskHeader';
import {
  DisplaySettingsDialog,
  HelpDialog,
  InactivityDialog,
  StartOverDialog,
} from './KioskModals';
import { KIOSK_STEPS, KioskSessionProvider, useKioskSession } from './KioskSession';
import { useKioskFacilityQuery } from './kioskApi';
import { KioskRoot, Lead, Panel, ScreenFrame, TEXT_SIZE_SCALES, Title } from './kioskStyles';
import { useInactivityTimer, useKeepSignedIn } from './useKioskTimers';
import { LandingScreen } from './screens/LandingScreen';
import { FindAppointmentScreen } from './screens/FindAppointmentScreen';
import { MatchesScreen } from './screens/MatchesScreen';
import { NoMatchScreen } from './screens/NoMatchScreen';
import { AlreadyCheckedInScreen } from './screens/AlreadyCheckedInScreen';
import { FormsScreen } from './screens/FormsScreen';
import { CheckedInScreen } from './screens/CheckedInScreen';

const DIALOGS = /** @type {const} */ ({
  DISPLAY_SETTINGS: 'displaySettings',
  HELP: 'help',
  START_OVER: 'startOver',
});

const DEFAULT_DISPLAY = { textSize: 'standard', isHighContrast: false };

/** Extends the app's theme with the text size, which decides when the layout turns compact. */
const kioskTheme = kioskScale => outerTheme => ({
  ...outerTheme,
  kioskScale,
  formScale: kioskScale,
});

const SCREENS = {
  [KIOSK_STEPS.LANDING]: LandingScreen,
  [KIOSK_STEPS.FIND]: FindAppointmentScreen,
  [KIOSK_STEPS.MATCHES]: MatchesScreen,
  [KIOSK_STEPS.NO_MATCH]: NoMatchScreen,
  [KIOSK_STEPS.ALREADY_CHECKED_IN]: AlreadyCheckedInScreen,
  [KIOSK_STEPS.FORMS]: FormsScreen,
  [KIOSK_STEPS.CHECKED_IN]: CheckedInScreen,
};

const DEFAULT_LANGUAGE_STORAGE_KEY = 'kioskDefaultLanguage';

/**
 * The language each new patient starts in: the one the kiosk was opened in. Kept for the life of
 * the tab, so reloading mid-session doesn't make one patient's choice the default for the next.
 */
const getKioskDefaultLanguage = storedLanguage => {
  const savedDefault = window.sessionStorage.getItem(DEFAULT_LANGUAGE_STORAGE_KEY);
  if (savedDefault) return savedDefault;
  window.sessionStorage.setItem(DEFAULT_LANGUAGE_STORAGE_KEY, storedLanguage);
  return storedLanguage;
};

const useKioskLanguages = () => {
  const { data } = useTranslationLanguagesQuery();
  if (!data) return [];
  const { languagesInDb, languageDisplayNames } = data;
  return languagesInDb.map(code => ({ code, name: languageDisplayNames[code] ?? code }));
};

const Kiosk = () => {
  const { getSetting } = useSettings();
  const { data: facility } = useKioskFacilityQuery();
  const { storedLanguage, updateStoredLanguage, getReferenceDataTranslation } = useTranslation();
  const languages = useKioskLanguages();
  const { session, dispatch } = useKioskSession();

  const [defaultLanguage] = useState(() => getKioskDefaultLanguage(storedLanguage));
  const [display, setDisplay] = useState(DEFAULT_DISPLAY);
  const [openDialog, setOpenDialog] = useState(null);

  const endSession = useCallback(() => {
    dispatch({ type: 'end' });
    setDisplay(DEFAULT_DISPLAY);
    setOpenDialog(null);
    if (storedLanguage !== defaultLanguage) updateStoredLanguage(defaultLanguage);
  }, [dispatch, storedLanguage, defaultLanguage, updateStoredLanguage]);

  useKeepSignedIn();
  const isSessionOpen = ![KIOSK_STEPS.LANDING, KIOSK_STEPS.CHECKED_IN].includes(session.step);
  // Choices made on the landing page by someone who then walks away are cleared too
  const isDisplayChanged = display !== DEFAULT_DISPLAY || storedLanguage !== defaultLanguage;
  const inactivity = useInactivityTimer({
    isEnabled: isSessionOpen || isDisplayChanged,
    timeoutSeconds: getSetting('kiosk.inactivityTimeout') ?? 90,
    // Nobody needs warning on the landing page, so choices left there are simply cleared
    warningSeconds: isSessionOpen ? (getSetting('kiosk.inactivityWarning') ?? 30) : 0,
    onExpire: endSession,
  });

  const Screen = SCREENS[session.step];
  const facilityName =
    facility &&
    getReferenceDataTranslation({
      value: facility.id,
      category: 'facility',
      fallback: facility.name,
    });
  const currentLanguage = languages.find(({ code }) => code === storedLanguage);

  const scale = TEXT_SIZE_SCALES[display.textSize];
  return (
    <ThemeProvider theme={kioskTheme(scale)}>
      <KioskRoot
        $scale={scale}
        $isHighContrast={display.isHighContrast}
        onPointerDownCapture={inactivity.recordActivity}
        onKeyDownCapture={inactivity.recordActivity}
        onScrollCapture={inactivity.recordActivity}
        data-testid="kiosk"
      >
        <KioskHeader
          isHighContrast={display.isHighContrast}
          facilityName={facilityName}
          languageName={languages.length > 1 ? currentLanguage?.name : null}
          isStartOverShown={isSessionOpen}
          onStartOver={() => setOpenDialog(DIALOGS.START_OVER)}
          onOpenDisplaySettings={() => setOpenDialog(DIALOGS.DISPLAY_SETTINGS)}
          onOpenHelp={() => setOpenDialog(DIALOGS.HELP)}
        />
        <ScreenFrame key={session.step}>
          <Screen facilityName={facilityName} onEndSession={endSession} />
        </ScreenFrame>

        {openDialog === DIALOGS.DISPLAY_SETTINGS && (
          <DisplaySettingsDialog
            languages={languages}
            language={storedLanguage}
            onChangeLanguage={updateStoredLanguage}
            textSize={display.textSize}
            onChangeTextSize={textSize => setDisplay(current => ({ ...current, textSize }))}
            isHighContrast={display.isHighContrast}
            onToggleHighContrast={() =>
              setDisplay(current => ({ ...current, isHighContrast: !current.isHighContrast }))
            }
            onClose={() => setOpenDialog(null)}
          />
        )}
        {openDialog === DIALOGS.HELP && <HelpDialog onClose={() => setOpenDialog(null)} />}
        {openDialog === DIALOGS.START_OVER && (
          <StartOverDialog onCancel={() => setOpenDialog(null)} onConfirm={endSession} />
        )}
        {isSessionOpen && inactivity.isWarning && (
          <InactivityDialog
            secondsRemaining={inactivity.secondsRemaining}
            onStartOver={endSession}
            onStillHere={inactivity.dismissWarning}
          />
        )}
      </KioskRoot>
    </ThemeProvider>
  );
};

const KioskUnavailable = ({ title, text }) => (
  <KioskRoot $scale={1}>
    <Panel $centred style={{ marginTop: 28 }}>
      <Title>{title}</Title>
      <Lead>{text}</Lead>
    </Panel>
  </KioskRoot>
);

const KioskTurnedOff = () => (
  <KioskUnavailable
    title={
      <TranslatedText stringId="kiosk.unavailable.title" fallback="Self check-in is unavailable" />
    }
    text={
      <TranslatedText
        stringId="kiosk.unavailable.text"
        fallback="The self check-in kiosk is not turned on for this facility."
      />
    }
  />
);

const KioskNotPermitted = () => (
  <KioskUnavailable
    title={
      <TranslatedText stringId="kiosk.unavailable.title" fallback="Self check-in is unavailable" />
    }
    text={
      <TranslatedText
        stringId="kiosk.notPermitted.text"
        fallback="The account signed in here doesn't have permission to run the self check-in kiosk."
      />
    }
  />
);

/** Keeps the fixed Back and Next above the on-screen keyboard, without changing the staff app. */
const useResizeForKeyboard = () => {
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) return undefined;
    const original = viewport.content;
    viewport.content = `${original}, interactive-widget=resizes-content`;
    return () => {
      viewport.content = original;
    };
  }, []);
};

export const KioskView = () => {
  const { getSetting, isSettingsLoaded } = useSettings();
  const { ability } = useAuth();
  useResizeForKeyboard();
  if (!isSettingsLoaded || !ability) return null;
  if (!getSetting('kiosk.enabled')) return <KioskTurnedOff />;
  if (!ability?.can?.('run', 'Kiosk')) return <KioskNotPermitted />;
  return (
    <KioskSessionProvider>
      <Kiosk />
    </KioskSessionProvider>
  );
};
