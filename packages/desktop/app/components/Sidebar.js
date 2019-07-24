import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { find, isEmpty } from 'lodash';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import Divider from '@material-ui/core/Divider';
import { grey } from '@material-ui/core/colors';

import styled from 'styled-components';
import { sidebarInfo, submenuIcons } from '../constants';
import { ProgramsCollection } from '../collections';
import actions from '../actions/auth';
import { checkAbility } from '../utils/ability-context';

import { logoutIcon } from '../constants/images';
import { TamanuLogo } from './TamanuLogo';

import { Translated } from './Translated';

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
  color: ${grey[100]};
  font-size: 1.05rem;
`;

const LogoutItem = ({ onClick }) => (
  <ListItem button onClick={onClick}>
    <SidebarPrimaryIcon src={logoutIcon} />
    <SidebarItemText disableTypography inset primary={<Translated id="logout" />} />
  </ListItem>
);

const PrimarySidebarItem = ({
  icon, label, children, selected, onClick,
}) => (
  <React.Fragment>
    <ListItem button onClick={onClick} selected={selected}>
      <SidebarPrimaryIcon src={icon} />
      <SidebarItemText inset disableTypography primary={label} />
    </ListItem>
    <Collapse in={selected} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        {children}
      </List>
    </Collapse>
  </React.Fragment>
);

const SecondarySidebarItem = withRouter(({ path, icon, label, location, disabled }) => (
  <ListItem
    button
    component={Link}
    to={path}
    disabled={disabled}
    selected={path === location.pathname}
    replace={path === location.pathname}
  >
    <i className={icon} />
    <SidebarItemText disableTypography primary={label} />
  </ListItem>
));

class Sidebar extends Component {
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

  updateProgramsMenu = (programs) => {
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

  render() {
    const { selectedParentItem } = this.state;
    return (
      <SidebarContainer>
        <SidebarMenuContainer>
          <List component="nav">
            {
              sidebarInfo.map((item) => {
                return (
                  <PrimarySidebarItem
                    icon={item.icon}
                    label={item.label}
                    key={item.key}
                    selected={selectedParentItem === item.key}
                    onClick={() => this.clickedParentItem(item)}
                  >
                    {item.children.map(child => (
                      <SecondarySidebarItem
                        key={child.path}
                        path={child.path}
                        icon={child.icon}
                        label={child.label}
                        disabled={!checkAbility({...item.ability, ...child.ability})}
                      />
                    ))}
                  </PrimarySidebarItem>
                );
              })
            }
          </List>
          <Divider />
          <List>
            <LogoutItem onClick={this.props.logout} />
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
  const { pathname: currentPath } = state.router.location;
  const programsCollection = new ProgramsCollection();
  return {
    userId, displayName, currentPath, programsCollection,
  };
}

const mapDispatchToProps = (dispatch) => ({
  logout: (params) => dispatch(logout(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Sidebar);
