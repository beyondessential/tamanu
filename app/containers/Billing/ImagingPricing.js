import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class ImagingPricing extends Component {
  render() {
    console.log('rendered');
    return (
      <div>
        <div className="content">
          <div className="view-top-bar">
            <span>
              Imaging Pricing
            </span>
            <div className="view-action-buttons">
              <button>
                + New Item
              </button>
            </div>
          </div>
          <div className="detail">
            <div className="tabs-container">
              <Link to="/invoices/pricing" replace>
                All Pricing Items
              </Link>
              <Link to="/invoices/pricing/imaging" replace>
                Imaging Pricing
              </Link>
              <Link to="/invoices/pricing/lab" replace>
                Lab Pricing
              </Link>
              <Link to="/invoices/pricing/procedure" replace>
                Procedure Pricing
              </Link>
              <Link to="/invoices/pricing/ward" replace>
                Ward Pricing
              </Link>
              <Link to="/invoices/pricing/profiles" replace>
                Pricing Profiles
              </Link>
            </div>
            <div className="bill-notification">
              <span>
                No pricing items found. <Link to="/invoices/pricing/edit/new">Create a new record?</Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ImagingPricing;
