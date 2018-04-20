import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { sidebarInfo } from '../constants';

const classNames = require('classnames');

class Sidebar extends Component {
  static propTypes = {
    currentPath: PropTypes.string.isRequired
  }

  state = {
    selectedParentItem: '',
  }

  clickedParentItem = (label) => {
    this.setState({
      selectedParentItem: label,
    });
  }

  render() {
    const { selectedParentItem } = this.state;
    const { currentPath } = this.props;
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
                    <i className={parent.icon} />
                    <span>
                      {parent.label}
                    </span>
                  </Link>
                  {
                    selectedParentItem === parent.label &&
                    parent.children.map((child, key) => (
                      <div key={key} className="category-sub-items">
                        <Link className={classNames(['children', currentPath === child.path ? 'selected' : ''])} to={child.path} replace>
                          <i className={child.icon} />
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

function mapStateToProps(state) {
  return {
    currentPath: state.router.location.pathname
  };
}

export default connect(mapStateToProps, undefined)(Sidebar);
