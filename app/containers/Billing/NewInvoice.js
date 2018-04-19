// @flow
import React, { Component } from 'react';

type Props = {};

export default class NewInvoice extends Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        <div className="content">
          <div className="view-top-bar">
            <span>
              New Invoice
            </span>
            <div className="view-action-buttons">
              <button>
                + New Invoice
              </button>
              <button>
                + Add Deposit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
