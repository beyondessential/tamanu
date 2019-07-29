import React, { Component } from 'react';
import { connect } from 'react-redux';
import { find, isEmpty } from 'lodash';
import { push } from 'react-router-redux';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import Divider from '@material-ui/core/Divider';
import { grey } from '@material-ui/core/colors';

import styled from 'styled-components';
import { ProgramsCollection } from '../collections';
import actions from '../actions/auth';
import { checkAbility } from '../utils/ability-context';

import {
  patientIcon,
  scheduleIcon,
  medicationIcon,
  labsIcon,
  administrationIcon,
  programsIcon,
  radiologyIcon,
  logoutIcon,
} from '../constants/images';
import { availableReports } from '../containers/Reports/dummyReports';

import { TamanuLogo } from './TamanuLogo';

import { Translated } from './Translated';

const submenuIcons = {
  calendar: 'fa fa-calendar',
  new: 'fa fa-plus',
  search: 'fa fa-search',
  table: 'fa fa-th-list',
  users: 'fa fa-users',
  permissions: 'fa fa-lock',
  cog: 'fa fa-cog',
  report: 'fa fa-chevron-circle-right',
  action: 'fa fa-chevron-circle-right',
};

const sidebarInfo = [
  {
    key: 'patients',
    label: 'Patients',
    path: '/patients',
    icon: patientIcon,
    ability: { subject: 'patient' },
    children: [
      {
        label: 'Patient Listing',
        path: '/patients',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'Admitted Patients',
        path: '/patients/admitted',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'Outpatients',
        path: '/patients/outpatient',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'New Patient',
        path: '/patients/edit/new',
        icon: submenuIcons.new,
        ability: { action: 'create' },
      },
    ],
  },
  {
    key: 'scheduling',
    label: 'Scheduling',
    path: '/appointments',
    icon: scheduleIcon,
    ability: { subject: 'appointment' },
    children: [
      {
        label: 'Appointments This Week',
        path: '/appointments/week',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: "Today's Appointments",
        path: '/appointments/today',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'Search Appointments',
        path: '/appointments/search',
        icon: submenuIcons.search,
        ability: { action: 'read' },
      },
      {
        label: 'Appointments Calendar',
        path: '/appointments/calendar',
        icon: submenuIcons.calendar,
        ability: { action: 'read' },
      },
      {
        label: 'Add Appointment',
        path: '/appointments/appointment/new',
        icon: submenuIcons.new,
        ability: { action: 'create' },
      },
      {
        label: 'Theater Schedule',
        path: '/appointments/theater',
        icon: submenuIcons.calendar,
        ability: { action: 'read' },
      },
      {
        label: 'Schedule Surgery',
        path: '/appointments/surgery/new',
        icon: submenuIcons.new,
        ability: { action: 'create' },
      },
    ],
  },
  {
    key: 'medication',
    label: 'Medication',
    path: '/medication',
    icon: medicationIcon,
    ability: { subject: 'medication' },
    children: [
      {
        label: 'Requests',
        path: '/medication/requests',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'Completed',
        path: '/medication/completed',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'New Request',
        path: '/medication/request',
        icon: submenuIcons.new,
        ability: { action: 'create' },
      },
      {
        label: 'Dispense',
        path: '/medication/dispense',
        icon: submenuIcons.action,
        ability: { action: 'create' },
      },
    ],
  },
  {
    key: 'imaging',
    label: 'Imaging',
    path: '/imaging',
    icon: radiologyIcon,
    ability: { subject: 'imaging' },
    children: [
      {
        label: 'Requests',
        path: '/imaging',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'Completed',
        path: '/imaging/completed',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'New Request',
        path: '/imaging/request',
        icon: submenuIcons.new,
        ability: { action: 'create' },
      },
    ],
  },
  {
    key: 'labs',
    label: 'Labs',
    path: '/labs',
    icon: labsIcon,
    ability: { subject: 'lab' },
    children: [
      {
        label: 'Requests',
        path: '/labs',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'Completed',
        path: '/labs/completed',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'New Request',
        path: '/labs/edit/new',
        icon: submenuIcons.new,
        ability: { action: 'create' },
      },
    ],
  },
  {
    key: 'admin',
    label: 'Administration',
    path: '/admin',
    icon: administrationIcon,
    ability: { subject: 'user', action: 'read' },
    children: [
      {
        label: 'Settings',
        path: '/admin/settings',
        icon: submenuIcons.cog,
      },
      {
        label: 'Users',
        path: '/admin/users',
        icon: submenuIcons.users,
        ability: { action: 'read', subject: 'user' },
      },
      {
        label: 'Permissions',
        path: '/admin/permissions',
        icon: submenuIcons.permissions,
        ability: { action: 'read', subject: 'userRole' },
      },
      {
        label: 'New User',
        path: '/admin/users/edit/new',
        icon: submenuIcons.new,
        ability: { action: 'create', subject: 'user' },
      },
    ],
  },
  {
    key: 'programs',
    label: 'Programs',
    path: '/programs',
    icon: programsIcon,
    ability: { action: 'read', subject: 'program' },
    children: [],
  },
  {
    key: 'reports',
    label: 'Reports',
    path: '/reports',
    icon: scheduleIcon,
    ability: { action: 'read', subject: 'report' },
    children: availableReports.map(report => ({
      label: report.name,
      path: `/reports/${report.id}`,
      icon: submenuIcons.report,
    })),
  },
];

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
  border: none;
