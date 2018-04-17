// @flow
import React, { Component } from 'react';
import Sidebar from '../components/Sidebar';

type Props = {};

export default class Billing extends Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        <Sidebar />
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
