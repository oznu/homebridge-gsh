# Contributing

Pull requests are welcome from everyone.

This project is written in [TypeScript](https://www.typescriptlang.org/) and [Angular](https://angular.io/) for the server portal UI.

## Getting Setup

First, remove any globally installed versions of `homebridge-gsh` you may have installed on your development machine:

```
npm uninstall -g homebridge-gsh
```

Fork, then clone the repo:

```
git clone git@github.com:your-username/homebridge-gsh.git
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

You can now run `homebridge` and it will use `homebridge-gsh` from your development directory. 
