// @flow
import React, { Component } from 'react';

type Props = {};

export default class Invoices extends Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        <div className="content">
          <div className="view-top-bar">
            <span>
              Billed Invoices
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
