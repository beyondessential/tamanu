import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { find, isEmpty } from 'lodash';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import Divider from '@material-ui/core/Divider';

import styled from 'styled-components';
import { sidebarInfo, submenuIcons } from '../constants';
import { ProgramsCollection } from '../collections';
import actions from '../actions/auth';
import { checkAbility } from '../utils/ability-context';

import { logoutIcon } from '../constants/images';
import { TamanuLogo } from './TamanuLogo';

const { login: loginActions } = actions;
const { logout } = loginActions;

const SidebarContainer = styled.div`
  min-width: 275px;
  height: 100vh;
  position: relative;
  background: #2f4358;
  color: #fff;
  flex-grow: 0;
  flex-shrink: 0;

  display: flex;
  flex-direction: column;

  i {
    color: #fff;
  }
`;

const SidebarMenuContainer = styled.div`
  flex-grow: 1;
  overflow: auto;
`;

const LogoContainer = styled.div`
  width: 100%;
  text-align: center;
`;

const SidebarPrimaryIcon = styled.img`
  width: 2.2em;
  height: 2.2em;
`;

const SidebarItemText = styled(ListItemText)`
  color: #fff;
`;

const LogoutItem = ({ onClick }) => (
  <ListItem button onClick={ onClick }>
    <SidebarPrimaryIcon src={ logoutIcon } />
    <SidebarItemText disableTypography inset primary="Logout" />
  </ListItem>
);

const PrimarySidebarItem = ({ item, ability, selected, onClick }) => (
  <React.Fragment>
    <ListItem button onClick={ onClick } selected={selected}>
      <SidebarPrimaryIcon src={item.icon} />
      <SidebarItemText inset disableTypography primary={item.label} />
    </ListItem>
    <Collapse in={selected} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        {item.children.map(child => (
          <SecondarySidebarItem
            item={ child }
            key={ child.path }
            parentAbility={ability}
          />
        ))}
      </List>
    </Collapse>
  </React.Fragment>
);

const SecondarySidebarItem = withRouter(({ item, location, parentAbility }) => {
  const ability = { ...parentAbility, ...(item.ability || {}) };
  const { action, subject } = ability;
  if (!action || !subject) {
    throw new Error("Invalid ability provided to sidebar item");
  }
  const allowed = checkAbility({ action, subject });

  return <ListItem
    button
    component={ Link }
    to={ item.path }
    selected={ item.path === location.pathname }
    disabled={!allowed}
    replace={ item.path === location.pathname }
  >
    <i className={ item.icon } />
    <SidebarItemText disableTypography primary={item.label} />
  </ListItem>
});

class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.updateProgramsMenu = this.updateProgramsMenu.bind(this);
  }

  state = {
    selectedParentItem: '',
  }

  async componentWillMount() {
    this.props.programsCollection.fetchAll({
      success: ({ models: programModels }) => this.updateProgramsMenu(programModels),
    });
  }

  componentWillReceiveProps(newProps) {
    const { programsCollection = {} } = newProps;
    this.updateProgramsMenu(programsCollection.models);
  }

  updateProgramsMenu(programs) {
    // Prepare programs sub-menu
    const programsNav = find(sidebarInfo, { key: 'programs' });
    if (!isEmpty(programs)) {
      programsNav.hidden = false;
      programsNav.children = [];
      programs.forEach((programString, key) => {
        const program = programString.toJSON();
        programsNav.children.push({
          label: program.name,
          path: `/programs/${program._id}/patients`,
          icon: submenuIcons.action,
        });

        if (key === 0) programsNav.path = `/programs/${program._id}/patients`;
      });
    }

    this.forceUpdate();
  }

  clickedParentItem = ({ key }) => {
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
    return (
      <SidebarContainer>
        <SidebarMenuContainer>
          <List component="nav">
            {
              sidebarInfo.map((item) => {
                const { ability = {} } = item;
                return (
                  <PrimarySidebarItem
                    item={item}
                    key={item.key}
                    ability={ability}
                    selected={selectedParentItem === item.key}
                    onClick={() => this.clickedParentItem(item)}
                  />
                );
              })
            }
          </List>
          <Divider />
          <List>
            <LogoutItem onClick={ this.props.logout } />
          </List>
        </SidebarMenuContainer>
        <LogoContainer>
          <Link to="/">
            <TamanuLogo size="120px" />
          </Link>
        </LogoContainer>
      </SidebarContainer>
    );
  }
}

function mapStateToProps(state) {
  const { userId, displayName } = state.auth;
  const programsCollection = new ProgramsCollection();
  return { userId, displayName, programsCollection };
}

const mapDispatchToProps = (dispatch) => ({
  logout: (params) => dispatch(logout(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Sidebar);
