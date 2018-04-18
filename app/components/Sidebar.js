import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { sidebarInfo } from '../constants';

const classNames = require('classnames');

export default class Sidebar extends Component {
  state = {
    selectedParentItem: '',
    selectedChildItem: ''
  }

  clickedParentItem = (label) => {
    const { selectedParentItem } = this.state;
    if (selectedParentItem !== label) {
      this.setState({ selectedParentItem: label });
    } else {
      this.setState({ selectedParentItem: '' });
    }
  }

  clickedChildItem = (parent, child) => {
    const { selectedParentItem, selectedChildItem } = this.state;
    if (selectedParentItem !== parent) {
      this.setState({
        selectedParentItem: parent,
        selectedChildItem: child
      });
    } else if (selectedChildItem !== child) {
      this.setState({
        selectedParentItem: parent,
        selectedChildItem: child
      });
    } else {
      this.setState({
        selectedParentItem: '',
        selectedChildItem: ''
      });
    }
  }

  render() {
    const { selectedParentItem, selectedChildItem } = this.state;
    return (
      <div>
        <div className="sidebar">
          <Link className="header" to="/">
            <span>
              Tamanu
            </span>
          </Link>
          <div className="scroll-container">
            {
              sidebarInfo.map((parent, index) => (
                <div key={index} onClick={this.clickedParentItem.bind(this, parent.label)}>
                  <Link className={classNames(['item', selectedParentItem === parent.label ? 'selected' : ''])} to={parent.path} replace>
                    <span>
                      {parent.label}
                    </span>
                  </Link>
                  {
                    selectedParentItem === parent.label &&
                    parent.children.map((child, key) => (
                      <div key={key} className="category-sub-items" onClick={this.clickedChildItem.bind(this, parent.label, child.label)}>
                        <Link className={classNames(['children', selectedChildItem === child.label ? 'selected' : ''])} to={child.label} replace>
                          <i className="fa fa-plus" />
                          <span>
                            {child.label}
                          </span>
                        </Link>
                      </div>
                    ))
                  }
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  }
}
