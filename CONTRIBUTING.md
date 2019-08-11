# Contributing

Pull requests are welcome from everyone.

This project is written in [TypeScript](https://www.typescriptlang.org/) and [Angular](https://angular.io/) for the server portal UI.

## Getting Setup

First, remove any globally installed versions of `homebridge-gsm` you may have installed on your development machine:

```
npm uninstall -g homebridge-gsm
```

Fork, then clone the repo:

```
git clone git@github.com:your-username/homebridge-gsm.git
```

Install npm dependencies for the plugin:

```
npm install
```

Build the plugin:

```
npm run build:plugin
```

Symlink your development directory to global:

```
npm link
```

You can now run `homebridge` and it will use `homebridge-gsm` from your development directory. 

## Contributing To Cloud Components

This plugin also depends on some cloud components, such as the account linking and message routing services.

Install the npm dependencies for the server and portal:

```
npm run install:server
npm run install:portal
```

Build the services, it may take sometime to compile the UI:

```
npm run build
```

Start the server:

```
npm run start:server
```

## Contributing To Translations

Additional language translations, or improvements to existing translations are most welcome.  Translations can be found here: 

https://github.com/oznu/homebridge-gsh/tree/master/i18n
