import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useApi } from '../../api';
import { getAttachmentUnavailableMessage } from '../../utils';

const Image = styled.img`
  max-width: 35vw;
`;

const ImageContainer = styled.div`
  text-align: center;
  padding-top: 1rem;
`;

export default function PhotoPreview({ attachmentId }) {
  const api = useApi();
  const [imageData, setImageData] = useState();
  const [unavailableMessage, setUnavailableMessage] = useState(null);

  useEffect(() => {
    (async () => {
      if (!attachmentId) {
        return;
      }
      const response = await api.get(`attachment/${attachmentId}`, { base64: true });
      const unavailable = getAttachmentUnavailableMessage(response);
      setUnavailableMessage(unavailable);
      if (unavailable) {
        return;
      }
      setImageData(response.data);
    })();
  }, [api, attachmentId, setImageData]);

  return (
    <ImageContainer data-testid="imagecontainer-ag5w">
      {unavailableMessage ?? (
        <Image src={`data:image/jpeg;base64,${imageData}`} alt="" data-testid="image-znla" />
      )}
    </ImageContainer>
  );
}
