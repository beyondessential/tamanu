// @flow
import React, { Component } from 'react';

type Props = {};

export default class HomePage extends Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        <div className="content">
          <div className="view-top-bar">
            <span>
              Welcome to Tamanu!
            </span>
          </div>
        </div>
      </div>
    );
  }
}
