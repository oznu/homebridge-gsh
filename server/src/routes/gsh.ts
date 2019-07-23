import * as uuidv4 from 'uuid/v4';
import * as express from 'express';
import * as rp from 'request-promise';
import * as cacheManager from 'cache-manager';

const router = express.Router();
const memoryCache = cacheManager.caching({ store: 'memory', max: 1000, ttl: 3600 });

import { core } from '../index';

router.post('/', async (req, res, next) => {
  if (req.headers.authorization) {
    // load profile from memory cache
    let profile = await memoryCache.get(req.headers.authorization);

    if (!profile) {
      // if the profile was not found do a lookup
      try {
        profile = await rp.get('https://oznu.auth0.com/userinfo', {
          json: true,
          headers: {
            authorization: req.headers.authorization,
          },
        });
        await memoryCache.set(req.headers.authorization, profile);
      } catch (e) {
        return res.sendStatus(401);
      }
    }

    // remove certain headers
    delete req.headers.authorization;

    const clientId = profile.sub;
    const requestId = uuidv4();
    const payload = {
      body: req.body,
      headers: req.headers,
      requestId,
      requestTime: new Date().toISOString(),
    };

    core.wss.sendToClient(clientId, payload);

    const timeoutHandler = setTimeout(() => {
      console.log(requestId, ':: Timeout');
      core.wss.removeAllListeners(requestId);
      res.sendStatus(503);
    }, 5000);

    core.wss.once(requestId, (response) => {
      clearTimeout(timeoutHandler);
      console.log(requestId, ':: Sending Response:', '\n' + JSON.stringify(response, null, 4));
      res.json(response);
    });

  } else {
    res.sendStatus(401);
    return true;
  }
});

export default router;
