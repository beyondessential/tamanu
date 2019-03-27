export default function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const { field, message = 'An error occurred', status = 500 } = err;

  const error = {};

  if (field) {
    error[field] = { errors: [message] };
  } else {
    error.errors = Array.isArray(message) ? message : [message];
  }

  return res.status(status).json(error);
}
