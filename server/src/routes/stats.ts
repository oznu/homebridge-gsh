import * as express from 'express';

const router = express.Router();

import { core } from '../index';

router.get('/connected', (req, res, next) => {
  res.json({
    connected: core.wss.countConnectedClients(),
  });
});

export default router;
