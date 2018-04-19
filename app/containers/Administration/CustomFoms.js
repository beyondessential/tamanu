// @flow
import React, { Component } from 'react';

type Props = {};

export default class CustomFoms extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            Custom Forms
          </span>
          <div className="view-action-buttons">
            <button>
              + new form
            </button>
          </div>
        </div>
      </div>
    );
  }
}
