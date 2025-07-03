import React from 'react';
import { Stack, Typography } from '@mui/material';
import { Syringe } from 'lucide-react';

import { AccordionSection } from '../AccordionSection';
import { StyledCircularProgress } from '../StyledCircularProgress';
import { useAdministeredVaccinesQuery } from '../../api/queries/useAdministeredVaccinesQuery';
import { useUpcomingVaccinesQuery } from '../../api/queries/useUpcomingVaccinesQuery';
import { RecordedVaccineCard } from './Vaccinations/RecordedVaccineCard';
import { UpcomingVaccineCard } from './Vaccinations/UpcomingVaccineCard';

export const VaccinationsSection = () => {
  const { data: administeredVaccines, isLoading: isLoadingAdministered } =
    useAdministeredVaccinesQuery();
  const { data: upcomingVaccines, isLoading: isLoadingUpcoming } = useUpcomingVaccinesQuery();

  const isLoading = isLoadingAdministered || isLoadingUpcoming;

  return (
    <AccordionSection header="Vaccinations" icon={<Syringe />}>
      {isLoading ? (
        <StyledCircularProgress size={24} />
      ) : (
        <Stack spacing={3}>
          {/* Vaccine Schedule Subsection */}
          <Stack spacing={2}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Vaccine schedule
            </Typography>
            {upcomingVaccines && upcomingVaccines.length > 0 ? (
              <Stack spacing={2}>
                {upcomingVaccines.map(vaccine => (
                  <UpcomingVaccineCard key={vaccine.id} vaccine={vaccine} />
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">No upcoming vaccinations scheduled.</Typography>
            )}
          </Stack>

          {/* Recorded Vaccines Subsection */}
          <Stack spacing={2}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Recorded vaccines
            </Typography>
            {administeredVaccines && administeredVaccines.length > 0 ? (
              <Stack spacing={2}>
                {administeredVaccines.map(vaccine => (
                  <RecordedVaccineCard key={vaccine.id} vaccine={vaccine} />
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">No vaccinations recorded.</Typography>
            )}
          </Stack>
        </Stack>
      )}
    </AccordionSection>
  );
};
