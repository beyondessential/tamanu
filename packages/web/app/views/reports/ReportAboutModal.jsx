import React from 'react';
import styled from 'styled-components';
import { Modal, OutlinedButton } from '../../components';
import { Colors } from '../../constants';

const TextContainer = styled.div`
  padding: 15px;
  white-space: pre-wrap;
`;

const StyledButtonRow = styled.div`
  background-color: ${Colors.background};
  border-top: 1px solid ${Colors.outline};
  padding: 30px;
  display: flex;
  justify-content: flex-end;
`;

const CloseButtonRow = ({ onClose }) => (
  <StyledButtonRow>
    <OutlinedButton variant="contained" onClick={onClose}>
      Close
    </OutlinedButton>
  </StyledButtonRow>
);
export const ReportAboutModal = ({ title, open, onClose, content }) => (
  <Modal
    title={title}
    open={open}
    onClose={onClose}
    fixedBottomRow
    bottomRowContent={<CloseButtonRow onClose={onClose} />}
  >
    <TextContainer>{content}</TextContainer>
  </Modal>
);
