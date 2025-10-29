import React from 'react';
import styled from 'styled-components';
import { OutlinedButton, Modal, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';

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
  <StyledButtonRow data-testid="styledbuttonrow-xyl4">
    <OutlinedButton variant="contained" onClick={onClose} data-testid="outlinedbutton-2myt">
      <TranslatedText
        stringId="general.action.close"
        fallback="Close"
        data-testid="translatedtext-report-about-modal-close"
      />
    </OutlinedButton>
  </StyledButtonRow>
);
export const ReportAboutModal = ({ title, open, onClose, content }) => (
  <Modal
    title={title}
    open={open}
    onClose={onClose}
    fixedBottomRow
    bottomRowContent={<CloseButtonRow onClose={onClose} data-testid="closebuttonrow-0q3h" />}
    data-testid="modal-oo22"
  >
    <TextContainer data-testid="textcontainer-qqsq">{content}</TextContainer>
  </Modal>
);
