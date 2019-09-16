import React from 'react';
import styled from 'styled-components';

const ErrorMessage = styled.div`
  display: block;
  background: red;
  width: 100%;
  height: 100%;
  color: white;
  cursor: pointer;
`;

export class ErrorBoundary extends React.PureComponent {
  state = { error: null };

  showMessage = () => {
    console.log(this.state.error);
  };

  componentDidCatch(error) {
    this.setState({ error });
  }

  render() {
    if (this.state.error) {
      return <ErrorMessage onClick={this.showMessage}>ERROR</ErrorMessage>;
    }

    return this.props.children || null;
  }
}
