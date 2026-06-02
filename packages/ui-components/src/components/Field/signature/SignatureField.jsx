import { FormControlLabel, FormHelperText, Typography } from '@mui/material';
import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';

import { useTranslation } from '../../../contexts';
import { TextButton } from '../../Button';
import { TranslatedText } from '../../Translation';
import {
  SIGNATURE_VIEWBOX,
  SIGNATURE_VIEWBOX_HEIGHT,
  SIGNATURE_VIEWBOX_WIDTH,
  strokesToCombinedPath,
} from './pathUtils';
import { SignaturePathDisplay, SignatureSvg } from './SignaturePathDisplay';

const Container = styled.div.attrs({ 'data-testid': 'signaturefield-container' })`
  border-radius: ${p => p.theme.shape.borderRadius}px;
  border: 1px solid ${p => p.theme.palette.divider};
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
`;

const RequiredOrnament = styled.span`
  color: ${p => p.theme.palette.error.main};
  &::after {
    content: '*' / ${p => p.altText};
  }
`;

const PadWrapper = styled.div`
  border: 1px solid orange;
  aspect-ratio: ${SIGNATURE_VIEWBOX_WIDTH} / ${SIGNATURE_VIEWBOX_HEIGHT};
  background-color: ${p => p.theme.palette.background.default};
  border-radius: ${p => p.theme.shape.borderRadius}px;
  border: 1px solid ${p => p.theme.palette.divider};
  cursor: crosshair;
  inline-size: 100%;
  max-width: ${SIGNATURE_VIEWBOX_WIDTH}px;
  position: relative;
  &:focus {
    background-color: ${p => p.theme.palette.background.paper};
    border-color: ${p => p.theme.palette.primary.main};
  }
  &[aria-disabled='true'] {
    cursor: default;
  }
`;

const PadSvg = styled(SignatureSvg).attrs({
  'data-testid': 'signaturefield-svg',
})`
  touch-action: none;
  user-select: none;
`;

const DrawingLayer = styled(PadSvg).attrs({
  'data-testid': 'signaturefield-svg',
  preserveAspectRatio: 'xMidYMid meet',
  viewBox: SIGNATURE_VIEWBOX,
})`
  inset: 0;
  position: absolute;
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

/**
 * @param {Object} props
 * @param {Object} props.field
 * @param {boolean | undefined} props.disabled
 */
export const SignatureField = ({ disabled, error, field, helperText, label, required }) => {
  const value = field.value || '';
  const padRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [sessionStrokes, setSessionStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);
  const isDrawingRef = useRef(false);
  const { getTranslation } = useTranslation();

  const setValue = useCallback(
    nextValue => {
      field.onChange({ target: { name: field.name, value: nextValue } });
    },
    [field],
  );

  const commitSessionToValue = useCallback(() => {
    if (!sessionStrokes.length) {
      return;
    }
    const combined = strokesToCombinedPath(value, sessionStrokes);
    setValue(combined);
    setSessionStrokes([]);
  }, [sessionStrokes, setValue, value]);

  const handleFocus = () => {
    if (disabled) return;
    setIsFocused(true);
  };

  const handleBlur = event => {
    if (padRef.current?.contains(event.relatedTarget)) {
      return;
    }
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      setCurrentStroke(null);
    }
    commitSessionToValue();
    setIsFocused(false);
    field.onBlur(event);
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
    setCurrentStroke(prev => [...(prev || []), point]);
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

  const sessionPreviewPath = strokesToCombinedPath('', [
    ...sessionStrokes,
    ...(currentStroke?.length ? [currentStroke] : []),
  ]);

  const showEmptyOverlay = isFocused && !value && !sessionPreviewPath;
  const isActive = isFocused && !disabled;

  return (
    <>
      <FormControlLabel
        control={<HiddenInput {...field} disabled={disabled} value={value} />}
        label={
          <>
            {label}
            {required && (
              <RequiredOrnament altText={getTranslation('general.label.required', 'Required')} />
            )}
          </>
        }
      />
      <Container>
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
          data-testid="signaturefield-pad"
        >
          {value && !isActive && (
            <SignaturePathDisplay path={value} data-testid="signaturefield-saved" />
          )}
          {isActive && !value && !sessionPreviewPath && (
            <PadSvg
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={finishStroke}
            />
          )}
          {isActive && value && (
            <>
              <SignaturePathDisplay path={value} />
              <DrawingLayer
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={finishStroke}
              >
                {sessionPreviewPath && <path d={sessionPreviewPath} />}
              </DrawingLayer>
            </>
          )}
          {isActive && !value && sessionPreviewPath && (
            <PadSvg
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={finishStroke}
            >
              <path d={sessionPreviewPath} />
            </PadSvg>
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
        <FormHelperText data-testid="nullable-boolean-field-formhelpertext" error={Boolean(error)}>
          {helperText}
        </FormHelperText>
      )}
    </>
  );
};
