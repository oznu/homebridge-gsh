import * as express from 'express';
import secured from '../lib/middleware/secured';
import * as jwt from 'jsonwebtoken';

const router = express.Router();

/* GET user profile. */
router.get('/profile', secured(), (req, res, next) => {
  res.sendStatus(200);
});

/* GET user profile. */
router.get('/link-account', secured(), (req, res, next) => {
  const { _raw, _json, ...userProfile } = req.user;

  jwt.sign({ id: userProfile.id }, process.env.JWT_SECRET, (err, token) => {
    res.render('pages/link-account', {
      token,
    });
  });
});

export default router;
