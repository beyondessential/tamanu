import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { find, isEmpty } from 'lodash';
import { sidebarInfo } from '../constants';
import { ProgramsCollection } from '../collections';

const classNames = require('classnames');

class Sidebar extends Component {
  static propTypes = {
    currentPath: PropTypes.string.isRequired
  }

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  state = {
    selectedParentItem: '',
  }

  async componentWillMount() {
    this.props.programsCollection.on('update', this.handleChange);
    this.props.programsCollection.fetchAll({
      success: () => console.log('Programs loaded!')
    });
  }

  handleChange() {
    // Prepare programs sub-menu
    const { models } = this.props.programsCollection;
    const programsNav = find(sidebarInfo, { key: 'programs' });
    if (!isEmpty(models)) {
      programsNav.hidden = false;
      programsNav.children = [];
      models.forEach((program, key) => {
        program = program.toJSON();
        programsNav.children.push({
          label: program.name,
          path: `/programs/${program._id}/patients`,
          icon: 'fa fa-chevron-right'
        });

        if (key === 0) programsNav.path = `/programs/${program._id}/patients`;
      });

      programsNav.children.push({
        label: 'Pregnancies',
        path: '/programs/pregnancies',
        icon: 'fa fa-chevron-right'
      });
      programsNav.children.push({
        label: 'prepregnancies',
        path: '/programs/prepregnancies',
        icon: 'fa fa-chevron-right'
      });
      programsNav.children.push({
        label: 'pregnancyVisit',
        path: '/programs/pregnancyVisit',
        icon: 'fa fa-chevron-right'
      });
      programsNav.children.push({
        label: 'pregnancyConfirm',
        path: '/programs/pregnancyConfirm',
        icon: 'fa fa-chevron-right'
      });
      programsNav.children.push({
        label: 'questionTable',
        path: '/programs/questionTable',
        icon: 'fa fa-chevron-right'
      });
      programsNav.children.push({
        label: 'questionsFirst',
        path: '/programs/questionsFirst',
        icon: 'fa fa-chevron-right'
      });
      programsNav.children.push({
        label: 'questionsSecond',
        path: '/programs/questionsSecond',
        icon: 'fa fa-chevron-right'
      });
      programsNav.children.push({
        label: 'questionsThird',
        path: '/programs/questionsThird',
        icon: 'fa fa-chevron-right'
      });
    }

    this.forceUpdate();
  }

  clickedParentItem = (label) => {
    const { selectedParentItem } = this.state;
    if (selectedParentItem !== label) {
      this.setState({
        selectedParentItem: label,
      });
    } else {
      this.setState({
        selectedParentItem: '',
      });
    }
  }

  render() {
    const { selectedParentItem } = this.state;
    const { currentPath } = this.props;
    return (
      <div>
        <div className="sidebar">
          <Link className="header" to="/" replace>
            <span>
              Tamanu
            </span>
          </Link>
          <div className="scroll-container">
            {currentPath.includes('/patients') &&
              <div className="search-container">
                <input className="input is-primary" type="text" placeholder="Search" />
                <button>
                  <i className="fa fa-search" />
                </button>
              </div>
            }
            {
              sidebarInfo.map((parent, index) => (
                <div key={index} className={parent.hidden ? 'is-hidden' : ''}>
                  <Link className={classNames(['item', selectedParentItem === parent.label ? 'selected' : ''])} to={parent.path} replace onClick={() => this.clickedParentItem(parent.label)}>
                    <img src={parent.icon} alt="icon" className="sidebar-icon" />
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
    currentPath: state.router.location.pathname,
    programsCollection: new ProgramsCollection()
  };
}

export default connect(mapStateToProps, undefined)(Sidebar);
