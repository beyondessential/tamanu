import React, { useEffect } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { VaccineCertificate } from 'shared/utils';
import { useLocalisation } from '../contexts/Localisation';

export const ImmunisationCertificate = ({ patient, immunisations, watermark, footerImg, logo }) => {
  const { getLocalisation } = useLocalisation();

  const certificate = React.useMemo(() => {
    return (
      <VaccineCertificate
        patient={patient}
        vaccinations={immunisations}
        watermarkSrc={watermark}
        logoSrc={logo}
        signingSrc={footerImg}
        getLocalisation={getLocalisation}
      />
    );
  }, [patient, immunisations, watermark, footerImg, logo, getLocalisation]);

  const [instance, updateInstance] = usePDF({ document: certificate });

  useEffect(() => {
    updateInstance();
  }, [updateInstance, certificate]);

  const handlePrint = () => {
    console.log('print me');
    const iframe = document.getElementById('frameId');
    iframe.contentWindow.print();
  };

  return (
    <div>
      <button onClick={handlePrint}>Print</button>
      <iframe
        src={`${instance.url}#toolbar=0`}
        title="vaccine-certificate"
        id="frameId"
        width={800}
        height={1000}
      />
    </div>
  );
};
