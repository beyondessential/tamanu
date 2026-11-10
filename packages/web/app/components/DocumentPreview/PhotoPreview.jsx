import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useApi } from '../../api';
import { route } from '@tamanu/api-client';

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

  useEffect(() => {
    (async () => {
      if (!attachmentId) {
        return;
      }
      const { data } = await api.get(route('attachment/:attachmentId', { attachmentId }), {
        base64: true,
      });
      setImageData(data);
    })();
  }, [api, attachmentId, setImageData]);

  return (
    <ImageContainer data-testid="imagecontainer-ag5w">
      <Image src={`data:image/jpeg;base64,${imageData}`} alt="" data-testid="image-znla" />
    </ImageContainer>
  );
}
