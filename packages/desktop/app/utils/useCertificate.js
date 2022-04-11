import { useSelector } from 'react-redux';
import { useLocalisation } from '../contexts/Localisation';
import { useAsset } from './useAsset';
import { getCurrentUser } from '../store';

export const useCertificate = () => {
  const { getLocalisation } = useLocalisation();
  const [logo, logoType] = useAsset('letterhead-logo');
  const [watermark, watermarkType] = useAsset('vaccine-certificate-watermark');
  const [footerImg, footerImgType] = useAsset('asset/certificate-bottom-half-img');

  const title = getLocalisation('templates.letterhead.title');
  const subTitle = getLocalisation('templates.letterhead.subTitle');

  const currentUser = useSelector(getCurrentUser);

  return {
    title,
    subTitle,
    logo,
    logoType,
    watermark,
    watermarkType,
    footerImg,
    footerImgType,
    printedBy: currentUser?.displayName,
  };
};
