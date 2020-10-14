import { Characteristic } from '../hap-types';
import { HapService, AccessoryTypeExecuteResponse } from '../interfaces';
import { Hap } from '../hap';

export class HeaterCooler {
  constructor(
    private hap: Hap,
  ) { }

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
          : service.characteristics.find(x => x.type === Characteristic.TemperatureDisplayUnits)?.value ? 'F' : 'C',
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
    const targetHeatingCoolingState = service.characteristics.find(x => x.type === Characteristic.TargetHeaterCoolerState).value;
    const activeState = service.characteristics.find(x => x.type === Characteristic.Active).value;
    const thermostatMode = activeState ? ['auto', 'heat', 'cool'][targetHeatingCoolingState] : 'off';

    const response = {
      online: true,
      thermostatMode,
      thermostatTemperatureAmbient: service.characteristics.find(x => x.type === Characteristic.CurrentTemperature).value,
    } as any;

    // check if device reports CoolingThresholdTemperature and HeatingThresholdTemperature
    if (service.characteristics.find(x => x.type === Characteristic.CoolingThresholdTemperature) &&
      service.characteristics.find(x => x.type === Characteristic.HeatingThresholdTemperature)) {

      if (response.thermostatMode === 'heat') {
        response.thermostatTemperatureSetpoint = service.characteristics.find(x => x.type === Characteristic.HeatingThresholdTemperature).value;
      } else if (response.thermostatMode === 'cool') {
        response.thermostatTemperatureSetpoint = service.characteristics.find(x => x.type === Characteristic.CoolingThresholdTemperature).value;
      } else if (response.thermostatMode === 'auto') {
        response.thermostatMode = 'heatcool';
        response.thermostatTemperatureSetpointLow = service.characteristics.find(x => x.type === Characteristic.HeatingThresholdTemperature).value;
        response.thermostatTemperatureSetpointHigh = service.characteristics.find(x => x.type === Characteristic.CoolingThresholdTemperature).value;
      }
    }

    return response;
  }

  execute(service: HapService, command): AccessoryTypeExecuteResponse {
    if (!command.execution.length) {
      return { payload: { characteristics: [] } };
    }

    switch (command.execution[0].command) {
      case ('action.devices.commands.ThermostatSetMode'): {
        const mode = {
          auto: 0,
          heat: 1,
          cool: 2,
          heatcool: 0,
        };
        let payload;

        if (command.execution[0].params.thermostatMode === 'off') {
          payload = {
            characteristics: [{
              aid: service.aid,
              iid: service.characteristics.find(x => x.type === Characteristic.Active).iid,
              value: 0,
            }],
          };
        } else {
          payload = {
            characteristics: [
              {
                aid: service.aid,
                iid: service.characteristics.find(x => x.type === Characteristic.Active).iid,
                value: 1,
              }, {
                aid: service.aid,
                iid: service.characteristics.find(x => x.type === Characteristic.TargetHeaterCoolerState).iid,
                value: mode[command.execution[0].params.thermostatMode],
              },
            ],
          };
        }
        return { payload };
      }
      case ('action.devices.commands.ThermostatTemperatureSetpoint'): {
        const payload = {
          characteristics: [
            {
              aid: service.aid,
              iid: service.characteristics.find(x => x.type === Characteristic.CoolingThresholdTemperature).iid,
              value: command.execution[0].params.thermostatTemperatureSetpoint,
            },
            {
              aid: service.aid,
              iid: service.characteristics.find(x => x.type === Characteristic.HeatingThresholdTemperature).iid,
              value: command.execution[0].params.thermostatTemperatureSetpoint,
            },
          ],
        };
        return { payload };
      }
      case ('action.devices.commands.ThermostatTemperatureSetRange'): {
        const payload = {
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
        return { payload };
      }
    }
  }

}