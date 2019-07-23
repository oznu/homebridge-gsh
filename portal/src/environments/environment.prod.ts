export const environment = {
  production: true,
  socketUrl: `${(window.location.protocol) === 'http:' ? 'ws://' : 'wss://'}${window.location.host}`,
  api: {
    base: '/api',
  },
  jwt: {
    tokenKey: 'access_token',
    whitelistedDomains: [document.location.host],
    blacklistedRoutes: [`${document.location.host}/api/login`],
  },
  amazon: {
    clientId: 'amzn1.application-oa2-client.6bf64ddf771d4e3fa5c3a09aa8008549'
  }
};
