import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { TAMANU_COLORS } from '../../constants/colors';
import {
  SIGNATURE_VIEWBOX_HEIGHT,
  SIGNATURE_VIEWBOX_WIDTH,
  strokesToCombinedPath,
} from '../../utils/signaturePath';
import { SignaturePathDisplay } from '../SignaturePathDisplay';
import { Button } from '../Button';
import { TranslatedText } from '../Translation';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PadWrapper = styled.div`
  aspect-ratio: ${SIGNATURE_VIEWBOX_WIDTH} / ${SIGNATURE_VIEWBOX_HEIGHT};
  background-color: ${TAMANU_COLORS.white};
  border-radius: ${props => props.theme.shape.borderRadius}px;
  border: 1px solid ${p => p.theme.palette.divider};
  cursor: crosshair;
  inline-size: 100%;
  max-width: ${SIGNATURE_VIEWBOX_WIDTH}px;
  position: relative;
  &:focus {
    border-color: ${p => p.theme.palette.primary.main};
  }
  &[aria-disabled='true'] {
    cursor: default;
  }
`;

const PadSvg = styled.svg`
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: ${SIGNATURE_VIEWBOX_WIDTH} / ${SIGNATURE_VIEWBOX_HEIGHT};
  touch-action: none;
  user-select: none;
`;

const DrawingLayer = styled(PadSvg)`
  position: absolute;
  inset: 0;
`;

const EmptyOverlay = styled.div`
  place-items: center;
  color: ${TAMANU_COLORS.softText};
  display: flex;
  flex-direction: column;
  font-size: 14px;
  gap: 4px;
  inset: 0;
  padding: 8px;
  pointer-events: none;
  position: absolute;
  text-align: center;
`;

const InstructionText = styled.div`
  font-size: 12px;
  color: ${TAMANU_COLORS.midText};
`;

const ClearRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const HiddenInput = styled.input.attrs({ type: 'text' })`
  display: none;
`;

const clientPointToViewBox = (clientX, clientY, rect) => {
  const x = ((clientX - rect.left) / rect.width) * SIGNATURE_VIEWBOX_WIDTH;
  const y = ((clientY - rect.top) / rect.height) * SIGNATURE_VIEWBOX_HEIGHT;
  return { x, y, pressure: 0.5 };
};

export const SignatureField = ({ field, disabled }) => {
  const value = field.value || '';
  const padRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [sessionStrokes, setSessionStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);
  const isDrawingRef = useRef(false);

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
    if (disabled) {
      return;
    }
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
    if (disabled || !isFocused) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = padRef.current.getBoundingClientRect();
    const point = clientPointToViewBox(event.clientX, event.clientY, rect);
    isDrawingRef.current = true;
    setCurrentStroke([point]);
  };

  const handlePointerMove = event => {
    if (!isDrawingRef.current || !isFocused) {
      return;
    }
    event.preventDefault();
    const rect = padRef.current.getBoundingClientRect();
    const point = clientPointToViewBox(event.clientX, event.clientY, rect);
    setCurrentStroke(prev => [...(prev || []), point]);
  };

  const finishStroke = () => {
    if (!isDrawingRef.current) {
      return;
    }
    isDrawingRef.current = false;
    setCurrentStroke(stroke => {
      if (stroke?.length) {
        setSessionStrokes(prev => [...prev, stroke]);
      }
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
    <Container data-testid="signaturefield-container">
      <HiddenInput
        {...field}
        data-testid="signaturefield-input"
        disabled={disabled}
        readOnly
        type="text"
        value={value}
      />
      <PadWrapper
        ref={padRef}
        $focused={isFocused}
        $hasValue={Boolean(value || sessionPreviewPath)}
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
            viewBox={`0 0 ${SIGNATURE_VIEWBOX_WIDTH} ${SIGNATURE_VIEWBOX_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={finishStroke}
            data-testid="signaturefield-svg"
          />
        )}
        {isActive && value && (
          <>
            <SignaturePathDisplay path={value} data-testid="signaturefield-saved" />
            <DrawingLayer
              viewBox={`0 0 ${SIGNATURE_VIEWBOX_WIDTH} ${SIGNATURE_VIEWBOX_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={finishStroke}
              data-testid="signaturefield-svg"
            >
              {sessionPreviewPath && (
                <path d={sessionPreviewPath} fill={TAMANU_COLORS.darkestText} />
              )}
            </DrawingLayer>
          </>
        )}
        {isActive && !value && sessionPreviewPath && (
          <PadSvg
            viewBox={`0 0 ${SIGNATURE_VIEWBOX_WIDTH} ${SIGNATURE_VIEWBOX_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={finishStroke}
            data-testid="signaturefield-svg"
          >
            <path d={sessionPreviewPath} fill={TAMANU_COLORS.darkestText} />
          </PadSvg>
        )}
        {showEmptyOverlay && (
          <EmptyOverlay data-testid="signaturefield-empty">
            <TranslatedText stringId="program.question.signature.emptyHint" fallback="Sign here" />
            <InstructionText>
              <TranslatedText
                stringId="program.question.signature.instruction"
                fallback="Use your mouse or trackpad to add signature."
              />
            </InstructionText>
          </EmptyOverlay>
        )}
      </PadWrapper>
      <ClearRow>
        <Button
          variant="text"
          color="primary"
          size="small"
          onClick={handleClear}
          disabled={disabled || (!value && !sessionPreviewPath && !currentStroke?.length)}
          data-testid="signaturefield-clear"
        >
          <TranslatedText stringId="general.action.clear" fallback="Clear" />
        </Button>
      </ClearRow>
    </Container>
  );
};
