export const allowListMiddleware = names => (req, res, next) => {
  const firstSegment = (req.path || '').replace(/^\//, '').split('/')[0];
  if (!names.includes(firstSegment)) {
    res.status(404).end();
    return;
  }
  next();
};


