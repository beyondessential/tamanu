import { useSelector } from 'react-redux';
import { ASSET_NAMES } from '@tamanu/constants';
import { useSettings } from '../contexts/Settings';
import { useAsset } from './useAsset';
import { useTemplate } from './useTemplate';
import { getCurrentUser } from '../store';

export const useCertificate = ({ footerAssetName } = {}) => {
  const { getSetting } = useSettings();
  const logo = useAsset(ASSET_NAMES.LETTERHEAD_LOGO);
  const watermark = useAsset(ASSET_NAMES.VACCINE_CERTIFICATE_WATERMARK);
  const footerImg = useAsset(footerAssetName || ASSET_NAMES.CERTIFICATE_BOTTOM_HALF_IMG);
  const deathCertFooterImg = useAsset(ASSET_NAMES.DEATH_CERTIFICATE_BOTTOM_HALF_IMG);
  const letterhead = useTemplate('localisation.templates.letterhead')?.data;
  const title = letterhead?.data?.title || getSetting('localisation.templates.letterhead.title');
  const subTitle =
    letterhead?.data?.subTitle || getSetting('localisation.templates.letterhead.subTitle');

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
