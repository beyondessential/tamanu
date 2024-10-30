import React from 'react';
import {
  Assignment as AssignmentIcon,
  AttachMoney as AttachMoneyIcon,
  BarChart as BarChartIcon,
  CallMerge as CallMergeIcon,
  Cloud as CloudIcon,
  Group as GroupIcon,
  Language as LanguageIcon,
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
    label: <TranslatedText stringId="adminSidebar.referenceData" fallback="Reference data" />,
    path: '/admin/referenceData',
    icon: <LanguageIcon color="secondary" />,
  },
  {
    key: 'permissions',
    label: <TranslatedText stringId="adminSidebar.permissions" fallback="Permissions" />,
    path: '/admin/permissions',
    ability: { action: 'read', subject: 'userRole' },
    icon: <GroupIcon color="secondary" />,
  },
  {
    key: 'programs',
    label: <TranslatedText stringId="adminSidebar.programs" fallback="Programs" />,
    path: '/admin/programs',
    icon: workspacesIcon,
  },
  {
    key: 'surveyResponses',
    label: 'Survey Responses',
    path: '/admin/surveyResponses',
    icon: <AssignmentIcon color="secondary" />,
  },
  {
    key: 'patientMerge',
    label: <TranslatedText stringId="adminSidebar.patientMerge" fallback="Patient merge" />,
    path: '/admin/patientMerge',
    icon: <CallMergeIcon color="secondary" />,
  },
  {
    key: 'templates',
    label: <TranslatedText stringId="adminSidebar.templates" fallback="Templates" />,
    path: '/admin/templates',
    icon: autoAwesomeMotionIcon,
  },
  {
    key: 'translation',
    label: <TranslatedText stringId="adminSidebar.translation" fallback="Translation" />,
    path: '/admin/translation',
    ability: { action: 'write', subject: 'translation' },
    icon: <TranslateIcon color="secondary" />,
  },
  {
    key: 'assets',
    label: <TranslatedText stringId="adminSidebar.assetUpload" fallback="Asset upload" />,
    path: '/admin/assets',
    icon: upload2Icon,
  },
  {
    key: 'sync',
    label: <TranslatedText stringId="adminSidebar.syncStatus" fallback="Sync status" />,
    path: '/admin/sync',
    icon: <CloudIcon color="secondary" />,
  },
  {
    key: 'settings',
    label: <TranslatedText stringId="adminSidebar.settings" fallback="Settings" />,
    path: '/admin/settings',
    ability: { action: 'write', subject: 'settings' },
    icon: <SettingsIcon color="secondary" />,
  },
  {
    key: 'fhirJobStats',
    label: <TranslatedText stringId="adminSidebar.fhirJobStats" fallback="FHIR job stats" />,
    path: '/admin/fhir/jobStats',
    icon: <BarChartIcon color="secondary" />,
  },
  {
    key: 'reports',
    label: <TranslatedText stringId="adminSidebar.reports" fallback="Reports" />,
    path: '/admin/reports',
    icon: newsIcon,
  },
  {
    key: 'Insurer payments',
    label: <TranslatedText stringId="adminSidebar.insurerPayments" fallback="Insurer payments" />,
    path: '/admin/insurerPayments',
    icon: <AttachMoneyIcon color="secondary" />,
  },
];
