import React from 'react';

import { TouchableWithoutFeedback } from 'react-native';

import { StyledText } from '~/ui/styled/common';

const ErrorView = ({ error }) => (
  <TouchableWithoutFeedback onPress={() => console.warn(error)}>
    <StyledText color="red">
      Error displaying component
    </StyledText>
  </TouchableWithoutFeedback>
);

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

