import { log } from '../logging';

function getCodeForErrorName(name) {
  switch (name) {
    case 'SequelizeUniqueConstraintError':
    case 'SequelizeValidationError':
      return 400;
    default:
      return 500;
  }
}

export default function errorHandler(error, req, res, _) {
  const code = getCodeForErrorName(error.name);
  if (code >= 500) {
    log.error(`Error ${code}`, error);
  } else {
    log.info(`Error ${code}`, error);
  }
  res.status(code).send({ error });
}
