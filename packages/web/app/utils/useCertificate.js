import { useSelector } from 'react-redux';
import { ASSET_NAMES, SETTING_KEYS } from '@tamanu/constants';
import { useAssetQuery } from '../api/queries/useAssetQuery';
import { getCurrentUser } from '../store';
import { useSettings } from '../contexts/Settings';

export const useCertificate = ({ footerAssetName } = {}) => {
  const { getSetting } = useSettings();

  const {
    data: logo,
    isFetching: isLogoFetching,
    isPending: isLogoPending,
  } = useAssetQuery(ASSET_NAMES.LETTERHEAD_LOGO);
  const {
    data: watermark,
    isFetching: isWatermarkFetching,
    isPending: isWatermarkPending,
  } = useAssetQuery(ASSET_NAMES.VACCINE_CERTIFICATE_WATERMARK);
  const {
    data: footerImg,
    isFetching: isFooterImgFetching,
    isPending: isFooterImgPending,
  } = useAssetQuery(footerAssetName || ASSET_NAMES.CERTIFICATE_BOTTOM_HALF_IMG);
  const {
    data: deathCertFooterImg,
    isFetching: isDeathCertFooterImgFetching,
    isPending: isDeathCertFooterImgPending,
  } = useAssetQuery(ASSET_NAMES.DEATH_CERTIFICATE_BOTTOM_HALF_IMG);
  const { title, subTitle } = getSetting(SETTING_KEYS.TEMPLATES_LETTERHEAD);

  const isFetching =
    isLogoFetching || isWatermarkFetching || isFooterImgFetching || isDeathCertFooterImgFetching;

  // spec: ASSET — at least one asset exists but its bytes have not reached this
  // facility, so the document would print without artwork it is meant to carry.
  const isPending =
    isLogoPending || isWatermarkPending || isFooterImgPending || isDeathCertFooterImgPending;

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
    isPending,
  };
};
