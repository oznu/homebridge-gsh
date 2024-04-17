import { Characteristic } from '../hap-types';
import { HapService, AccessoryTypeExecuteResponse } from '../interfaces';

export class MotionSensor {
    sync(service: HapService): {
        id: string;
        type: string;
        traits: string[];
        name: {
            defaultNames: string[];
            name: string;
            nicknames: string[];
        };
        willReportState: true,
        attributes: {
            occupancySensorConfiguration: [
                {
                    occupancySensorType: "PIR",
                    occupiedToUnoccupiedDelaySec: 0,
                    unoccupiedToOccupiedDelaySec: 0,
                    unoccupiedToOccupiedEventThreshold: 1,
                },
                {
                    occupancySensorType: "ULTRASONIC",
                    occupiedToUnoccupiedDelaySec: 0,
                    unoccupiedToOccupiedDelaySec: 0,
                    unoccupiedToOccupiedEventThreshold: 1,
                },
            ]
        };
        deviceInfo: {
            manufacturer: string;
            model: string;
        };
        customData: {
            aid: number;
            iid: number;
        };
    } {
        return {
            id: service.uniqueId,
            type: 'action.devices.types.SENSOR', // Consider specifying a more specific type if available
            traits: ['action.devices.traits.OccupancySensing'],
            name: {
                defaultNames: ['Motion Sensor', service.accessoryInformation.Name],
                name: service.serviceName,
                nicknames: []
            },
            willReportState: true,
            attributes: {
                occupancySensorConfiguration: [
                    {
                        occupancySensorType: "PIR",
                        occupiedToUnoccupiedDelaySec: 0, // Reduced for quicker response
                        unoccupiedToOccupiedDelaySec: 0, // Reduced for quicker response
                        unoccupiedToOccupiedEventThreshold: 1, // Consider adjusting this for sensitivity
                    },
                    {
                        occupancySensorType: "ULTRASONIC",
                        occupiedToUnoccupiedDelaySec: 0,
                        unoccupiedToOccupiedDelaySec: 0,
                        unoccupiedToOccupiedEventThreshold: 1,
                    },
                ]
            },
            deviceInfo: {
                manufacturer: service.accessoryInformation.Manufacturer,
                model: service.accessoryInformation.Model,
            },
            customData: {
                aid: service.aid,
                iid: service.iid,
            },
        };
    }

    query(service: HapService): {
        online: boolean;
        occupancy: string;
    } {
        const motionCharacteristic = service.characteristics.find(x => x.type === Characteristic.MotionDetected);
        return {
            online: true,
            occupancy: motionCharacteristic && motionCharacteristic.value ? "OCCUPIED" : "UNOCCUPIED",
        };
    }

    execute(service: HapService, command: any): AccessoryTypeExecuteResponse {
        // No commands to handle since OccupancySensing does not support commands
        console.log('No commands available for OccupancySensing trait.');
        return { payload: { characteristics: [] } };
    }
}
