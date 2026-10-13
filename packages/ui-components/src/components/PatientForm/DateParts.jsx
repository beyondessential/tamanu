import React, { useId } from 'react';
import styled from 'styled-components';

import { TranslatedText } from '../../components';
import { useTranslation } from '../../contexts/Translation';
import { MONTHS } from './kioskDates';
import { KioskInput, KioskSelect, scaled, SubLabel } from './kioskStyles';

/** Three labelled boxes side by side, as dates and times are entered at the kiosk. */
export const PartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.8fr 1.3fr;
  gap: ${scaled(14)};
`;

export const digitsOnly = value => value.replace(/\D/g, '');

/**
 * Day, month by name and year: how patients enter every date at the kiosk, including their date
 * of birth. It only collects the parts; what counts as a valid date is up to the caller.
 *
 * @param {object} props
 * @param {{ day: string, month: string, year: string }} props.parts Month is 1–12, or '' for none
 * @param {(parts: object) => void} props.onChange Called with `parts` updated
 * @param {{ day?: object, month?: object, year?: object }} [props.partProps] Extra props for each
 *   part's control, like test IDs or the keyboard's Enter key hint
 */
export const DateParts = ({
  parts,
  onChange,
  error,
  Input = KioskInput,
  Select = KioskSelect,
  partProps = {},
}) => {
  const { getTranslation } = useTranslation();
  const idPrefix = useId();
  return (
    <PartsGrid>
      <div>
        <SubLabel htmlFor={`${idPrefix}-day`}>
          <TranslatedText stringId="kiosk.date.day" fallback="Day" />
        </SubLabel>
        <Input
          id={`${idPrefix}-day`}
          value={parts.day}
          onChange={event => onChange({ ...parts, day: digitsOnly(event.target.value) })}
          inputMode="numeric"
          maxLength={2}
          autoComplete="off"
          aria-invalid={error}
          {...partProps.day}
        />
      </div>
      <div>
        <SubLabel htmlFor={`${idPrefix}-month`}>
          <TranslatedText stringId="kiosk.date.month" fallback="Month" />
        </SubLabel>
        <Select
          id={`${idPrefix}-month`}
          value={parts.month}
          onChange={event => onChange({ ...parts, month: event.target.value })}
          aria-invalid={error}
          {...partProps.month}
        >
          <option value="" disabled hidden>
            {getTranslation('kiosk.date.selectMonth', 'Select')}
          </option>
          {MONTHS.map(({ stringId, fallback }, index) => (
            <option key={stringId} value={String(index + 1)}>
              {getTranslation(stringId, fallback)}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <SubLabel htmlFor={`${idPrefix}-year`}>
          <TranslatedText stringId="kiosk.date.year" fallback="Year" />
        </SubLabel>
        <Input
          id={`${idPrefix}-year`}
          value={parts.year}
          onChange={event => onChange({ ...parts, year: digitsOnly(event.target.value) })}
          inputMode="numeric"
          maxLength={4}
          autoComplete="off"
          aria-invalid={error}
          {...partProps.year}
        />
      </div>
    </PartsGrid>
  );
};
