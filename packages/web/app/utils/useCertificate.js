import { useSelector } from 'react-redux';
import { ASSET_NAMES, SETTING_KEYS } from '@tamanu/constants';
import { useAssetQuery } from '../api/queries/useAssetQuery';
import { getCurrentUser } from '../store';
import { useSettings } from '../contexts/Settings';

export const useCertificate = ({ footerAssetName } = {}) => {
  const { getSetting } = useSettings();

  const { data: logo, isFetching: isLogoFetching } = useAssetQuery(ASSET_NAMES.LETTERHEAD_LOGO);
  const { data: watermark, isFetching: isWatermarkFetching } = useAssetQuery(
    ASSET_NAMES.VACCINE_CERTIFICATE_WATERMARK,
  );
  const { data: footerImg, isFetching: isFooterImgFetching } = useAssetQuery(
    footerAssetName || ASSET_NAMES.CERTIFICATE_BOTTOM_HALF_IMG,
  );
  const { data: deathCertFooterImg, isFetching: isDeathCertFooterImgFetching } = useAssetQuery(
    ASSET_NAMES.DEATH_CERTIFICATE_BOTTOM_HALF_IMG,
  );
  const { title, subTitle } = getSetting(SETTING_KEYS.TEMPLATES_LETTERHEAD);

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
