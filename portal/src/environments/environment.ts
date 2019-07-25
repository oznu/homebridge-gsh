// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  socketUrl: 'ws://localhost:3000',
  api: {
    base: `http://${document.location.hostname}:3000`,
  },
  jwt: {
    tokenKey: 'access_token',
    whitelistedDomains: [`${document.location.hostname}:8080`],
  },
  amazon: {
    clientId: 'amzn1.application-oa2-client.6bf64ddf771d4e3fa5c3a09aa8008549'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
