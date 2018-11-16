import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { find, isEmpty, startsWith } from 'lodash';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';

import styled from 'styled-components';
import { sidebarInfo } from '../constants';
import { ProgramsCollection } from '../collections';
import actions from '../actions/auth';

import { logoutIcon } from '../constants/images';
import { TamanuLogo, TamanuBrandMark } from './TamanuLogo';

const { login: loginActions } = actions;
const { logout } = loginActions;

const classNames = require('classnames');

const SidebarContainer = styled.div`
  width: 275px;
  height: 100vh;
  position: relative;
  background: #2f4358;
`;

const LogoContainer = styled.div`
  position: fixed;
  bottom: 0;
  width: 100%;
  textAlign: center;
`;

const SidebarPrimaryIcon = styled.img`
  width: 2.5em;
  height: 2.5em;
`;

const LogoutItem = ({ onClick }) => (
  <ListItem button onClick={ onClick }>
    <SidebarPrimaryIcon src={ logoutIcon } />
    <ListItemText inset primary="Logout" />
  </ListItem>
);

const PrimarySidebarItem = ({ item, selected, onClick }) => (
  <React.Fragment>
    <ListItem button onClick={ onClick }>
      <SidebarPrimaryIcon src={item.icon} />
      <ListItemText inset primary={item.label} />
    </ListItem>
    <Collapse in={selected} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        {item.children.map(child => (
          <SecondarySidebarItem item={ child } key={ child.path } />
        ))}
      </List>
    </Collapse>
  </React.Fragment>
);

const SecondarySidebarItem = ({ item }) => (
  <ListItem button component={ Link } to={ item.path }>
    <i className={ item.icon } />
    <ListItemText primary={item.label} />
  </ListItem>
);

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

  clickedParentItem = ({ label, key }, event) => {
    const { selectedParentItem } = this.state;
    if (selectedParentItem !== key) {
      this.setState({
        selectedParentItem: key,
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
      <SidebarContainer>
        <TamanuBrandMark />
        <LogoContainer>
          <TamanuLogo width="120px" />
        </LogoContainer>
        <List>
          {
            sidebarInfo.map((item, index) => {
              const pathSegment = item.path.split('/');
              const selected = startsWith(currentPath, `/${pathSegment[1]}`);
              return (
                <PrimarySidebarItem 
                  item={item}
                  key={item.key}
                  selected={selectedParentItem === item.key}
                  onClick={() => this.clickedParentItem(item)}
                />
              );
            })
          }
          <LogoutItem onClick={ this.props.logout } />
        </List>
      </SidebarContainer>
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
