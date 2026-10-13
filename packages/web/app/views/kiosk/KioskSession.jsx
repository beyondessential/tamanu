import React, { createContext, useContext, useMemo, useReducer } from 'react';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';

export const KIOSK_STEPS = /** @type {const} */ ({
  LANDING: 'landing',
  FIND: 'find',
  MATCHES: 'matches',
  NO_MATCH: 'noMatch',
  ALREADY_CHECKED_IN: 'alreadyCheckedIn',
  FORMS: 'forms',
  CHECKED_IN: 'checkedIn',
});

export const FORM_STATUSES = /** @type {const} */ ({
  NOT_STARTED: 'notStarted',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
});

const EMPTY_SEARCH = { lastName: '', day: '', month: '', year: '' };

export const initialSession = {
  step: KIOSK_STEPS.LANDING,
  search: EMPTY_SEARCH,
  matches: [],
  /** True when the matches are different patients, rather than one patient's own appointments. */
  isSeveralPatients: false,
  appointment: null,
  /** Form progress keyed by survey ID: `{ status, pageIndex, values }`. Kept on the tablet until check-in. */
  formProgress: {},
  /** The survey open in the forms panel; null opens the first unfinished form, false shows Ready to check in. */
  openFormId: null,
};

export function sessionReducer(session, action) {
  switch (action.type) {
    case 'start':
      return { ...initialSession, step: KIOSK_STEPS.FIND };
    case 'end':
      return initialSession;
    case 'editSearch':
      return { ...session, step: KIOSK_STEPS.FIND };
    case 'searched': {
      const { search, matches, isSeveralPatients } = action;
      return {
        ...session,
        search,
        matches,
        isSeveralPatients,
        appointment: null,
        step: matches.length > 0 ? KIOSK_STEPS.MATCHES : KIOSK_STEPS.NO_MATCH,
      };
    }
    case 'notMe':
      return { ...session, step: KIOSK_STEPS.NO_MATCH };
    case 'confirmed': {
      const { appointment } = action;
      const isSameAppointment = session.appointment?.id === appointment.id;
      return {
        ...session,
        appointment,
        formProgress: isSameAppointment ? session.formProgress : {},
        openFormId: isSameAppointment ? session.openFormId : null,
        // Anything past Confirmed has been checked in already, here or at reception
        step:
          appointment.status === APPOINTMENT_STATUSES.CONFIRMED
            ? KIOSK_STEPS.FORMS
            : KIOSK_STEPS.ALREADY_CHECKED_IN,
      };
    }
    case 'backToMatches':
      return { ...session, step: KIOSK_STEPS.MATCHES };
    case 'openForm':
      return { ...session, openFormId: action.formId };
    case 'saveFormProgress':
      // A form closing as the session ends must not carry its answers into the next session
      if (session.step !== KIOSK_STEPS.FORMS) return session;
      return {
        ...session,
        formProgress: {
          ...session.formProgress,
          // Any saved progress means the patient has opened the form
          [action.formId]: {
            status: FORM_STATUSES.IN_PROGRESS,
            ...session.formProgress[action.formId],
            ...action.progress,
          },
        },
      };
    case 'checkedIn':
      return { ...session, step: KIOSK_STEPS.CHECKED_IN };
    default:
      throw new Error(`Unknown kiosk session action: ${action.type}`);
  }
}

const KioskSessionContext = createContext(null);

export const KioskSessionProvider = ({ children }) => {
  const [session, dispatch] = useReducer(sessionReducer, initialSession);
  const value = useMemo(() => ({ session, dispatch }), [session]);
  return <KioskSessionContext.Provider value={value}>{children}</KioskSessionContext.Provider>;
};

export const useKioskSession = () => {
  const context = useContext(KioskSessionContext);
  if (!context) throw new Error('useKioskSession must be used within a KioskSessionProvider');
  return context;
};
