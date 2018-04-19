// @flow
import React, { Component } from 'react';

type Props = {};

export default class Requests extends Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        <div className="content">
          <div className="view-top-bar">
            <span>
              Lab Requests
            </span>
            <div className="view-action-buttons">
              <button>
                + New Lab
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
