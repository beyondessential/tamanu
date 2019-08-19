import {
  patientIcon,
  scheduleIcon,
  medicationIcon,
  labsIcon,
  administrationIcon,
  programsIcon,
  radiologyIcon,
} from '../../constants/images';
import { availableReports } from '../../views/reports/dummyReports';

export const submenuIcons = {
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

export const items = [
  {
    key: 'patients',
    label: 'Patients',
    path: '/patients',
    icon: patientIcon,
    ability: { subject: 'patient' },
    children: [
      {
        label: 'View Patient (debug)',
        path: '/patients/view',
        icon: submenuIcons.new,
        ability: { action: 'read' },
      },
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
