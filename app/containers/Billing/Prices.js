// @flow
import React, { Component } from 'react';

type Props = {};

export default class Prices extends Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        <div className="content">
          <div className="view-top-bar">
            <span>
              All Pricing Items
            </span>
            <div className="view-action-buttons">
              <button>
                + New Item
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
