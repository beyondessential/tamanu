import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { SETTING_KEYS } from '@tamanu/constants';
import { FILTER_PHOTOS, SignatureField } from '@tamanu/ui-components';

import { TranslatedText } from '../../../../components';
import { useSettings } from '../../../../contexts/Settings';
import { ErrorMessage, scaled, SecondaryButton } from '../../kioskStyles';
import { Question, setFieldValue } from './QuestionLayout';

const DEFAULT_MAX_PHOTO_MB = 10;
const PHOTO_ACCEPT = FILTER_PHOTOS.extensions.map(extension => `.${extension}`).join(',');

const PhotoArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${scaled(12)};
  min-height: ${scaled(150)};
  padding: ${scaled(16)};
  border: 2px dashed var(--kiosk-outline);
  border-radius: 14px;

  img {
    max-width: 100%;
    max-height: ${scaled(240)};
    border-radius: 10px;
  }
`;

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M4 8.5A2 2 0 0 1 6 6.5h2l1.5-2h5l1.5 2h2a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

/** A preview address for the chosen photo, released when it's replaced or the question closes. */
const usePreviewUrl = file => {
  const url = useMemo(() => (file instanceof Blob ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);
  return url;
};

/**
 * Opens the tablet's camera. The answer is the photo file, as with the shared photo field, and
 * is uploaded with the rest of the form at check-in.
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
        <SecondaryButton onClick={() => inputRef.current.click()}>
          <CameraIcon />
          {previewUrl ? (
            <TranslatedText stringId="kiosk.question.photo.retake" fallback="Retake photo" />
          ) : (
            <TranslatedText stringId="kiosk.question.photo.take" fallback="Take photo" />
          )}
        </SecondaryButton>
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
        <ErrorMessage role="alert">
          <TranslatedText
            stringId="kiosk.question.photo.tooLarge"
            fallback="That photo is too large. Please try again."
          />
        </ErrorMessage>
      )}
    </Question>
  );
};

const SignatureFrame = styled.div`
  /* The shared field's own label, instructions and frame give way to the kiosk's */
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
    border-radius: 14px;
    border-color: var(--kiosk-outline);
    background: var(--kiosk-surface-alt);
    font-size: ${scaled(18)};
  }

  [data-testid='signaturefield-clear'] {
    align-self: flex-end;
    min-height: ${scaled(44)};
    font-size: ${scaled(17)};
  }
`;

/** The shared signature field, with the kiosk's question text and a hint written for touch. */
export const SignatureQuestion = ({ label, required, ...props }) => (
  <Question
    label={label}
    required={required}
    hint={<TranslatedText stringId="kiosk.question.signature" fallback="Sign with your finger" />}
  >
    <SignatureFrame>
      <SignatureField {...props} required={required} />
    </SignatureFrame>
  </Question>
);
