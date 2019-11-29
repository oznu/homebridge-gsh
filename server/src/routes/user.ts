import * as express from 'express';
import secured from '../lib/middleware/secured';
import * as jwt from 'jsonwebtoken';

import { core } from '../index';

const router = express.Router();

/* GET user profile. */
router.get('/token', (req: any, res, next) => {
  if (!req.user) {
    return res.sendStatus(401);
  }
  const { _raw, _json, ...userProfile } = req.user;

  jwt.sign({ id: userProfile.id }, process.env.JWT_SECRET, (err, token) => {
    res.json({
      token,
    });
  });
});

/* GET user connected status */
router.post('/is-connected', async (req, res, next) => {
  if (!req.headers.token || req.headers.token !== process.env.AUTH0_GSH_API_SECRET) {
    return res.sendStatus(401);
  }
  if (!req.body.clientId || typeof req.body.clientId !== 'string') {
    return res.sendStatus(400);
  }

  const isConnected = await core.wss.isConnected(req.body.clientId);

  console.log(`AUTH0 Connection Check :: ${req.body.clientId} ::`, isConnected);

  return res.json({
    connected: isConnected,
  });
});

router.get('/link-account', secured(), (req, res, next) => {
  res.redirect('/link-account');
});

export default router;
