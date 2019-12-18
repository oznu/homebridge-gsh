import { Characteristic } from '../hap-types';
import { HapService } from '../interfaces';
import { Hap } from '../hap';

export class Thermostat {
  hap: Hap;

  constructor(hap: Hap) {
    this.hap = hap;
  }

  sync(service: HapService) {
    const availableThermostatModes = ['off', 'heat', 'cool'];

    if (service.characteristics.find(x => x.type === Characteristic.CoolingThresholdTemperature) &&
      service.characteristics.find(x => x.type === Characteristic.HeatingThresholdTemperature)) {
      availableThermostatModes.push('heatcool');
    } else {
      availableThermostatModes.push('auto');
    }

    return {
      id: service.uniqueId,
      type: 'action.devices.types.THERMOSTAT',
      traits: [
        'action.devices.traits.TemperatureSetting',
      ],
      attributes: {
        availableThermostatModes: availableThermostatModes.join(','),
        thermostatTemperatureUnit: this.hap.config.forceFahrenheit ? 'F'
          : service.characteristics.find(x => x.type === Characteristic.TemperatureDisplayUnits).value ? 'F' : 'C',
      },
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

    // check if device reports CoolingThresholdTemperature and HeatingThresholdTemperature
    if (service.characteristics.find(x => x.type === Characteristic.CoolingThresholdTemperature) &&
      service.characteristics.find(x => x.type === Characteristic.HeatingThresholdTemperature)) {

      // translate mode
      if (response.thermostatMode === 'auto') {
        response.thermostatMode = 'heatcool';
      }

      response.thermostatTemperatureSetpointLow = service.characteristics.find(x => x.type === Characteristic.HeatingThresholdTemperature).value;
      response.thermostatTemperatureSetpointHigh = service.characteristics.find(x => x.type === Characteristic.CoolingThresholdTemperature).value;
    }

    return response;
  }

  execute(service: HapService, command) {
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
          heatcool: 3,
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
            value: command.execution[0].params.thermostatTemperatureSetpoint,
          }],
        };
      }
      case ('action.devices.commands.ThermostatTemperatureSetRange'): {
        return {
          characteristics: [
            {
              aid: service.aid,
              iid: service.characteristics.find(x => x.type === Characteristic.CoolingThresholdTemperature).iid,
              value: command.execution[0].params.thermostatTemperatureSetpointHigh,
            },
            {
              aid: service.aid,
              iid: service.characteristics.find(x => x.type === Characteristic.HeatingThresholdTemperature).iid,
              value: command.execution[0].params.thermostatTemperatureSetpointLow,
            }],
        };
      }
    }
  }

}