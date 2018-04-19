// @flow
import React, { Component } from 'react';

type Props = {};

export default class IncidentCategories extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            Incident Categories
          </span>
          <div className="view-action-buttons">
            <button>
              + new category
            </button>
          </div>
        </div>
      </div>
    );
  }
}
