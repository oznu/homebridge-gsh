export class Log {
  private logger: any;
  private debugMode: boolean;

  constructor(logger, debugMode: boolean) {
    this.logger = logger;
    this.debugMode = debugMode;
  }

  debug(msg) {
    if (this.debugMode) {
      this.logger.info(msg);
    } else {
      this.logger.debug(msg);
    }
  }

  info(msg) {
    this.logger.info(msg);
  }

  warn(msg) {
    this.logger.warn(msg);
  }

  error(msg) {
    this.logger.error(msg);
  }
}