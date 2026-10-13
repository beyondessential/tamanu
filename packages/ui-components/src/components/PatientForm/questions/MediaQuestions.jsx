import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { SETTING_KEYS } from '@tamanu/constants';

import { useSettings } from '../../../contexts';
import { FILTER_PHOTOS } from '../../Field/FileChooserField';
import { SignatureField } from '../../Field/signature';
import { TranslatedText } from '../../Translation';
import { FormCameraIcon } from '../icons';
import { FormErrorMessage, formScaled, FormSecondaryButton } from '../styles';
import { Question, setFieldValue } from './QuestionLayout';

const DEFAULT_MAX_PHOTO_MB = 10;
const PHOTO_ACCEPT = FILTER_PHOTOS.extensions.map(extension => `.${extension}`).join(',');

const PhotoArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${formScaled(12)};
  min-height: ${formScaled(150)};
  padding: ${formScaled(16)};
  border: 2px dashed var(--pf-outline);
  border-radius: var(--pf-radius, 14px);

  img {
    max-width: 100%;
    max-height: ${formScaled(240)};
    border-radius: 10px;
  }
`;

/** A preview address for the chosen photo, released when it's replaced or the question closes. */
const usePreviewUrl = file => {
  const url = useMemo(() => (file instanceof Blob ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);
  return url;
};

/**
 * Opens the device's camera. The answer is the photo file, as with the shared photo field, and
 * is uploaded when the form is submitted.
 */
export const PhotoQuestion = ({ field, label, required, error, helperText }) => {
  const { getSetting } = useSettings();
  const inputRef = useRef(null);
  const [isTooLarge, setIsTooLarge] = useState(false);
  const previewUrl = usePreviewUrl(field.value);
  const maxSizeMb = getSetting(SETTING_KEYS.FILE_CHOOSER_MB_SIZE_LIMIT) || DEFAULT_MAX_PHOTO_MB;

  const choosePhoto = event => {
    const [file] = event.target.files;
    event.target.value = '';
    if (!file) return;
    const isWithinLimit = file.size <= maxSizeMb * 1000 * 1000;
    setIsTooLarge(!isWithinLimit);
    if (isWithinLimit) setFieldValue(field, file);
  };

  return (
    <Question {...{ label, required, error, helperText }}>
      <PhotoArea>
        {previewUrl && <img src={previewUrl} alt="" />}
        <FormSecondaryButton onClick={() => inputRef.current.click()}>
          <FormCameraIcon />
          {previewUrl ? (
            <TranslatedText stringId="patientForm.question.photo.retake" fallback="Retake photo" />
          ) : (
            <TranslatedText stringId="patientForm.question.photo.take" fallback="Take photo" />
          )}
        </FormSecondaryButton>
        <input
          ref={inputRef}
          type="file"
          accept={PHOTO_ACCEPT}
          capture="environment"
          onChange={choosePhoto}
          hidden
        />
      </PhotoArea>
      {isTooLarge && (
        <FormErrorMessage role="alert">
          <TranslatedText
            stringId="patientForm.question.photo.tooLarge"
            fallback="That photo is too large. Please try again."
          />
        </FormErrorMessage>
      )}
    </Question>
  );
};

const SignatureFrame = styled.div`
  /* The shared field's own label, instructions and frame give way to the question's */
  > label {
    display: none;
  }

  [data-testid='signaturefield-container'] {
    padding: 0;
    border: none;

    > p {
      display: none;
    }
  }

  [data-testid='signaturefield-draw-area'] {
    width: 100%;
    border-radius: var(--pf-radius, 14px);
    border-color: var(--pf-outline);
    background: var(--pf-surface-alt);
    font-size: ${formScaled(18)};
  }

  [data-testid='signaturefield-clear'] {
    align-self: flex-end;
    min-height: ${formScaled(44)};
    font-size: ${formScaled(17)};
  }
`;

/** The shared signature field, with the question text and a hint written for touch. */
export const SignatureQuestion = ({ label, required, ...props }) => (
  <Question
    label={label}
    required={required}
    hint={<TranslatedText stringId="patientForm.question.signature" fallback="Sign with your finger" />}
  >
    <SignatureFrame>
      <SignatureField {...props} required={required} />
    </SignatureFrame>
  </Question>
);
