export default function errorHandler(err, req, res, next) {
  switch(error.name) {
    case 'SequelizeUniqueConstraintError':
    case 'SequelizeValidationError':
      res.status(400).send({ error });
      return;
    default:
      console.error(error);
      res.status(500).send({ error });
      return;
  }
}
