import { Characteristic } from '../hap-types';
import { HapService, AccessoryTypeExecuteResponse } from '../interfaces';

export class Lightbulb {
  sync(service: HapService) {

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

    if (service.characteristics.find(x => x.type === Characteristic.ColorTemperature)) {
      traits.push('action.devices.traits.ColorSetting');
      attributes.colorTemperatureRange = {
        temperatureMinK: 2000,
        temperatureMaxK: 6000,
      };
      attributes.commandOnlyColorSetting = false;
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

  query(service: HapService) {
    const response = {
      on: service.characteristics.find(x => x.type === Characteristic.On).value ? true : false,
      online: true,
    } as any;

    // check if the bulb has the brightness characteristic
    if (service.characteristics.find(x => x.type === Characteristic.Brightness)) {
      response.brightness = service.characteristics.find(x => x.type === Characteristic.Brightness).value;
    }

    // check if the bulb has color
    if (service.characteristics.find(x => x.type === Characteristic.Hue)) {
      response.color = {
        spectrumHsv: {
          hue: service.characteristics.find(x => x.type === Characteristic.Hue).value,
          saturation: service.characteristics.find(x => x.type === Characteristic.Saturation).value / 100,
          value: 1,
        },
      };
    }

    // check if the bulb has cct
    if (service.characteristics.find(x => x.type === Characteristic.ColorTemperature)) {
      const min = service.characteristics.find(x => x.type === Characteristic.ColorTemperature).minValue;
      const max = service.characteristics.find(x => x.type === Characteristic.ColorTemperature).maxValue;
      const value = (max - min) - (service.characteristics.find(x => x.type === Characteristic.ColorTemperature).value - min) + min;
      response.color = {
        temperatureK: 2000 + (6000 - 2000) * ((value - min) / (max - min)),
      };
    }

    return response;
  }

  execute(service: HapService, command): AccessoryTypeExecuteResponse {
    if (!command.execution.length) {
      return { payload: { characteristics: [] } };
    }

    switch (command.execution[0].command) {
      case ('action.devices.commands.OnOff'): {
        const payload = {
          characteristics: [{
            aid: service.aid,
            iid: service.characteristics.find(x => x.type === Characteristic.On).iid,
            value: command.execution[0].params.on,
          }],
        };
        return { payload };
      }
      case ('action.devices.commands.BrightnessAbsolute'): {
        const payload = {
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
        return { payload };
      }
      case ('action.devices.commands.ColorAbsolute'): {

        const payload = { characteristics: [] };

        if (command.execution[0].params.color.spectrumHSV) {
          payload.characteristics.push({
            aid: service.aid,
            iid: service.characteristics.find(x => x.type === Characteristic.Hue).iid,
            value: command.execution[0].params.color.spectrumHSV.hue,
          }, {
            aid: service.aid,
            iid: service.characteristics.find(x => x.type === Characteristic.Saturation).iid,
            value: command.execution[0].params.color.spectrumHSV.saturation * 100,
          });
        }

        if (command.execution[0].params.color.temperature) {
          const min = service.characteristics.find(x => x.type === Characteristic.ColorTemperature).minValue;
          const max = service.characteristics.find(x => x.type === Characteristic.ColorTemperature).maxValue;
          const value = command.execution[0].params.color.temperature;
          const hbAccessoryValue = min + (max - min) * ((value - 2000) / (6000 - 2000));
          payload.characteristics.push({
            aid: service.aid,
            iid: service.characteristics.find(x => x.type === Characteristic.ColorTemperature).iid,
            value: (max - min) - (hbAccessoryValue - min) + min,
          });
        }
        return { payload };
      }
    }
  }

}