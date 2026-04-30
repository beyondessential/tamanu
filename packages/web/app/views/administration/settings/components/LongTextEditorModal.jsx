import React from 'react';
import styled from 'styled-components';

import { Modal } from '../../../../components/Modal';
import { Colors } from '../../../../constants';

const StyledModal = styled(Modal)`
  .MuiPaper-root {
    height: 100%;
    display: flex;
    flex-direction: column;
    > :not(.MuiDialogTitle-root) {
      flex: 1;
      display: flex;
      flex-direction: column;
      > :not(.MuiDialogActions-root) {
        display: flex;
        flex-direction: column;
      }
    }
  }
`;

const Title = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const Category = styled.div`
  color: ${Colors.midText};
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
`;

const Description = styled.div`
  font-size: 14px;
  margin-bottom: 12px;
  color: ${Colors.midText};
`;

const StyledTextArea = styled.textarea`
  background: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  color: ${Colors.darkestText};
  flex: 1;
  font-family: inherit;
  font-size: 15px;
  line-height: 1.5;
  padding: 1rem;
  resize: none;

  &:disabled {
    background: ${Colors.background};
  }
`;

export const LongTextEditorModal = React.memo(
  ({ open, onClose, title, category, description, value, onChange, readOnly }) => (
    <StyledModal
      open={open}
      onClose={onClose}
      width="lg"
      title={
        <Title data-testid="longtexteditormodal-title">
          <span>{title}</span>
          {category && <Category data-testid="longtexteditormodal-category">{category}</Category>}
        </Title>
      }
      data-testid="longtexteditormodal-modal"
    >
      {description && <Description data-testid="longtexteditormodal-desc">{description}</Description>}
      <StyledTextArea
        value={value ?? ''}
        onChange={event => onChange(event.target.value)}
        disabled={readOnly}
        data-testid="longtexteditormodal-textarea"
      />
    </StyledModal>
  ),
);
