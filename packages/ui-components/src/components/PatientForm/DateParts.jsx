import React, { useId } from 'react';
import styled from 'styled-components';

import { useTranslation } from '../../contexts';
import { TranslatedText } from '../Translation';
import { MONTHS } from './dates';
import { formScaled, FormInput, FormSelect, FormSubLabel } from './styles';

/** Three labelled boxes side by side, as patients enter dates and times. */
export const PartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.8fr 1.3fr;
  gap: ${formScaled(14)};
`;

export const digitsOnly = value => value.replace(/\D/g, '');

/**
 * Day, month by name and year: how patients enter every date, including their date of birth. It
 * only collects the parts; what counts as a valid date is up to the caller.
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
  Input = FormInput,
  Select = FormSelect,
  partProps = {},
}) => {
  const { getTranslation } = useTranslation();
  const idPrefix = useId();
  return (
    <PartsGrid>
      <div>
        <FormSubLabel htmlFor={`${idPrefix}-day`}>
          <TranslatedText stringId="patientForm.date.day" fallback="Day" />
        </FormSubLabel>
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
        <FormSubLabel htmlFor={`${idPrefix}-month`}>
          <TranslatedText stringId="patientForm.date.month" fallback="Month" />
        </FormSubLabel>
        <Select
          id={`${idPrefix}-month`}
          value={parts.month}
          onChange={event => onChange({ ...parts, month: event.target.value })}
          aria-invalid={error}
          {...partProps.month}
        >
          <option value="" disabled hidden>
            {getTranslation('patientForm.date.selectMonth', 'Select')}
          </option>
          {MONTHS.map(({ stringId, fallback }, index) => (
            <option key={stringId} value={String(index + 1)}>
              {getTranslation(stringId, fallback)}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <FormSubLabel htmlFor={`${idPrefix}-year`}>
          <TranslatedText stringId="patientForm.date.year" fallback="Year" />
        </FormSubLabel>
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
