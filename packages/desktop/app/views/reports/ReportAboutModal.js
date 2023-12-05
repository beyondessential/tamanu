import React from 'react';
import styled from 'styled-components';
import { BodyText, Modal, OutlinedButton } from '../../components';
import { Colors } from '../../constants';

const TextContainer = styled.div`
  padding: 15px;
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
    cornerExitButton={false}
    fixedBottomRow
    bottomRowContent={<CloseButtonRow onClose={onClose} />}
  >
    <TextContainer>
      {content.split('\n').map(line => (line === '' ? <br /> : <BodyText>{line}</BodyText>))}
    </TextContainer>
  </Modal>
);
