import React, { Component } from 'react';
import { ToastContainer, Slide } from 'react-toastify';
import Sidebar from '../components/Sidebar';

export default class App extends Component<Props> {
  props: Props;

  render() {
    const { children } = this.props;
    return (
      <React.Fragment>
        <Sidebar />
        {children}
        <ToastContainer
          position="top-center"
          autoClose={3000}
          transition={Slide}
        />
      </React.Fragment>
    );
  }
}