`;

const SidebarItemText = styled(ListItemText)`
  color: ${grey[100]};
  font-size: 1.05rem;
`;

const LogoutItem = React.memo(({ onClick }) => (
  <ListItem button onClick={onClick}>
    <SidebarPrimaryIcon src={logoutIcon} />
    <SidebarItemText disableTypography inset primary={<Translated id="logout" />} />
  </ListItem>
));

const PrimarySidebarItem = React.memo(({
  icon, label, children, selected, onClick,
}) => (
  <React.Fragment>
    <ListItem button onClick={onClick} selected={selected}>
      <SidebarPrimaryIcon src={icon || administrationIcon} />
      <SidebarItemText inset disableTypography primary={label} />
    </ListItem>
    <Collapse in={selected} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        {children}
      </List>
    </Collapse>
  </React.Fragment>
));

const SecondarySidebarItem = React.memo(({
  path, icon, label, isCurrent, disabled, onClick,
}) => (
  <ListItem
    button
    to={path}
    disabled={disabled}
    selected={isCurrent}
    onClick={onClick}
  >
    <i className={icon} />
    <SidebarItemText disableTypography primary={label} />
  </ListItem>
));

export class Sidebar extends Component {
  state = {
    selectedParentItem: '',
  }

  onLogout = () => {
    const { onLogout } = this.props;
    if(onLogout) {
      onLogout();
    }
  }

  clickedParentItem = ({ key }) => {
    const { selectedParentItem } = this.state;
    if (selectedParentItem === key) {
      this.setState({ selectedParentItem: '' });
    } else {
      this.setState({ selectedParentItem: key });
    }
  }

  render() {
    const { selectedParentItem } = this.state;
    const { currentPath, items, onPathChanged, permissionCheck = () => true } = this.props;
    return (
      <SidebarContainer>
        <SidebarMenuContainer>
          <List component="nav">
            {
              items.map((item) => {
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
                        isCurrent={currentPath === child.path}
                        icon={child.icon}
                        label={child.label}
                        disabled={!permissionCheck(child, item)}
                        onClick={() => onPathChanged(child.path)}
                      />
                    ))}
                  </PrimarySidebarItem>
                );
              })
            }
          </List>
          <Divider />
          <List>
            <LogoutItem onClick={this.onLogout} />
          </List>
        </SidebarMenuContainer>
        <LogoContainer>
          <div onClick={() => onPathChanged("/")}>
            <TamanuLogo size="120px" />
          </div>
        </LogoContainer>
      </SidebarContainer>
    );
  }
}

class SidebarWithPrograms extends Component {

  async updateProgramsInPlace() {
    const programsCollection = new ProgramsCollection();

    const programs = await new Promise((resolve) => {
      programsCollection.fetchAll({ success: ({ models }) => resolve(models) });
    });

    const programsNav = find(sidebarInfo, { key: 'programs' });
    if (!isEmpty(programs)) {
      programsNav.hidden = false;
      programsNav.children = programs.map((programString, key) => {
        const program = programString.toJSON();
        return {
          label: program.name,
          path: `/programs/${program._id}/patients`,
          icon: submenuIcons.action,
        };
      });
    }
  }

  async componentWillMount() {
    await this.updateProgramsInPlace();
    this.forceUpdate();
  }

  render() {
    return <Sidebar {...this.props} />;
  }
}

function mapStateToProps(state) {
  const { pathname: currentPath } = state.router.location;
  const items = sidebarInfo;

  const permissionCheck = (child, parent) => {
    const ability = {...child.ability, ...parent.ability};
    if(!ability.subject || !ability.action) {
      return true;
    }
    return checkAbility(ability);
  };

  return { currentPath, items, permissionCheck };
}

const mapDispatchToProps = (dispatch) => ({
  onPathChanged: (newPath) => dispatch(push(newPath)),
  onLogout: (params) => dispatch(logout(params)),
});

export const ConnectedSidebar = connect(mapStateToProps, mapDispatchToProps)(SidebarWithPrograms);
