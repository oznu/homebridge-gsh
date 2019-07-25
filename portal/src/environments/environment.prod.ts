export const environment = {
  production: true,
  socketUrl: `${(window.location.protocol) === 'http:' ? 'ws://' : 'wss://'}${window.location.host}`,
  api: {
    base: '',
  },
  jwt: {
    tokenKey: 'access_token',
    whitelistedDomains: [document.location.host],
  },
  amazon: {
    clientId: 'amzn1.application-oa2-client.6bf64ddf771d4e3fa5c3a09aa8008549'
  }
};
