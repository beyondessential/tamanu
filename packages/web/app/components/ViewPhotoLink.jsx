import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { useApi } from '../api';
import { getImageSourceFromData } from '../utils';
import { Modal } from './Modal';
import { TextButton } from './Button';
import { TranslatedText } from './Translation/TranslatedText';

const Image = styled.img`
  display: block;
  margin: 0 auto;
  width: 400px;
`;

export const ViewPhotoLink = ({ imageId }) => {
  const [showModal, setShowModal] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const api = useApi();
  const openModalCallback = useCallback(async () => {
    if (!navigator.onLine) {
      setImageData(null);
      setErrorMessage(
        'You do not currently have an internet connection. Images require live internet for viewing.',
      );
      setShowModal(true);
      return;
    }

    try {
      const { data } = await api.get(`attachment/${imageId}`, { base64: true });
      setImageData(data);
      setErrorMessage(null);
    } catch (error) {
      setImageData(null);
      setErrorMessage(`Error: ${error.message}`);
    }

    setShowModal(true);
  }, [api, imageId]);

  return (
    <>
      <TextButton color="blue" onClick={openModalCallback} data-testid='textbutton-tcgm'>
        <TranslatedText
          stringId="program.modal.view.action.viewImage"
          fallback="View Image"
          data-testid='translatedtext-c3b1' />
      </TextButton>
      <Modal title="Image" open={showModal} onClose={() => setShowModal(false)}>
        {imageData && !errorMessage ? (
          <Image src={getImageSourceFromData(imageData)} />
        ) : (
          <p data-testid='p-lccq'>{errorMessage}</p>
        )}
      </Modal>
    </>
  );
};
