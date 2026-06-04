import { FormHelperText, Typography } from '@mui/material';
import React, { useCallback, useId, useRef, useState } from 'react';
import styled from 'styled-components';

import { useTranslation } from '../../../contexts';
import { SIGNATURE_TOO_COMPLEX_STRING_ID } from '../../../utils/survey';
import { TextButton } from '../../Button';
import { TranslatedText } from '../../Translation';
import {
  bodyToDisplayPath,
  mergeStrokesIntoBody,
  SIGNATURE_VIEWBOX_HEIGHT,
  SIGNATURE_VIEWBOX_WIDTH,
} from './pathUtils';
import { SignaturePathDisplay, SignatureSvg } from './SignaturePathDisplay';
import { RequiredOrnament } from '../..';

const Label = styled.label`
  color: ${p => p.theme.palette.text.secondary};
  display: inline-block;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  margin-block-end: 4px;
`;

const Container = styled.div.attrs({ 'data-testid': 'signaturefield-container' })`
  border-radius: ${p => p.theme.shape.borderRadius}px;
  border: 1px solid ${p => p.theme.palette.divider};
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
`;

const PadWrapper = styled.div.attrs({ 'data-testid': 'signaturefield-pad' })`
  aspect-ratio: ${SIGNATURE_VIEWBOX_WIDTH} / ${SIGNATURE_VIEWBOX_HEIGHT};
  background-color: ${p => p.theme.palette.background.default};
  border-radius: ${p => p.theme.shape.borderRadius}px;
  border: 1px solid ${p => p.theme.palette.divider};
  position: relative;
  width: min(100%, ${SIGNATURE_VIEWBOX_WIDTH}px);
  &:focus {
    background-color: ${p => p.theme.palette.background.paper};
    border-color: ${p => p.theme.palette.primary.main};
    cursor: crosshair;
    outline-style: none;
  }
  &[aria-disabled='true'] {
    cursor: default;
  }
`;

const DrawingLayer = styled(SignatureSvg)`
  inset: 0;
  position: absolute;
  touch-action: none;
  user-select: none;
  width: 100%;
`;

const EmptyOverlay = styled.div.attrs({ 'data-testid': 'signaturefield-empty-overlay' })`
  color: ${p => p.theme.palette.text.tertiary};
  display: grid;
  inset: 0;
  place-items: center;
  pointer-events: none;
  position: absolute;
  text-align: center;
  text-wrap: balance;
`;

const InstructionText = styled(Typography).attrs({
  color: 'textSecondary',
  variant: 'body2',
})``;

const ClearButton = styled(TextButton).attrs({
  'data-testid': 'signaturefield-clear',
  children: <TranslatedText stringId="general.action.clear" fallback="Clear" />,
  color: 'primary',
})`
  font-size: inherit;
  line-height: 1.75;
  margin-inline-end: auto;
`;

function HiddenInput(props) {
  return <input data-testid="signaturefield-input" hidden readOnly type="text" {...props} />;
}

const clientPointToViewBox = (clientX, clientY, rect) => {
  const x = ((clientX - rect.left) / rect.width) * SIGNATURE_VIEWBOX_WIDTH;
  const y = ((clientY - rect.top) / rect.height) * SIGNATURE_VIEWBOX_HEIGHT;
  return { x, y };
};

export function SignatureField({ disabled, error, field, helperText, label, required }) {
  const value = field.value || '';
  const padRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [sessionStrokes, setSessionStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);
  const isDrawingRef = useRef(false);
  const { getTranslation } = useTranslation();
  const helperTextId = useId();

  const setValue = useCallback(
    nextValue => {
      field.onChange({ target: { name: field.name, value: nextValue } });
    },
    [field],
  );

  const commitSessionToValue = useCallback(() => {
    if (!sessionStrokes.length) return;

    const combined = mergeStrokesIntoBody(value, sessionStrokes);
    setValue(combined);
    setSessionStrokes([]);
  }, [sessionStrokes, setValue, value]);

  const handleFocus = () => {
    if (disabled) return;
    setIsFocused(true);
  };

  const handleBlur = event => {
    if (padRef.current?.contains(event.relatedTarget)) return;

    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      setCurrentStroke(null);
    }
    commitSessionToValue();
    setIsFocused(false);
    field.onBlur({ target: { name: field.name } });
  };

  const handleClear = () => {
    setValue('');
    setSessionStrokes([]);
    setCurrentStroke(null);
    isDrawingRef.current = false;
  };

  const handlePointerDown = event => {
    if (disabled || !isFocused || event.button !== 0 /* left click only */) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = padRef.current.getBoundingClientRect();
    const point = clientPointToViewBox(event.clientX, event.clientY, rect);
    isDrawingRef.current = true;
    setCurrentStroke([point]);
  };

  const handlePointerMove = event => {
    if (!isDrawingRef.current || !isFocused) return;

    event.preventDefault();
    const rect = padRef.current.getBoundingClientRect();
    const point = clientPointToViewBox(event.clientX, event.clientY, rect);
    setCurrentStroke(prev => [...(prev ?? []), point]);
  };

  const finishStroke = () => {
    if (!isDrawingRef.current) return;

    isDrawingRef.current = false;
    setCurrentStroke(stroke => {
      if (stroke?.length) setSessionStrokes(prev => [...prev, stroke]);
      return null;
    });
  };

  const handlePointerUp = event => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    finishStroke();
  };

  const sessionPreviewPath = bodyToDisplayPath(
    mergeStrokesIntoBody(value, [
      ...sessionStrokes,
      ...(currentStroke?.length ? [currentStroke] : []),
    ]),
  );

  const showEmptyOverlay = !value && !sessionPreviewPath;
  const isActive = isFocused && !disabled;

  return (
    <>
      <Label>
        {label}
        {required && <RequiredOrnament />}
        <HiddenInput {...field} disabled={disabled} required={required} value={value} />
      </Label>
      <Container aria-describedby={helperTextId}>
        <InstructionText>
          <TranslatedText
            stringId="program.question.signature.instruction"
            fallback="Use your mouse or trackpad to add signature"
          />
        </InstructionText>

        <PadWrapper
          ref={padRef}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          {/*
           * Note two `path`s are drawn:
           * - `value` has already been flushed to the <input>.
           * - `sessionPreviewPath` is transient; it gets merged with `value` on blur.
           */}
          {value && <SignaturePathDisplay path={value} />}
          {isActive && (
            <DrawingLayer
              onPointerCancel={finishStroke}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {sessionPreviewPath && <path d={sessionPreviewPath} />}
            </DrawingLayer>
          )}
          {showEmptyOverlay && (
            <EmptyOverlay>
              <TranslatedText
                stringId="program.question.signature.emptyHint"
                fallback="Sign here"
              />
            </EmptyOverlay>
          )}
        </PadWrapper>
        <ClearButton
          onClick={handleClear}
          disabled={disabled || (!value && !sessionPreviewPath && !currentStroke?.length)}
        />
      </Container>
      {helperText && (
        <FormHelperText error={Boolean(error)} id={helperTextId}>
          {error && helperText === SIGNATURE_TOO_COMPLEX_STRING_ID ? (
            <TranslatedText
              stringId={SIGNATURE_TOO_COMPLEX_STRING_ID}
              fallback="Signature too complex to save. Please try again."
            />
          ) : (
            helperText
          )}
        </FormHelperText>
      )}
    </>
  );
}
