// @flow
import React, { Component } from 'react';

type Props = {};

export default class Completed extends Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        <div className="content">
          <div className="view-top-bar">
            <span>
              Completed Imaging
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
