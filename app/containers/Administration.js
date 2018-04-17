// @flow
import React, { Component } from 'react';
import Sidebar from '../components/Sidebar';

type Props = {};

export default class Adminstration extends Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        <Sidebar />
        <div className="content">
          <div className="view-top-bar">
            <span>
              Lookup Lists
            </span>
          </div>
        </div>
      </div>
    );
  }
}
