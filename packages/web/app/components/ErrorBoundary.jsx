import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

import { ContentPane } from './ContentPane';
import { TranslatedText } from './Translation/TranslatedText';

const DebugInfo = styled.pre`
  max-height: 10rem;
  max-width: 50rem;
  overflow: scroll;
  padding: 1rem;
  border: 1px solid grey;
  background: #fff;
  color: #000;
`;

export const ErrorView = React.memo(({ error }) => {
  const reduxState = useSelector(state => state);
  const logError = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log(error);
  }, [error]);
  const logState = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log({ reduxState });
  }, [reduxState]);

  return (
    <ContentPane data-testid="contentpane-3cof">
      <h2>
        <TranslatedText
          stringId="error.boundary.title"
          fallback="Oops!"
          data-testid="translatedtext-error-title"
        />
      </h2>
      <p>
        <TranslatedText
          stringId="error.boundary.description"
          fallback="The application encountered an error when trying to display this information."
          data-testid="translatedtext-error-description"
        />
      </p>
      <p>
        <TranslatedText
          stringId="error.boundary.message"
          fallback="The message of the error is:"
          data-testid="translatedtext-error-message"
        />
      </p>
      <DebugInfo onClick={logError} data-testid="debuginfo-4a5k">
        {error.message}
      </DebugInfo>
      <p>
        <TranslatedText
          stringId="error.boundary.stack"
          fallback="The stack of the error is:"
          data-testid="translatedtext-error-stack"
        />
      </p>
      <DebugInfo onClick={logError} data-testid="debuginfo-dnuz">
        {error.stack}
      </DebugInfo>
      <p>
        <TranslatedText
          stringId="error.boundary.state"
          fallback="The contents of the application state are:"
          data-testid="translatedtext-error-state"
        />
      </p>
      <DebugInfo onClick={logState} data-testid="debuginfo-w6d2">
        {JSON.stringify({ reduxState }, null, 2)}
      </DebugInfo>
    </ContentPane>
  );
});

export class ErrorBoundary extends React.PureComponent {
  static getDerivedStateFromProps(props, state) {
    const { errorKey } = props;
    const { lastErrorKey, error } = state;
    const didErrorKeyChange = !lastErrorKey || lastErrorKey !== errorKey;
    return {
      lastErrorKey: errorKey,
      error: didErrorKeyChange ? null : error,
    };
  }

  constructor() {
    super();
    this.state = { error: null, lastErrorKey: null };
  }

  componentDidCatch(error) {
    this.setState({ error });
  }

  render() {
    const { ErrorComponent = ErrorView, children } = this.props;
    const { error } = this.state;
    if (error) {
      return <ErrorComponent error={error} data-testid="errorcomponent-puxl" />;
    }

    return children || null;
  }
}
