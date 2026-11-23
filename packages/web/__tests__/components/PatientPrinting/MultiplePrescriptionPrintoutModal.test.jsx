import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

import { createQueryClient } from '../../helpers';

const mocks = vi.hoisted(() => ({
  printout: vi.fn(() => <div data-testid="prescription-printout" />),
  api: { get: vi.fn() },
}));

vi.mock('@tamanu/shared/utils/patientCertificates', () => ({
  PrescriptionPrintout: mocks.printout,
}));

// Rendering the PDF itself is out of scope here; the printout component is stubbed above.
vi.mock('../../../app/components/PatientPrinting/PDFLoader', () => ({
  PDFLoader: ({ isLoading, children }) => (isLoading ? null : children),
  printPDF: () => {},
}));
vi.mock('../../../app/components/Modal', () => ({
  Modal: ({ children }) => <div>{children}</div>,
}));

vi.mock('@tamanu/ui-components', async importOriginal => ({
  ...(await importOriginal()),
  useDateTime: () => ({ primaryTimeZone: 'Pacific/Auckland' }),
}));
vi.mock('../../../app/api/useApi', () => ({ useApi: () => mocks.api }));
vi.mock('../../../app/utils/useCertificate', () => ({
  useCertificate: () => ({ data: {}, isFetching: false }),
}));
vi.mock('../../../app/api/queries/usePatientAdditionalDataQuery', () => ({
  usePatientAdditionalDataQuery: () => ({ data: {}, isLoading: false }),
}));
vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({ facilityId: 'facility-1' }),
}));
vi.mock('../../../app/contexts/Settings', () => ({
  useSettings: () => ({ getSetting: () => undefined }),
}));

const { MultiplePrescriptionPrintoutModal } =
  await import('../../../app/components/PatientPrinting/modals/MultiplePrescriptionPrintoutModal');

const villages = {
  'village-old': { id: 'village-old', name: 'Old village' },
  'village-new': { id: 'village-new', name: 'New village' },
};

const serveApi = ({ patientVillageId }) => {
  mocks.api.get.mockImplementation(async ({ template, params }) => {
    const [resource] = template.split('/');
    const [id] = Object.values(params);
    if (resource === 'patient') return { id, villageId: patientVillageId };
    if (resource === 'referenceData') return villages[id];
    return { id };
  });
};

const renderModal = queryClient =>
  render(
    <QueryClientProvider client={queryClient}>
      <MultiplePrescriptionPrintoutModal
        open
        onClose={() => {}}
        encounter={{ id: 'encounter-1', patientId: 'patient-1' }}
        prescriberId="prescriber-1"
        prescriptions={[]}
      />
    </QueryClientProvider>,
  );

const printedVillageName = () => mocks.printout.mock.lastCall?.[0].patientData.village.name;

describe('MultiplePrescriptionPrintoutModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prints the patient's current village after it changes between openings", async () => {
    const queryClient = createQueryClient();

    serveApi({ patientVillageId: 'village-old' });
    const firstOpening = renderModal(queryClient);
    await waitFor(() => expect(printedVillageName()).toBe('Old village'));
    firstOpening.unmount();

    serveApi({ patientVillageId: 'village-new' });
    renderModal(queryClient);
    await waitFor(() => expect(printedVillageName()).toBe('New village'));
  });
});
