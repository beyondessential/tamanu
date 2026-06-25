import React from 'react';
import { useRenderPDF } from '../../utils/useRenderPDF';
import styled from 'styled-components';
import CircularProgress from '@material-ui/core/CircularProgress';
import { LoadingIndicator } from '../LoadingIndicator';
import { TranslatedText } from '../Translation/TranslatedText';

const FullIframe = styled.iframe`
  width: 100%;
  height: 100%;
  min-height: 50vh;
`;

const ErrorMessage = styled.div`
  padding: 2rem;
  text-align: center;
`;

const ProgressContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;
`;

const ProgressWrapper = styled.div`
  position: relative;
  display: inline-flex;
`;

const ProgressLabel = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
`;

export const WorkerRenderedPDFViewer = (props) => {
  const { url, isFetching, error, progress } = useRenderPDF({
    // need to pass language because in webworker, we can read window.localStorage
    language: window.localStorage.getItem('language'),
    ...props,
  });

  if (isFetching) {
    // Progress is only reported for multi-wave renders (see renderPlanToBlob); anything that
    // finishes in a single pool wave — and any single-document render — shows the plain spinner.
    const percent =
      progress && progress.total > 1
        ? Math.round((progress.completed / progress.total) * 100)
        : null;
    if (percent === null) {
      return <LoadingIndicator height="500px" data-testid="loadingindicator-9zv6" />;
    }
    // At 0% there's no arc to show, so spin indeterminately until the first chunk lands; after
    // that, show the determinate ring with the percentage in its centre.
    const isDeterminate = percent > 0;
    return (
      <ProgressContainer data-testid="pdfprogress-cont">
        <ProgressWrapper>
          <CircularProgress
            variant={isDeterminate ? 'determinate' : 'indeterminate'}
            value={isDeterminate ? percent : undefined}
            size="5rem"
          />
          {isDeterminate && (
            <ProgressLabel data-testid="pdfprogress-pct">{percent}%</ProgressLabel>
          )}
        </ProgressWrapper>
      </ProgressContainer>
    );
  }

  const src = url ? `${url}#toolbar=0` : null;

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to render PDF', error);
    return (
      <ErrorMessage>
        <TranslatedText
          stringId="pdf.render.error"
          fallback="The document could not be generated. Please try again, and contact your system administrator if the problem persists."
        />
      </ErrorMessage>
    );
  }

  return <FullIframe id={props.id} src={src} data-testid="fulliframe-rz3a" />;
};
