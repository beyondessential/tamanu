import React from 'react';
import { useRenderPDF } from '../../utils/useRenderPDF';
import styled from 'styled-components';
import { LoadingIndicator } from '../LoadingIndicator';

const FullIframe = styled.iframe`
  width: 100%;
  height: 100%;
  min-height: 50vh;
`;

export const WorkerRenderedPDFViewer = (props) => {
  const { url, isFetching, error } = useRenderPDF({
    // need to pass language because in webworker, we can read window.localStorage
    language: window.localStorage.getItem('language'),
    ...props,
  });

  if (isFetching) return <LoadingIndicator height="500px" data-testid="loadingindicator-9zv6" />;
  const src = url ? `${url}#toolbar=0` : null;

  if (error) {
    console.log({ error });
    return <div>{JSON.stringify(error)}</div>;
  }

  return <FullIframe id={props.id} src={src} data-testid="fulliframe-rz3a" />;
};
