import React from 'react';

import { TranslatedText } from '../../../Translation';

export const TIME_SLOT_PICKER_VARIANTS = {
  RANGE: 'range',
  START: 'start',
  END: 'end',
};

export const CONFLICT_TOOLTIP_TITLE = {
  [TIME_SLOT_PICKER_VARIANTS.RANGE]: (
    <TranslatedText
      stringId="locationBooking.tooltip.unavailableTimeInRangeWarning"
      fallback="All times must be available when booking over multiple timeslots"
      data-test-id='translatedtext-oknz' />
  ),
  [TIME_SLOT_PICKER_VARIANTS.START]: (
    <TranslatedText
      stringId="locationBooking.tooltip.unavailableFutureTimeWarning"
      fallback="All future time slots must be available when booking overnight"
      data-test-id='translatedtext-o32x' />
  ),
  [TIME_SLOT_PICKER_VARIANTS.END]: (
    <TranslatedText
      stringId="locationBooking.tooltip.unavailablePastTimeWarning"
      fallback="All previous time slots must be available when booking overnight"
      data-test-id='translatedtext-usm1' />
  ),
};
