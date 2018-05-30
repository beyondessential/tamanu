import React, { Component } from 'react';
import Sidebar from '../components/Sidebar';

export default class App extends Component {
  render() {
    return (
      <div>
        <Sidebar />
        {this.props.children}
      </div>
    );
  }
}
