import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';

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
  const logError = React.useCallback(() => {
    console.log(error);
  });
  const logState = React.useCallback(() => {
    console.log(state);
  });

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

const ErrorView = connect(state => ({ state }))(DumbErrorView);

export class ErrorBoundary extends React.PureComponent {
  state = { error: null };

  componentDidCatch(error) {
    this.setState({ error });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.errorKey !== this.props.errorKey) {
      this.setState({ error: null });
    }
  }

  render() {
    const { ErrorComponent = ErrorView } = this.props;
    const { error } = this.state;
    if (error) {
      return <ErrorComponent error={error} />;
    }

    return this.props.children || null;
  }
}
