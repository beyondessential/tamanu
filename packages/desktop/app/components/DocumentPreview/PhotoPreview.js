import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useApi } from '../../api';

const Image = styled.img`
  max-width: 35vw;
`;

export default function PhotoPreview({ attachmentId }) {
  const api = useApi();
  const [imageData, setImageData] = useState();

  useEffect(() => {
    (async () => {
      if (!attachmentId) {
        return;
      }
      const { data } = await api.get(`attachment/${attachmentId}`, { base64: true });
      setImageData(data);
    })();
  }, [api, attachmentId, setImageData]);

  return <Image src={`data:image/jpeg;base64,${imageData}`} alt="" />;
}
