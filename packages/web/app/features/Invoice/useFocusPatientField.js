import { useEffect } from 'react';

import {
  getPatientFieldClassName,
  PATIENT_FIELD_SECTION_CLASS,
} from '../../forms/PatientDetailsForm/ConfiguredMandatoryPatientFields';

// How long to wait for the form to render its fields, and how long to hold the focus once it has.
const FIELD_WAIT_ATTEMPTS = 100;
const FOCUS_HOLD_ATTEMPTS = 40;
const RETRY_MS = 50;

/**
 * The element to scroll to for a field: its section's heading, so the field arrives with the
 * section it belongs to rather than alone in the middle of the window. A deployment that marks a
 * field mandatory moves it into the form's headless top section, which has no heading.
 */
const scrollAnchorFor = field =>
  field.closest(`.${PATIENT_FIELD_SECTION_CLASS}`)?.previousElementSibling ?? field;

/**
 * Brings a configured patient field into view and focuses it once the form has rendered, for a
 * window opened to land on one — the invoicing patient details modal, opened to add an insurance
 * plan. The field is found by the class the form puts on it, within `containerRef`, since the same
 * form may be on the page behind.
 */
export const useFocusPatientField = (fieldName, isReady, containerRef) => {
  useEffect(() => {
    if (!fieldName || !isReady) return undefined;

    let waitAttemptsLeft = FIELD_WAIT_ATTEMPTS;
    let holdAttemptsLeft = FOCUS_HOLD_ATTEMPTS;
    let hasScrolled = false;
    let hasFocused = false;
    let timer;

    const attempt = () => {
      const container = containerRef.current;
      const field = container?.querySelector(`.${getPatientFieldClassName(fieldName)}`);

      // The form fetches its own field definitions and values after the window's queries settle,
      // and renders nothing but a loading indicator until they land, so the field is not there to
      // be found on the first look.
      if (!field) {
        waitAttemptsLeft -= 1;
        if (waitAttemptsLeft > 0) timer = setTimeout(attempt, RETRY_MS);
        return;
      }

      if (!hasScrolled) {
        scrollAnchorFor(field).scrollIntoView({ block: 'start', behavior: 'smooth' });
        hasScrolled = true;
      }

      const active = document.activeElement;

      // Once the user has put themselves somewhere else, nothing here has any business pulling
      // them back out of it. Measured against the whole dialog rather than the form, since the
      // window's own actions sit outside the content in a row of their own.
      const dialog = field.closest('[role="dialog"]') ?? container;
      if (hasFocused && dialog.contains(active) && !field.contains(active)) return;

      // A suggester-backed field shows a plain input while its options load and swaps in the real
      // control when they arrive, dropping the focus placed on the placeholder. The swap can come
      // after the focus has sat still for several turns, so hold the field rather than stopping at
      // the first turn the focus survives.
      const input = field.querySelector('input, [tabindex]');
      if (input && active !== input) {
        input.focus();
        hasFocused = true;
      }

      holdAttemptsLeft -= 1;
      if (holdAttemptsLeft > 0) timer = setTimeout(attempt, RETRY_MS);
    };

    timer = setTimeout(attempt);
    return () => clearTimeout(timer);
  }, [fieldName, isReady, containerRef]);
};
