<p align="center">
    <img src="https://raw.githubusercontent.com/homebridge/branding/master/logos/homebridge-color-round-stylized.png" height="140"><br>
    <img src="https://user-images.githubusercontent.com/3979615/62948974-ba97f180-be28-11e9-8aef-d2a1d2f37cee.png" width="150">
</p>

<span align="center">

# Homebridge to Google Smart Home

[![npm](https://img.shields.io/npm/v/homebridge-gsh.svg)](https://www.npmjs.com/package/homebridge-gsh)
[![npm](https://img.shields.io/npm/dt/homebridge-gsh.svg)](https://www.npmjs.com/package/homebridge-gsh)
[![Discord](https://img.shields.io/discord/432663330281226270?color=728ED5&logo=discord&label=discord)](https://discord.gg/cFFBuvp)
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![Donate](https://img.shields.io/badge/donate-paypal-yellowgreen.svg)](https://paypal.me/oznu)

</span>

<!-- # Homebridge to Google Smart Home

[![npm](https://img.shields.io/npm/v/homebridge-gsh.svg)](https://www.npmjs.com/package/homebridge-gsh)
[![npm](https://img.shields.io/npm/dt/homebridge-gsh.svg)](https://www.npmjs.com/package/homebridge-gsh)
[![Discord](https://img.shields.io/discord/432663330281226270?color=728ED5&logo=discord&label=discord)](https://discord.gg/cFFBuvp)
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![Donate](https://img.shields.io/badge/donate-paypal-yellowgreen.svg)](https://paypal.me/oznu) -->

Control your supported [Homebridge](https://github.com/nfarina/homebridge) accessories from any Google Home speaker or the Google Home mobile app. Inspired by [homebridge-alexa](https://github.com/NorthernMan54/homebridge-alexa).

* [Supported Device Types](#supported-device-types)
* [Installation Instructions](#installation-instructions)
* [Configuration](#configuration)
* [Known Issues](#known-issues)
* [Troubleshooting](#troubleshooting)
* [Credits](#credits)
* [License](#license)
* [Sponsors](#sponsors)

## Supported Device Types

* Switch
* Outlet
* Air Purifier
* Light Bulb
    * On / Off
    * Brightness
    * Color (Hue/Saturation)
* Fan (On / Off)
* Fan v2 (On / Off)
* Window
* Window Coverings
* Door
* Garage Door (2FA required)
* Thermostat / Heater Cooler
* Television (On / Off)
* Lock Mechanism (2FA required)
* Security System (2FA required)
* Temperature Sensor
* Humidity Sensor

*Note: Google Smart Home does not currently support all "sensor" devices such as Motion Sensors or Occupancy Sensors etc.*

## Installation Instructions

As this is a fork it needs to be manually installed 

clone repo 
```bash
git clone https://github.com/ewandank/homebridge-gsh-air-purifier/
```
install depenedecies
```bash
npm install
```
Build plugin 
 ```
 npm run build:plugin
 ```
 In the plugin built directory: 
 ```
 npm link
 ```
 In the homebridge directory
 ```
 npm link homebridge-gsh
 ```
## Configuration

To configure `homebridge-gsh` you must also be running [homebridge-config-ui-x](https://github.com/oznu/homebridge-config-ui-x).

1. Navigate to the Plugins page in [homebridge-config-ui-x](https://github.com/oznu/homebridge-config-ui-x).
2. Click the **Settings** button for the Google Smart Home plugin.
3. Click the **Link Account** button.
4. Sign in with your Google or GitHub account.
5. Your account is now linked.
6. Restart Homebridge for the changes to take effect.
7. Add the [Homebridge Action](https://assistant.google.com/services/a/uid/000000b558f0d5d1?hl=en) using the Google Home mobile app. [See Wiki](https://github.com/oznu/homebridge-gsh/wiki#add-homebridge-to-google-home-app) for detailed instructions.

![homebridge-gsh-signup](https://user-images.githubusercontent.com/3979615/62948031-ff228d80-be26-11e9-9e07-ef1023f28fa8.gif)

### Enabling Accessory Control

Homebridge must be running in insecure mode to allow accessory control via this plugin. See [Enabling Accessory Control](https://github.com/oznu/homebridge-config-ui-x/wiki/Enabling-Accessory-Control) for instructions.

### Multiple Homebridge Instances

This plugin **must** only be configured on one Homebridge instance on your network as the plugin will discover all your other Homebridge instances and be able to control them. For this to work:

* all instances must be running [in insecure mode](https://github.com/oznu/homebridge-config-ui-x/wiki/Enabling-Accessory-Control)
* all instances must have the same PIN defined in the `config.json`

## Known Issues

1. Only one Homebridge instance can be linked to an account (even across different local networks). You will experience unintended results if you try and link more than one instance to the same account.

## Troubleshooting

#### 1. Errors during installation

Make sure you installed the package with `sudo` flag. Most installation errors can be fixed by removing the plugin and reinstalling:

```shell
# cleanup
sudo npm uninstall -g homebridge-gsh

# reinstall
sudo npm install -g homebridge-gsh
```

#### 2. Cannot control accessories

See [Enabling Accessory Control](https://github.com/oznu/homebridge-config-ui-x/wiki/Enabling-Accessory-Control) and [Multiple Homebridge Instances](#multiple-homebridge-instances).

#### 3. Ask on Discord

Join the [Official Homebridge Discord](https://discord.gg/cFFBuvp) community and ask in the [#homebridge-gsh](https://discord.gg/cFFBuvp) channel.

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md).

## Credits

* [NorthernMan54](https://github.com/NorthernMan54) - developer of the [Hap-Node-Client](https://github.com/NorthernMan54/Hap-Node-Client) module which is used by this plugin.

## License

Copyright (C) 2019 oznu

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the [GNU General Public License](./LICENSE) for more details.

## Sponsors

<a width="150" height="50" href="https://auth0.com/?utm_source=oss&utm_medium=gp&utm_campaign=oss" target="_blank" alt="Single Sign On & Token Based Authentication - Auth0"><img width="150" height="50" alt="JWT Auth for open source projects" src="https://cdn.auth0.com/oss/badges/a0-badge-dark.png"/></a>
