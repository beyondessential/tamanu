import React from 'react';
import {
  Assignment as AssignmentIcon,
  AttachMoney as AttachMoneyIcon,
  BarChart as BarChartIcon,
  CallMerge as CallMergeIcon,
  Cloud as CloudIcon,
  Group as GroupIcon,
  Language as LanguageIcon,
  SingleBed as BedIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Translate as TranslateIcon,
} from '@material-ui/icons';

import { TranslatedText } from '../Translation/TranslatedText';
import {
  autoAwesomeMotionIcon,
  newsIcon,
  upload2Icon,
  workspacesIcon,
} from '../../constants/images';

export const CENTRAL_MENU_ITEMS = [
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
    icon: <LanguageIcon color="secondary" data-testid="languageicon-zkee" />,
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
    icon: <GroupIcon color="secondary" data-testid="groupicon-xmqw" />,
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
    icon: workspacesIcon,
  },
  {
    key: 'surveyResponses',
    label: 'Survey Responses',
    path: '/admin/surveyResponses',
    icon: <AssignmentIcon color="secondary" data-testid="assignmenticon-retb" />,
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
    icon: <BedIcon color="secondary" data-testid="bedicon-locationassignments" />,
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
    icon: <PersonIcon color="secondary" data-testid="peopleicon-users" />,
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
    icon: <CallMergeIcon color="secondary" data-testid="callmergeicon-ywnt" />,
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
    icon: autoAwesomeMotionIcon,
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
    icon: <TranslateIcon color="secondary" data-testid="translateicon-49q7" />,
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
    icon: upload2Icon,
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
    icon: <CloudIcon color="secondary" data-testid="cloudicon-755w" />,
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
    icon: <SettingsIcon color="secondary" data-testid="settingsicon-h7ys" />,
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
    icon: <BarChartIcon color="secondary" data-testid="barcharticon-f74k" />,
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
    icon: newsIcon,
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
    icon: <AttachMoneyIcon color="secondary" data-testid="attachmoneyicon-w0gr" />,
  },
];
