// spec: KIOSK
import React, { useCallback, useState } from 'react';

import { TranslatedText } from '../../components';
import { useAuth } from '../../contexts/Auth';
import { useSettings } from '../../contexts/Settings';
import { useTranslation } from '../../contexts/Translation';
import { useFacilityQuery } from '../../api/queries/useFacilityQuery';
import { useTranslationLanguagesQuery } from '../../api/queries/useTranslationLanguagesQuery';
import { KioskHeader } from './KioskHeader';
import {
  DisplaySettingsDialog,
  HelpDialog,
  InactivityDialog,
  StartOverDialog,
} from './KioskModals';
import { KIOSK_STEPS, KioskSessionProvider, useKioskSession } from './KioskSession';
import { KioskRoot, Lead, Panel, TEXT_SIZE_SCALES, Title } from './kioskStyles';
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

const SCREENS = {
  [KIOSK_STEPS.LANDING]: LandingScreen,
  [KIOSK_STEPS.FIND]: FindAppointmentScreen,
  [KIOSK_STEPS.MATCHES]: MatchesScreen,
  [KIOSK_STEPS.NO_MATCH]: NoMatchScreen,
  [KIOSK_STEPS.ALREADY_CHECKED_IN]: AlreadyCheckedInScreen,
  [KIOSK_STEPS.FORMS]: FormsScreen,
  [KIOSK_STEPS.CHECKED_IN]: CheckedInScreen,
};

const useKioskLanguages = () => {
  const { data } = useTranslationLanguagesQuery();
  if (!data) return [];
  const { languagesInDb, languageDisplayNames } = data;
  return languagesInDb.map(code => ({ code, name: languageDisplayNames[code] ?? code }));
};

const Kiosk = () => {
  const { facilityId } = useAuth();
  const { getSetting } = useSettings();
  const { data: facility } = useFacilityQuery(facilityId);
  const { storedLanguage, updateStoredLanguage } = useTranslation();
  const languages = useKioskLanguages();
  const { session, dispatch } = useKioskSession();

  // The language the kiosk was opened in is where each new patient starts
  const [defaultLanguage] = useState(storedLanguage);
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
  const inactivity = useInactivityTimer({
    isEnabled: isSessionOpen,
    timeoutSeconds: getSetting('kiosk.inactivityTimeout') ?? 90,
    warningSeconds: getSetting('kiosk.inactivityWarning') ?? 30,
    onExpire: endSession,
  });

  const Screen = SCREENS[session.step];
  const currentLanguage = languages.find(({ code }) => code === storedLanguage);

  return (
    <KioskRoot
      $scale={TEXT_SIZE_SCALES[display.textSize]}
      $isHighContrast={display.isHighContrast}
      onPointerDownCapture={inactivity.recordActivity}
      onKeyDownCapture={inactivity.recordActivity}
      onScrollCapture={inactivity.recordActivity}
      data-testid="kiosk"
    >
      <KioskHeader
        isHighContrast={display.isHighContrast}
        facilityName={facility?.name}
        languageName={languages.length > 1 ? currentLanguage?.name : null}
        isStartOverShown={isSessionOpen}
        onStartOver={() => setOpenDialog(DIALOGS.START_OVER)}
        onOpenDisplaySettings={() => setOpenDialog(DIALOGS.DISPLAY_SETTINGS)}
        onOpenHelp={() => setOpenDialog(DIALOGS.HELP)}
      />
      <Screen facilityName={facility?.name} onEndSession={endSession} />

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
      {inactivity.isWarning && (
        <InactivityDialog
          secondsRemaining={inactivity.secondsRemaining}
          onStartOver={endSession}
          onStillHere={inactivity.dismissWarning}
        />
      )}
    </KioskRoot>
  );
};

const KioskUnavailable = () => (
  <KioskRoot $scale={1}>
    <Panel $centred style={{ marginTop: 28 }}>
      <Title>
        <TranslatedText
          stringId="kiosk.unavailable.title"
          fallback="Self check-in is unavailable"
        />
      </Title>
      <Lead>
        <TranslatedText
          stringId="kiosk.unavailable.text"
          fallback="The self check-in kiosk is not turned on for this facility."
        />
      </Lead>
    </Panel>
  </KioskRoot>
);

export const KioskView = () => {
  const { getSetting, isSettingsLoaded } = useSettings();
  if (!isSettingsLoaded) return null;
  if (!getSetting('kiosk.enabled')) return <KioskUnavailable />;
  return (
    <KioskSessionProvider>
      <Kiosk />
    </KioskSessionProvider>
  );
};
