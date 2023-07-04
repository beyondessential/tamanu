import React from 'react';
import styled from 'styled-components';

import { InfoButton } from './InfoButton';
import { Modal } from './Modal';

const FullSizeImg = styled.img`
  max-width: 100%;
  max-height: 100%;
`;

export const InfoModal = React.memo(({ children, width }) => {
  const [isOpen, setOpen] = React.useState();

  return (
    <>
      <InfoButton onClick={() => setOpen(true)} />
      <Modal open={isOpen} width={width} onClose={() => setOpen(false)}>
        {children}
      </Modal>
    </>
  );
});

export const ImageInfoModal = React.memo(({ src }) => (
  <InfoModal width="lg">
    <FullSizeImg src={src} />
  </InfoModal>
));
