import { Characteristic } from '../hap-types';

export class Lightbulb {
  sync(service) {

    const attributes = {} as any;
    const traits = [
      'action.devices.traits.OnOff',
    ];

    // check if the bulb has the brightness characteristic
    if (service.characteristics.find(x => x.type === Characteristic.Brightness)) {
      traits.push('action.devices.traits.Brightness');
    }

    // check if the bulb has color
    if (service.characteristics.find(x => x.type === Characteristic.Hue)) {
      traits.push('action.devices.traits.ColorSetting');
      attributes.colorModel = 'hsv';
      attributes.colorTemp;
    }

    return {
      id: service.uniqueId,
      type: 'action.devices.types.LIGHT',
      traits,
      attributes,
      name: {
        defaultNames: [
          service.serviceName,
          service.accessoryInformation.Name,
        ],
        name: service.serviceName,
        nicknames: [],
      },
      willReportState: true,
      deviceInfo: {
        manufacturer: service.accessoryInformation.Manufacturer,
        model: service.accessoryInformation.Model,
      },
      customData: {
        aid: service.aid,
        iid: service.iid,
        instanceUsername: service.instance.username,
        instanceIpAddress: service.instance.ipAddress,
        instancePort: service.instance.port,
      },
    };
  }

  query(service) {
    const response = {
      on: service.characteristics.find(x => x.type === Characteristic.On).value,
      online: true,
    } as any;

    // check if the bulb has the brightness characteristic
    if (service.characteristics.find(x => x.type === Characteristic.Brightness)) {
      response.brightness = service.characteristics.find(x => x.type === Characteristic.Brightness).value;
    }

    // check if the bulb has color
    if (service.characteristics.find(x => x.type === Characteristic.Hue)) {
      response.spectrumHSV = {
        hue: service.characteristics.find(x => x.type === Characteristic.Hue).value,
        saturation: service.characteristics.find(x => x.type === Characteristic.Saturation).value,
        value: 1,
      };
    }

    return response;
  }

  execute(service, command) {
    if (!command.execution.length) {
      return { characteristics: [] };
    }

    switch (command.execution[0].command) {
      case ('action.devices.commands.OnOff'): {
        return {
          characteristics: [{
            aid: service.aid,
            iid: service.characteristics.find(x => x.type === Characteristic.On).iid,
            value: command.execution[0].params.on,
          }],
        };
      }
      case ('action.devices.commands.BrightnessAbsolute'): {
        return {
          characteristics: [{
            aid: service.aid,
            iid: service.characteristics.find(x => x.type === Characteristic.Brightness).iid,
            value: command.execution[0].params.brightness,
          },
          {
            aid: service.aid,
            iid: service.characteristics.find(x => x.type === Characteristic.On).iid,
            value: command.execution[0].params.brightness ? true : false,
          }],
        };
      }
      case ('action.devices.commands.ColorAbsolute'): {
        return {
          characteristics: [{
            aid: service.aid,
            iid: service.characteristics.find(x => x.type === Characteristic.Hue).iid,
            value: command.execution[0].params.color.spectrumHSV.hue,
          }, {
            aid: service.aid,
            iid: service.characteristics.find(x => x.type === Characteristic.Saturation).iid,
            value: command.execution[0].params.color.spectrumHSV.saturation,
          }],
        };
      }
    }
  }

}