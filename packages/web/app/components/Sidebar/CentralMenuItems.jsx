import AssignmentIcon from '@mui/icons-material/Assignment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AutoAwesomeMotionIcon from '@mui/icons-material/AutoAwesomeMotion';
import BarChartIcon from '@mui/icons-material/BarChart';
import BedIcon from '@mui/icons-material/Bed';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import CloudIcon from '@mui/icons-material/Cloud';
import FeedIcon from '@mui/icons-material/Feed';
import GroupIcon from '@mui/icons-material/Group';
import LanguageIcon from '@mui/icons-material/Language';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import TranslateIcon from '@mui/icons-material/Translate';
import UploadIcon from '@mui/icons-material/Upload';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import React from 'react';

import { TranslatedText } from '../Translation/TranslatedText';

export const CENTRAL_MENU_ITEMS = /** @type {const} */ ([
  {
    key: 'referenceData',
    label: (
      <TranslatedText
        stringId="adminSidebar.referenceData"
        fallback="Reference data"
        data-testid="translatedtext-m2nm"
      />
    ),
    path: '/admin/referenceData',
    icon: <LanguageIcon aria-hidden color="secondary" data-testid="languageicon-zkee" />,
  },
  {
    key: 'permissions',
    label: (
      <TranslatedText
        stringId="adminSidebar.permissions"
        fallback="Permissions"
        data-testid="translatedtext-ztl9"
      />
    ),
    path: '/admin/permissions',
    ability: { action: 'read', subject: 'userRole' },
    icon: <GroupIcon aria-hidden color="secondary" data-testid="groupicon-xmqw" />,
  },
  {
    key: 'programs',
    label: (
      <TranslatedText
        stringId="adminSidebar.programs"
        fallback="Programs"
        data-testid="translatedtext-0jll"
      />
    ),
    path: '/admin/programs',
    icon: <WorkspacesIcon aria-hidden color="secondary" />,
    children: [
      {
        key: 'programsAndForms',
        label: (
          <TranslatedText
            stringId="adminSidebar.programsAndForms"
            fallback="Programs & forms"
            data-testid="translatedtext-programs-and-forms"
          />
        ),
        path: '/admin/programs/programs',
      },
      {
        key: 'programRegistries',
        label: (
          <TranslatedText
            stringId="adminSidebar.programRegistries"
            fallback="Program registries"
            data-testid="translatedtext-program-registries"
          />
        ),
        path: '/admin/programs/registries',
      },
    ],
  },
  {
    key: 'surveyResponses',
    label: 'Survey Responses',
    path: '/admin/surveyResponses',
    icon: <AssignmentIcon aria-hidden color="secondary" data-testid="assignmenticon-retb" />,
  },
  {
    key: 'locationAssignments',
    label: (
      <TranslatedText
        stringId="adminSidebar.locationAssignment"
        fallback="Location assignment"
        data-testid="translatedtext-locationassignments"
      />
    ),
    path: '/admin/locationAssignments',
    icon: <BedIcon aria-hidden color="secondary" data-testid="bedicon-locationassignments" />,
  },
  {
    key: 'users',
    label: (
      <TranslatedText
        stringId="adminSidebar.users"
        fallback="Users"
        data-testid="translatedtext-users"
      />
    ),
    path: '/admin/users',
    icon: <PersonIcon aria-hidden color="secondary" data-testid="personicon-users" />,
    children: [
      {
        label: (
          <TranslatedText
            stringId="adminSidebar.userProfiles"
            fallback="User profiles"
            data-testid="translatedtext-user-profiles"
          />
        ),
        path: '/admin/users/profiles',
        key: 'userProfiles',
      },
      {
        label: (
          <TranslatedText
            stringId="adminSidebar.rolesAndDesignations"
            fallback="Roles & designations"
            data-testid="translatedtext-roles-designations"
          />
        ),
        path: '/admin/users/rolesAndDesignations',
        key: 'rolesAndDesignations',
      },
    ],
  },
  {
    key: 'patientMerge',
    label: (
      <TranslatedText
        stringId="adminSidebar.patientMerge"
        fallback="Patient merge"
        data-testid="translatedtext-8v5d"
      />
    ),
    path: '/admin/patientMerge',
    icon: <CallMergeIcon aria-hidden color="secondary" data-testid="callmergeicon-ywnt" />,
  },
  {
    key: 'templates',
    label: (
      <TranslatedText
        stringId="adminSidebar.templates"
        fallback="Templates"
        data-testid="translatedtext-67mq"
      />
    ),
    path: '/admin/templates',
    icon: <AutoAwesomeMotionIcon aria-hidden color="secondary" />,
  },
  {
    key: 'translation',
    label: (
      <TranslatedText
        stringId="adminSidebar.translation"
        fallback="Translation"
        data-testid="translatedtext-q8in"
      />
    ),
    path: '/admin/translation',
    ability: { action: 'write', subject: 'translation' },
    icon: <TranslateIcon aria-hidden color="secondary" data-testid="translateicon-49q7" />,
  },
  {
    key: 'assets',
    label: (
      <TranslatedText
        stringId="adminSidebar.assetUpload"
        fallback="Asset upload"
        data-testid="translatedtext-j30o"
      />
    ),
    path: '/admin/assets',
    icon: <UploadIcon aria-hidden color="secondary" />,
  },
  {
    key: 'sync',
    label: (
      <TranslatedText
        stringId="adminSidebar.syncStatus"
        fallback="Sync status"
        data-testid="translatedtext-sd52"
      />
    ),
    path: '/admin/sync',
    icon: <CloudIcon aria-hidden color="secondary" data-testid="cloudicon-755w" />,
  },
  {
    key: 'settings',
    label: (
      <TranslatedText
        stringId="adminSidebar.settings"
        fallback="Settings"
        data-testid="translatedtext-80n7"
      />
    ),
    path: '/admin/settings',
    ability: { action: 'write', subject: 'settings' },
    icon: <SettingsIcon aria-hidden color="secondary" data-testid="settingsicon-h7ys" />,
  },
  {
    key: 'fhirJobStats',
    label: (
      <TranslatedText
        stringId="adminSidebar.fhirJobStats"
        fallback="FHIR job stats"
        data-testid="translatedtext-9osp"
      />
    ),
    path: '/admin/fhir/jobStats',
    icon: <BarChartIcon aria-hidden color="secondary" data-testid="barcharticon-f74k" />,
  },
  {
    key: 'reports',
    label: (
      <TranslatedText
        stringId="adminSidebar.reports"
        fallback="Reports"
        data-testid="translatedtext-0hbx"
      />
    ),
    path: '/admin/reports',
    icon: <FeedIcon aria-hidden color="secondary" />,
  },
  {
    key: 'Insurer payments',
    label: (
      <TranslatedText
        stringId="adminSidebar.insurerPayments"
        fallback="Insurer payments"
        data-testid="translatedtext-0ao3"
      />
    ),
    path: '/admin/insurerPayments',
    icon: <AttachMoneyIcon aria-hidden color="secondary" data-testid="attachmoneyicon-w0gr" />,
  },
]);
