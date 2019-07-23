// routes/auth.js

import * as express from 'express';

import * as  passport from 'passport';
import * as  dotenv from 'dotenv';
import * as  util from 'util';
import * as  url from 'url';
import * as  querystring from 'querystring';

const router = express.Router();

// Perform the login, after login Auth0 will redirect to callback
router.get('/login', passport.authenticate('auth0', {
  scope: 'openid email profile',
}), (req, res) => {
  res.redirect('/');
});

// Perform the final stage of authentication and redirect to previously requested URL or '/user'
router.get('/callback', (req, res, next) => {
  passport.authenticate('auth0', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }
    req.logIn(user, (err2) => {
      if (err2) { return next(err2); }
      const returnTo = req.session.returnTo;
      delete req.session.returnTo;
      res.redirect(returnTo || '/user');
    });
  })(req, res, next);
});

// Perform session logout and redirect to homepage
router.get('/logout', (req, res) => {
  req.logout();

  const logoutURL = new URL(
    util.format('https://%s/v2/logout', process.env.AUTH0_DOMAIN),
  );
  const searchString = querystring.stringify({
    client_id: process.env.AUTH0_CLIENT_ID,
    returnTo: process.env.AUTH0_LOGOUT_URL,
  });
  logoutURL.search = searchString;

  res.redirect(logoutURL);
});

export default router;
