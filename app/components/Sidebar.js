import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { find, isEmpty, startsWith } from 'lodash';
import { sidebarInfo } from '../constants';
import { ProgramsCollection } from '../collections';
import actions from '../actions/auth';

const { login: loginActions } = actions;
const { logout } = loginActions;

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
    userId: null,
  }

  async componentWillMount() {
    this.props.programsCollection.fetchAll({
      success: () => this.handleChange()
    });
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  handleChange(props = this.props) {
    // Prepare programs sub-menu
    const { models } = props.programsCollection;
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
    const { currentPath, displayName } = this.props;
    return (
      <div>
        <div className="sidebar">
          <Link className="header" to="/" replace>
            <span>
              Tamanu
            </span>
          </Link>
          <div className="scroll-container">
            {
              sidebarInfo.map((parent, index) => {
                const selected = startsWith(currentPath, parent.path) ;
                return (
                  <div key={index} className={parent.hidden ? 'is-hidden' : ''}>
                    <Link className={classNames({ item: true, selected })} to={parent.path} replace onClick={() => this.clickedParentItem(parent.label)}>
                      <img src={parent.icon} alt="icon" className="sidebar-icon" />
                      <span>
                        {parent.label}
                      </span>
                    </Link>
                    {
                      selected &&
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
                );
              })
            }
            <div className="user-info p-l-20 p-t-30">
              <div className="is-size-5 is-color-white has-text-weight-semibold p-b-5">{displayName}</div>
              <button className="button is-danger is-outlined" onClick={this.props.logout}>
                <i className="fa fa-sign-out" /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { userId, displayName } = state.auth;
  const { pathname: currentPath } = state.router.location;
  const programsCollection = new ProgramsCollection();
  return { userId, displayName, currentPath, programsCollection };
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  logout: (params) => dispatch(logout(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Sidebar);
