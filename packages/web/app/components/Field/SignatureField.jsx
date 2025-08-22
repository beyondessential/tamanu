import React, { useRef, useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Box, Button as MuiButton } from '@material-ui/core';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { TranslatedText } from '../Translation/TranslatedText';
import { Colors } from '../../constants';

const SignatureCanvas = styled.canvas`
  border: 2px solid ${Colors.outline};
  border-radius: 3px;
  cursor: crosshair;
  background-color: ${Colors.white};
  touch-action: none;
`;

const ButtonContainer = styled(Box)`
  margin-top: 0.5rem;
  display: flex;
  gap: 1rem;
`;

const StyledButton = styled(MuiButton)`
  min-width: 100px;
  font-size: 14px;
  font-weight: 500;
`;

const SignaturePreview = styled.div`
  border: 2px solid ${Colors.outline};
  border-radius: 3px;
  background-color: ${Colors.white};
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 150px;
  object-fit: contain;
`;

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 150;

export const SignatureInput = ({
  value = '',
  onChange,
  label,
  disabled = false,
  ...props
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureData, setSignatureData] = useState('');

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Clear canvas with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  // Load existing signature if value exists
  useEffect(() => {
    if (value && typeof value === 'string' && value.startsWith('data:image')) {
      setSignatureData(value);
      setHasSignature(true);
    } else if (value) {
      // If we have a file object, convert it to data URL
      if (value instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setSignatureData(e.target.result);
          setHasSignature(true);
        };
        reader.readAsDataURL(value);
      } else {
        setHasSignature(false);
        setSignatureData('');
      }
    } else {
      setHasSignature(false);
      setSignatureData('');
    }
  }, [value]);

  const getMousePos = useCallback((canvas, e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, []);

  const getTouchPos = useCallback((canvas, e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY
    };
  }, []);

  const startDrawing = useCallback((e) => {
    if (disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    
    const pos = e.type.includes('touch') ? getTouchPos(canvas, e) : getMousePos(canvas, e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    
    // Prevent scrolling on touch devices
    e.preventDefault();
  }, [disabled, getMousePos, getTouchPos]);

  const draw = useCallback((e) => {
    if (!isDrawing || disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const pos = e.type.includes('touch') ? getTouchPos(canvas, e) : getMousePos(canvas, e);
    
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    // Prevent scrolling on touch devices
    e.preventDefault();
  }, [isDrawing, disabled, getMousePos, getTouchPos]);

  const stopDrawing = useCallback((e) => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    setHasSignature(true);
    
    // Prevent scrolling on touch devices
    e.preventDefault();
  }, [isDrawing]);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    setHasSignature(false);
    setSignatureData('');
    onChange({ target: { value: '' } });
  }, [onChange]);

  const confirmSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    // Convert canvas to blob and then to File object
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'signature.png', { type: 'image/png' });
        onChange({ target: { value: file } });
        
        // Also store as data URL for preview
        const dataURL = canvas.toDataURL('image/png');
        setSignatureData(dataURL);
      }
    }, 'image/png');
  }, [hasSignature, onChange]);

  if (signatureData && !disabled) {
    return (
      <OuterLabelFieldWrapper label={label} {...props}>
        <SignaturePreview>
          <PreviewImage src={signatureData} alt="Signature" />
        </SignaturePreview>
        <ButtonContainer>
          <StyledButton
            variant="outlined"
            color="primary"
            onClick={clearSignature}
          >
            <TranslatedText
              stringId="general.questionComponent.signatureField.clear"
              fallback="Clear"
            />
          </StyledButton>
        </ButtonContainer>
      </OuterLabelFieldWrapper>
    );
  }

  return (
    <OuterLabelFieldWrapper label={label} {...props}>
      <SignatureCanvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ 
          width: '100%', 
          maxWidth: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`
        }}
      />
      <ButtonContainer>
        <StyledButton
          variant="outlined"
          color="primary"
          onClick={clearSignature}
          disabled={!hasSignature}
        >
          <TranslatedText
            stringId="general.questionComponent.signatureField.clear"
            fallback="Clear"
          />
        </StyledButton>
        <StyledButton
          variant="contained"
          color="primary"
          onClick={confirmSignature}
          disabled={!hasSignature}
        >
          <TranslatedText
            stringId="general.questionComponent.signatureField.confirm"
            fallback="Confirm"
          />
        </StyledButton>
      </ButtonContainer>
    </OuterLabelFieldWrapper>
  );
};

export const SignatureField = ({ field, ...props }) => (
  <SignatureInput
    value={field.value || ''}
    onChange={field.onChange}
    {...props}
  />
);