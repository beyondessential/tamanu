import { createAskAiRouter, askAiPublicRouter } from '@tamanu/shared/services/askAiRouter';

export { askAiPublicRouter };

export const askAi = createAskAiRouter(req =>
  req.settings[req.facilityId]?.getFrontEndSettings(),
);
