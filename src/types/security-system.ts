import { Characteristic } from '../hap-types';
import { HapService, AccessoryTypeExecuteResponse } from '../interfaces';

export class SecuritySystem {
  public twoFactorRequired = true;
  public returnStateOnExecute = true;

  sync(service: HapService) {
    return {
      id: service.uniqueId,
      type: 'action.devices.types.SECURITYSYSTEM',
      traits: [
        'action.devices.traits.ArmDisarm',
      ],
      name: {
        defaultNames: [
          service.serviceName,
          service.accessoryInformation.Name,
        ],
        name: service.serviceName,
        nicknames: [],
      },
      willReportState: true,
      attributes: {
        availableArmLevels: {
          levels: [
            {
              level_name: 'HOME',
              level_values: [{
                level_synonym: ['Home'],
                lang: 'en',
              }, {
                level_synonym: ['Anwesend'],
                lang: 'de',
              }],
            }, {
              level_name: 'AWAY',
              level_values: [{
                level_synonym: ['Away'],
                lang: 'en',
              }, {
                level_synonym: ['Abwesend'],
                lang: 'de',
              }],
            }, {
              level_name: 'NIGHT',
              level_values: [{
                level_synonym: ['Night'],
                lang: 'en',
              }, {
                level_synonym: ['Nacht'],
                lang: 'de',
              }],
            },
          ],
          ordered: true,
        },
      },
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
    const availableSystemCurrentStates = ['HOME', 'AWAY', 'NIGHT', 'OFF'];

    const response = {
      on: true,
      online: true,
      status: 'SUCCESS',
    } as any;

    const securitySystemCurrentState = service.characteristics.find(x => x.type === Characteristic.SecuritySystemCurrentState).value;

    const currentArmLevel = availableSystemCurrentStates[securitySystemCurrentState];

    if (currentArmLevel === 'OFF') {
      response.isArmed = false;
    } else {
      response.isArmed = true;
      response.currentArmLevel = currentArmLevel;
    }

    return response;
  }

  execute(service: HapService, command): AccessoryTypeExecuteResponse {
    if (!command.execution.length) {
      return { payload: { characteristics: [] } };
    }

    switch (command.execution[0].command) {
      case ('action.devices.commands.ArmDisarm'): {
        const mode = {
          HOME: 0,
          AWAY: 1,
          NIGHT: 2,
          OFF: 3,
        };

        let securitySystemTargetState;

        if (command.execution[0].params.arm === true) {
          securitySystemTargetState = mode[command.execution[0].params.armLevel];
        } else {
          securitySystemTargetState = mode.OFF;
        }

        const payload = {
          characteristics: [{
            aid: service.aid,
            iid: service.characteristics.find(x => x.type === Characteristic.SecuritySystemTargetState).iid,
            value: securitySystemTargetState,
          }],
        };

        const states = {
          isArmed: command.execution[0].params.arm,
          currentArmLevel: command.execution[0].params.armLevel,
        };

        return { payload, states };
      }
    }
  }

  is2faRequired(command): boolean {
    if (!command.execution.length) {
      return false;
    }

    switch (command.execution[0].command) {
      case ('action.devices.commands.ArmDisarm'): {
        if (command.execution[0].params.arm === true) {
          return false;
        }

        return true;
      }
    }

    return false;
  }
}