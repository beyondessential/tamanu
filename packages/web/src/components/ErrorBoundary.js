import React, { useCallback } from 'react';
import styled from 'styled-components';

import { ContentPane } from './ContentPane';

const DebugInfo = styled.pre`
  max-height: 10rem;
  max-width: 50rem;
  overflow: scroll;
  padding: 1rem;
  border: 1px solid grey;
  background: #fff;
  color: #000;
`;

const DumbErrorView = React.memo(({ error, state }) => {
  const logError = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log(error);
  }, [error]);
  const logState = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log(state);
  }, [state]);

  return (
    <ContentPane>
      <h2>Oops!</h2>
      <p>The application encountered an error when trying to display this information.</p>
      <p>The message of the error is:</p>
      <DebugInfo onClick={logError}>{error.message}</DebugInfo>
      <p>The stack of the error are:</p>
      <DebugInfo onClick={logError}>{error.stack}</DebugInfo>
      <p>The contents of the application state are:</p>
      <DebugInfo onClick={logState}>{JSON.stringify(state, null, 2)}</DebugInfo>
    </ContentPane>
  );
});

const ErrorView = DumbErrorView;

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
      return <ErrorComponent error={error} />;
    }

    return children || null;
  }
}
