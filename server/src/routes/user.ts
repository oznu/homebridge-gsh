import * as express from 'express';
import secured from '../lib/middleware/secured';
import * as jwt from 'jsonwebtoken';

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

router.get('/link-account', secured(), (req, res, next) => {
  res.redirect('/link-account');
});

export default router;
