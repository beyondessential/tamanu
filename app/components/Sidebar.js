import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { sidebarInfo } from '../constants';

export default class Sidebar extends Component {
  state = {
    selectedItem: ''
  }

  clickedItem = (label) => {
    const { selectedItem } = this.state;
    if (selectedItem !== label) {
      this.setState({ selectedItem: label });
    } else {
      this.setState({ selectedItem: '' });
    }
  }

  render() {
    const { selectedItem } = this.state;
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
                <div key={index} onClick={this.clickedItem.bind(this, parent.label)}>
                  <Link className="item" to={parent.path} replace>
                    <span>
                      {parent.label}
                    </span>
                  </Link>
                  {
                    selectedItem === parent.label &&
                    parent.children.map((child, key) => (
                      <div key={key} className="category-sub-items">
                        <Link className="children" to="/" replace>
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
