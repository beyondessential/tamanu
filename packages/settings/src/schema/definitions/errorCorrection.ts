import * as yup from 'yup';

import type { Setting } from '../../types';

// spec: FEC
// Error correction over the blob store, per server. Off by default, and worth
// turning on where a copy is effectively isolated — bare metal and NTFS, where
// the filesystem cannot repair bit rot and a restore is a human action.
export const errorCorrectionProperties = (): Record<string, Setting> => ({
  enabled: {
    name: 'Error correction',
    description:
      'Store parity data alongside blobs on this server, so limited corruption is repaired in place without needing another copy. Worth enabling on storage that provides no redundancy of its own, chiefly bare-metal and NTFS deployments. Existing blobs are brought under protection over one scrub cycle',
    type: yup.boolean(),
    defaultValue: false,
  },
  parityPercent: {
    name: 'Parity',
    description:
      'How much of a blob can be recovered, as a percentage of its size, and roughly how much extra disk the store uses. Raising it costs encode time in direct proportion: at 50% an upload spends five times as long computing parity as at the 10% default. Applies to parity computed from the point it changes; blobs already protected keep the parity they have',
    type: yup.number().min(3).max(50),
    defaultValue: 10,
    unit: '%',
  },
});
