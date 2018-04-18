import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { sidebarInfo } from '../constants';

export default class Sidebar extends Component {
  render() {
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
              sidebarInfo.map((item, index) => (
                <Link className="item" to={item.path} key={index} replace>
                  <span>
                    {item.label}
                  </span>
                </Link>
              ))
            }
          </div>
        </div>
      </div>
    );
  }
}
