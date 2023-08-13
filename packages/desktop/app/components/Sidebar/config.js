import { patientIcon } from '../../constants/images';
import { Colors } from '../../constants';

export const FACILITY_MENU_ITEMS = [
  {
    key: 'patients',
    label: 'Patients',
    path: '/patients',
    icon: patientIcon,
    ability: { subject: 'patient' },
    children: [
      {
        label: 'All patients',
        color: Colors.blue,
        path: '/patients/all',
        ability: { action: 'read' },
      },
    ],
  },
];

export const SYNC_MENU_ITEMS = [];
