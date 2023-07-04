import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { connectApi } from '../api';
import { getImageSourceFromData } from '../utils';
import { Modal } from './Modal';
import { TextButton } from './Button';

const Image = styled.img`
  display: block;
  margin: 0 auto;
  width: 400px;
`;

export const ViewPhotoLinkComponent = React.memo(({ imageId, fetchImage }) => {
  const [showModal, setShowModal] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
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
      const { data } = await fetchImage(imageId);
      setImageData(data);
      setErrorMessage(null);
    } catch (error) {
      setImageData(null);
      setErrorMessage(`Error: ${error.message}`);
    }

    setShowModal(true);
  }, [fetchImage, imageId]);

  return (
    <>
      <TextButton color="blue" onClick={openModalCallback}>
        View Image
      </TextButton>
      <Modal title="Image" open={showModal} onClose={() => setShowModal(false)}>
        {imageData && !errorMessage ? (
          <Image src={getImageSourceFromData(imageData)} />
        ) : (
          <p>{errorMessage}</p>
        )}
      </Modal>
    </>
  );
});

export const ViewPhotoLink = connectApi(api => ({
  fetchImage: id => api.get(`attachment/${id}`, { base64: true }),
}))(ViewPhotoLinkComponent);
