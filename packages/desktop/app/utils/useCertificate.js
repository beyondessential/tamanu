import { useSelector } from 'react-redux';
import { useLocalisation } from '../contexts/Localisation';
import { useAsset } from './useAsset';
import { useSetting } from './useSetting';
import { getCurrentUser } from '../store';

export const useCertificate = () => {
  const { getLocalisation } = useLocalisation();
  const logo = useAsset('letterhead-logo');
  const watermark = useAsset('vaccine-certificate-watermark');
  const footerImg = useAsset('certificate-bottom-half-img');
  const deathCertFooterImg = useAsset('death-certificate-bottom-half-img');

  const title =
    useSetting('templates.letterhead.title') || getLocalisation('templates.letterhead.title');
  const subTitle =
    useSetting('templates.letterhead.subTitle') || getLocalisation('templates.letterhead.subTitle');

  const currentUser = useSelector(getCurrentUser);

  return {
    title,
    subTitle,
    logo,
    watermark,
    footerImg,
    deathCertFooterImg,
    printedBy: currentUser?.displayName,
  };
};
