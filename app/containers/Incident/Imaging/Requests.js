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
              Imaging Requests
            </span>
            <div className="view-action-buttons">
              <button>
                + New Imaging
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
