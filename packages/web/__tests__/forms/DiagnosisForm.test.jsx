import { describe, it, expect } from 'vitest';
import { DIAGNOSIS_CERTAINTY } from '@tamanu/constants';

import { shouldIncludeCertaintyOption } from '../../app/forms/DiagnosisForm';

// Regression test for the certainty option filter in
// packages/web/app/forms/DiagnosisForm.jsx.
//
// The triage-only "ED Diagnosis" (EMERGENCY) option was never excluded when
// isTriage was false, so it fell through to the final `!EDIT_ONLY.includes(...)`
// check (which is true for EMERGENCY) and was offered/saveable on ordinary
// encounters, contradicting the adjacent comment.

describe('shouldIncludeCertaintyOption', () => {
  it('excludes the triage-only EMERGENCY option when not triaging', () => {
    expect(
      shouldIncludeCertaintyOption({ value: DIAGNOSIS_CERTAINTY.EMERGENCY }, false, false),
    ).toBe(false);
  });

  it('includes the triage-only EMERGENCY option when triaging', () => {
    expect(
      shouldIncludeCertaintyOption({ value: DIAGNOSIS_CERTAINTY.EMERGENCY }, true, false),
    ).toBe(true);
  });

  it('excludes EDIT_ONLY options when not editing, regardless of triage', () => {
    expect(
      shouldIncludeCertaintyOption({ value: DIAGNOSIS_CERTAINTY.DISPROVEN }, false, false),
    ).toBe(false);
    expect(
      shouldIncludeCertaintyOption({ value: DIAGNOSIS_CERTAINTY.ERROR }, true, false),
    ).toBe(false);
  });

  it('includes EDIT_ONLY options when editing', () => {
    expect(
      shouldIncludeCertaintyOption({ value: DIAGNOSIS_CERTAINTY.DISPROVEN }, false, true),
    ).toBe(true);
  });

  it('keeps the EMERGENCY option when editing a diagnosis that already has it set, even on a non-triage encounter', () => {
    expect(
      shouldIncludeCertaintyOption(
        { value: DIAGNOSIS_CERTAINTY.EMERGENCY },
        false,
        true,
        DIAGNOSIS_CERTAINTY.EMERGENCY,
      ),
    ).toBe(true);
  });

  it('still excludes EMERGENCY for a new diagnosis on a non-triage encounter, even if a currentCertainty is passed', () => {
    expect(
      shouldIncludeCertaintyOption(
        { value: DIAGNOSIS_CERTAINTY.EMERGENCY },
        false,
        false,
        DIAGNOSIS_CERTAINTY.EMERGENCY,
      ),
    ).toBe(false);
  });

  it('excludes EMERGENCY when editing a diagnosis whose current certainty is not EMERGENCY, on a non-triage encounter', () => {
    expect(
      shouldIncludeCertaintyOption(
        { value: DIAGNOSIS_CERTAINTY.EMERGENCY },
        false,
        true,
        DIAGNOSIS_CERTAINTY.SUSPECTED,
      ),
    ).toBe(false);
  });
});
