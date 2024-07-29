import React from 'react';
import { TranslatedText } from '../Translation/TranslatedText';

export const CENTRAL_MENU_ITEMS = [
  {
    key: 'referenceData',
    label: <TranslatedText stringId="adminSidebar.referenceData" fallback="Reference data" />,
    path: '/admin/referenceData',
  },
  {
    key: 'permissions',
    label: <TranslatedText stringId="adminSidebar.permissions" fallback="Permissions" />,
    path: '/admin/permissions',
    ability: { action: 'read', subject: 'userRole' },
  },
  {
    key: 'programs',
    label: <TranslatedText stringId="adminSidebar.programs" fallback="Programs" />,
    path: '/admin/programs',
  },
  {
    key: 'surveyResponses',
    label: 'Survey Responses',
    path: '/admin/surveyResponses',
  },
  {
    key: 'patientMerge',
    label: <TranslatedText stringId="adminSidebar.patientMerge" fallback="Patient merge" />,
    path: '/admin/patientMerge',
  },
  {
    key: 'templates',
    label: <TranslatedText stringId="adminSidebar.templates" fallback="Templates" />,
    path: '/admin/templates',
  },
  {
    key: 'translation',
    label: <TranslatedText stringId="adminSidebar.translation" fallback="Translation" />,
    path: '/admin/translation',
    ability: { action: 'write', subject: 'translation' },
  },
  {
    key: 'assets',
    label: <TranslatedText stringId="adminSidebar.assetUpload" fallback="Asset upload" />,
    path: '/admin/assets',
  },
  {
    key: 'sync',
    label: <TranslatedText stringId="adminSidebar.syncStatus" fallback="Sync status" />,
    path: '/admin/sync',
  },
  {
    key: 'settings',
    label: <TranslatedText stringId="adminSidebar.settings" fallback="Settings" />,
    path: '/admin/settings',
    ability: { action: 'write', subject: 'settings' },
  },
  {
    key: 'fhirJobStats',
    label: <TranslatedText stringId="adminSidebar.fhirJobStats" fallback="FHIR job stats" />,
    path: '/admin/fhir/jobStats',
  },
  {
    key: 'reports',
    label: <TranslatedText stringId="adminSidebar.reports" fallback="Reports" />,
    path: '/admin/reports',
  },
  {
    key: 'Insurer payments',
    label: <TranslatedText stringId="adminSidebar.insurerPayments" fallback="Insurer payments" />,
    path: '/admin/insurerPayments',
  },
];
