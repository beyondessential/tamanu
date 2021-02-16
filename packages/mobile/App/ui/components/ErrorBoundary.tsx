import React from 'react';

import { StyledText } from '~/ui/styled/common';

const ErrorView = ({ error }) => <StyledText>Error</StyledText>;

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

