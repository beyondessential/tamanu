
function decodeToken(token) {
  if(token.match(/debug/)) {
    return { userId: "debug" };
  } else {
    return null;
  }
}

function getUserFromToken(request) {
  const authHeader = request.headers.authorization || "";
  const bearer = authHeader.match(/Bearer (\S*)/);
  if(!bearer) return null;

  const token = bearer[1];
  try {
    const { userId } = decodeToken(token);
    return { _id: userId };
  } catch(e) {
    return null;
  }
}

export const authMiddleware = (req, res, next) => {
  const user = getUserFromToken(req);
  if(!user) {
    res.status(403);
    throw new Error("This action can only be performed by an authenticated user.");
  }

  req.user = user;
  next();
};

