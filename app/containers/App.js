import React, { Component } from 'react';
import Sidebar from '../components/Sidebar';

export default class App extends Component<Props> {
  props: Props;

  render() {
    const { children } = this.props;
    return (
      <React.Fragment>
        <Sidebar />
        {children}
      </React.Fragment>
    );
  }
}
