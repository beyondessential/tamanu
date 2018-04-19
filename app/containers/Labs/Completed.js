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
              Completed Labs
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
