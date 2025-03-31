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
    label: <TranslatedText
      stringId="adminSidebar.referenceData"
      fallback="Reference data"
      data-test-id='translatedtext-yjlq' />,
    path: '/admin/referenceData',
    icon: <LanguageIcon color="secondary" />,
  },
  {
    key: 'permissions',
    label: <TranslatedText
      stringId="adminSidebar.permissions"
      fallback="Permissions"
      data-test-id='translatedtext-ypq4' />,
    path: '/admin/permissions',
    ability: { action: 'read', subject: 'userRole' },
    icon: <GroupIcon color="secondary" />,
  },
  {
    key: 'programs',
    label: <TranslatedText
      stringId="adminSidebar.programs"
      fallback="Programs"
      data-test-id='translatedtext-02fw' />,
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
    label: <TranslatedText
      stringId="adminSidebar.patientMerge"
      fallback="Patient merge"
      data-test-id='translatedtext-7sss' />,
    path: '/admin/patientMerge',
    icon: <CallMergeIcon color="secondary" />,
  },
  {
    key: 'templates',
    label: <TranslatedText
      stringId="adminSidebar.templates"
      fallback="Templates"
      data-test-id='translatedtext-wets' />,
    path: '/admin/templates',
    icon: autoAwesomeMotionIcon,
  },
  {
    key: 'translation',
    label: <TranslatedText
      stringId="adminSidebar.translation"
      fallback="Translation"
      data-test-id='translatedtext-29jn' />,
    path: '/admin/translation',
    ability: { action: 'write', subject: 'translation' },
    icon: <TranslateIcon color="secondary" />,
  },
  {
    key: 'assets',
    label: <TranslatedText
      stringId="adminSidebar.assetUpload"
      fallback="Asset upload"
      data-test-id='translatedtext-cqwb' />,
    path: '/admin/assets',
    icon: upload2Icon,
  },
  {
    key: 'sync',
    label: <TranslatedText
      stringId="adminSidebar.syncStatus"
      fallback="Sync status"
      data-test-id='translatedtext-d0yp' />,
    path: '/admin/sync',
    icon: <CloudIcon color="secondary" />,
  },
  {
    key: 'settings',
    label: <TranslatedText
      stringId="adminSidebar.settings"
      fallback="Settings"
      data-test-id='translatedtext-fhnu' />,
    path: '/admin/settings',
    ability: { action: 'write', subject: 'settings' },
    icon: <SettingsIcon color="secondary" />,
  },
  {
    key: 'fhirJobStats',
    label: <TranslatedText
      stringId="adminSidebar.fhirJobStats"
      fallback="FHIR job stats"
      data-test-id='translatedtext-vkrn' />,
    path: '/admin/fhir/jobStats',
    icon: <BarChartIcon color="secondary" />,
  },
  {
    key: 'reports',
    label: <TranslatedText
      stringId="adminSidebar.reports"
      fallback="Reports"
      data-test-id='translatedtext-a725' />,
    path: '/admin/reports',
    icon: newsIcon,
  },
  {
    key: 'Insurer payments',
    label: <TranslatedText
      stringId="adminSidebar.insurerPayments"
      fallback="Insurer payments"
      data-test-id='translatedtext-rt7x' />,
    path: '/admin/insurerPayments',
    icon: <AttachMoneyIcon color="secondary" />,
  },
];
