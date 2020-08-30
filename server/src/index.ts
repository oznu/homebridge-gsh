#!/usr/bin/env node

import 'source-map-support/register';

import * as http from 'http';
import * as dotenv from 'dotenv';
import * as Redis from 'ioredis';
import app from './app';
import wss from './wss';
import gsh from './gsh';

// Load environment variables from .env
dotenv.config();

const redisConfig: Redis.RedisOptions = {
  port: process.env.GSH_REDIS_PORT ? parseInt(process.env.GSH_REDIS_PORT, 10) : 6379,
  host: process.env.GSH_REDIS_HOST || '127.0.0.1',
  family: process.env.GSH_REDIS_FAMILY ? parseInt(process.env.GSH_REDIS_FAMILY, 10) : 4,
  password: process.env.GSH_REDIS_PASSWORD,
  db: process.env.GSH_REDIS_DB ? parseInt(process.env.GSH_REDIS_DB, 10) : 0,
};

class Core {
  private server;
  public wss: wss;
  public gsh: gsh;
  public pub = new Redis(redisConfig);
  public sub = new Redis(redisConfig);

  constructor(port: number) {
    this.gsh = new gsh();
    app.post('/gsh', this.gsh.app as any);
    this.server = http.createServer(app);
    this.wss = new wss(this.server, this.sub, this.pub);
    this.server.listen(port);
  }
}

export const core = new Core(parseInt(process.env.GSH_WORKER_PORT || '3000', 10));