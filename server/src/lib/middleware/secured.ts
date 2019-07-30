export default () => {
  return function secured(req: any, res, next) {
    if (req.user) { return next(); }
    req.session.returnTo = req.originalUrl;
    res.redirect('/auth/logout');
  };
};