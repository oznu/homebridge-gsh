import { Characteristic } from '../hap-types';

export class Thermostat {
  sync(service) {
    return {
      id: service.uniqueId,
      type: 'action.devices.types.THERMOSTAT',
      traits: [
        'action.devices.traits.TemperatureSetting',
      ],
      attributes: {
        availableThermostatModes: 'off,heat,cool,auto',
        thermostatTemperatureUnit: service.characteristics.find(x => x.type === Characteristic.TemperatureDisplayUnits).value ? 'F' : 'C',
      },
      name: {
        defaultNames: [
          service.serviceName,
          service.accessoryInformation.Name,
        ],
        name: service.serviceName,
        nicknames: [],
      },
      willReportState: false,
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
    const targetHeatingCoolingState = service.characteristics.find(x => x.type === Characteristic.TargetHeatingCoolingState).value;
    const thermostatMode = ['off', 'heat', 'cool', 'auto'][targetHeatingCoolingState];

    const response = {
      online: true,
      thermostatMode,
      thermostatTemperatureSetpoint: service.characteristics.find(x => x.type === Characteristic.TargetTemperature).value,
      thermostatTemperatureAmbient: service.characteristics.find(x => x.type === Characteristic.CurrentTemperature).value,
    } as any;

    // check if device reports CurrentRelativeHumidity
    if (service.characteristics.find(x => x.type === Characteristic.CurrentRelativeHumidity)) {
      response.thermostatHumidityAmbient = service.characteristics.find(x => x.type === Characteristic.CurrentRelativeHumidity).value;
    }

    return response;
  }

  execute(service, command) {
    if (!command.execution.length) {
      return { characteristics: [] };
    }

    switch (command.execution[0].command) {
      case ('action.devices.commands.ThermostatSetMode'): {
        const mode = {
          off: 0,
          heat: 1,
          cool: 2,
          auto: 3,
        };

        return {
          characteristics: [{
            aid: service.aid,
            iid: service.characteristics.find(x => x.type === Characteristic.TargetHeatingCoolingState).iid,
            value: mode[command.execution[0].params.thermostatMode],
          }],
        };
      }
      case ('action.devices.commands.ThermostatTemperatureSetpoint'): {
        return {
          characteristics: [{
            aid: service.aid,
            iid: service.characteristics.find(x => x.type === Characteristic.TargetTemperature).iid,
            value: Math.round(command.execution[0].params.thermostatTemperatureSetpoint),
          }],
        };
      }
    }
  }

}