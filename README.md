# Homebridge to Google Smart Home

Control your supported Homebridge accessories from any Google Home speaker or the Google Home mobile app. Inspired by [homebridge-alexa](https://github.com/NorthernMan54/homebridge-alexa).

## Supported Device Types

* Switch
* Outlet
* Window Coverings

## Installation Instructions

```
sudo npm install -g --unsafe-perm homebridge-gsh
```

## Configuration

To configure `homebridge-gsh` you must also be running [homebridge-config-ui-x](https://github.com/oznu/homebridge-config-ui-x).

1. Navigate to the Plugins page in [homebridge-config-ui-x](https://github.com/oznu/homebridge-config-ui-x).
2. Click the **Settings** button for the Google Smart Home plugin:
3. Click the **Link Account** button.
4. Sign in with your Google or GitHub account.
5. Your account is now linked.
6. Restart Homebridge for the changes to take effect.

## Credits

* [NorthernMan54](https://github.com/NorthernMan54) - developer of the [Hap-Node-Client](https://github.com/NorthernMan54/Hap-Node-Client) module which is used by this plugin.

## License

**Homebridge to Google Smart Home** is free software, and is released under the terms of the GNU General Public License (GPL) Version 3. See [LICENSE](LICENSE).
## Sponsors

TBA