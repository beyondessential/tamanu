import { useSelector } from 'react-redux';
import { ASSET_NAMES, SETTING_KEYS } from '@tamanu/constants';
import { useLocalisation } from '../contexts/Localisation';
import { useAsset } from '../api/queries/useAsset';
import { getCurrentUser } from '../store';
import { useSettings } from '../contexts/Settings';

export const useCertificate = ({ footerAssetName } = {}) => {
  const { getLocalisation } = useLocalisation();
  const { getSetting } = useSettings();

  const { data: logo, isFetching: isLogoFetching } = useAsset(ASSET_NAMES.LETTERHEAD_LOGO);
  const { data: watermark, isFetching: isWatermarkFetching } = useAsset(
    ASSET_NAMES.VACCINE_CERTIFICATE_WATERMARK,
  );
  const { data: footerImg, isFetching: isFooterImgFetching } = useAsset(
    footerAssetName || ASSET_NAMES.CERTIFICATE_BOTTOM_HALF_IMG,
  );
  const { data: deathCertFooterImg, isFetching: isDeathCertFooterImgFetching } = useAsset(
    ASSET_NAMES.DEATH_CERTIFICATE_BOTTOM_HALF_IMG,
  );
  const letterhead = getSetting(SETTING_KEYS.TEMPLATES_LETTERHEAD);
  const title = letterhead?.title || getLocalisation('templates.letterhead.title');
  const subTitle = letterhead?.subTitle || getLocalisation('templates.letterhead.subTitle');

  const isFetching =
    isLogoFetching || isWatermarkFetching || isFooterImgFetching || isDeathCertFooterImgFetching;

  const currentUser = useSelector(getCurrentUser);

  const data = {
    title,
    subTitle,
    logo,
    watermark,
    footerImg,
    deathCertFooterImg,
    printedBy: currentUser?.displayName,
  };

  return {
    data,
    isFetching,
  };
};
