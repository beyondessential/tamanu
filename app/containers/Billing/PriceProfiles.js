// @flow
import React, { Component } from 'react';

type Props = {};

export default class PriceProfiles extends Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        <div className="content">
          <div className="view-top-bar">
            <span>
              Pricing Profiles
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
