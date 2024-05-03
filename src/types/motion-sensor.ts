import { Characteristic } from '../hap-types';
import { HapService, AccessoryTypeExecuteResponse } from '../interfaces';
import axios from 'axios';
import * as child_process from 'child_process';
import fs from 'fs';
import ffmpegPath from 'ffmpeg-for-homebridge';
import dotenv from 'dotenv';
import path from 'path';

// Get the absolute path to the outermost folder of the project
const envFilePath = path.resolve(__dirname, '../../.env');

// Load environment variables from .env file
dotenv.config({ path: envFilePath });

console.log(envFilePath); // This will log the resolved path to the .env file
const rtspString = process.env.RTSP_STRING;
const sendmessagepString = process.env.SEND_MESSAGE_STRING;
const directoryPath = process.env.DIRECCTORY_TO_SAVE_STRING;
const MotiondetectedString = process.env.MOTION_DECTECTED_STRING;

const maxVideoNumber = parseInt(process.env.MAX_VIDEO_NUMBER, 10) || 50; // Default to 50 if undefined or invalid
const maxImageNumber = parseInt(process.env.MAX_IMAGE_NUMBER, 10) || 50; // Default to 50 if undefined or invalid
// Check if the directory exists
if (!fs.existsSync(directoryPath)) {
    // If it doesn't exist, create the directory
    fs.mkdirSync(directoryPath);
}

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
                    unoccupiedToOccupiedEventThreshold: 1
                },
                {
                    occupancySensorType: "ULTRASONIC",
                    occupiedToUnoccupiedDelaySec: 0,
                    unoccupiedToOccupiedDelaySec: 0,
                    unoccupiedToOccupiedEventThreshold: 1
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
            type: 'action.devices.types.SENSOR',
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
                        occupiedToUnoccupiedDelaySec: 0,
                        unoccupiedToOccupiedDelaySec: 0,
                        unoccupiedToOccupiedEventThreshold: 1
                    },
                    {
                        occupancySensorType: "ULTRASONIC",
                        occupiedToUnoccupiedDelaySec: 0,
                        unoccupiedToOccupiedDelaySec: 0,
                        unoccupiedToOccupiedEventThreshold: 1
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
        const isOccupied = motionCharacteristic && motionCharacteristic.value;
        this.handleMotionDetected(isOccupied, service);
        return {
            online: true,
            occupancy: isOccupied ? "OCCUPIED" : "UNOCCUPIED",
        };
    }

    execute(service: HapService, command: any): AccessoryTypeExecuteResponse {
        console.log('No commands available for OccupancySensing trait.');
        return { payload: { characteristics: [] } };
    }

    async handleMotionDetected(isOccupied: boolean, service: HapService): Promise<void> {
        if (isOccupied) {
            console.log(`Motion detected on sensor ${service.serviceName}`);
            // Add custom actions here, e.g., turning on lights, sending notifications, etc.
            try {
                // Notify first
                await this.sendNotification(MotiondetectedString);

                // Take screenshot
                await this.takeScreenshot();

                // Start recording
                await this.startRecording();
            } catch (error) {
                console.error("Error during motion detection handling:", error);
            }
        } else {
            console.log(`No motion detected on sensor ${service.serviceName}`);
            // Actions when no motion is detected
        }
    }

    async sendNotification(message: string): Promise<void> {
        const url = sendmessagepString;
        const data = { message };

        axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => console.log("Notification sent successfully:", response.data))
            .catch(error => console.error("Failed to send notification:", error));
    }

    private formatDate(date: Date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const hour = d.getHours().toString().padStart(2, '0');
        const minute = d.getMinutes().toString().padStart(2, '0');
        const second = d.getSeconds().toString().padStart(2, '0');
        return `${year}-${month}-${day}-${hour}-${minute}-${second}`;
    }


    async takeScreenshot() {
        const timestamp = this.formatDate(new Date());
        const outputPath = directoryPath + `/screenshot-${timestamp}.jpg`;
        const imageUrl = `https://drive.google.com/drive/search?q=screenshot-${timestamp}.jpg`; // Modify with the actual URL path

        // Command to capture a single frame
        const command = `${ffmpegPath} -rtsp_transport tcp -i "${rtspString}" -vframes 1 -q:v 2 "${outputPath}"`;
        child_process.exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error executing ffmpeg:', error);
                return;
            }
            console.log('Screenshot taken:', outputPath);
            this.sendNotification(`Motion detected! Screenshot available at: ${imageUrl}`);
        });
    }

    async startRecording() {
        const timestamp = this.formatDate(new Date());
        const outputPath = directoryPath + `/video-${timestamp}.mp4`;
        const videoUrl = `https://drive.google.com/drive/search?q=video-${timestamp}.mp4`; // Modify with the actual URL path

        // Construct the ffmpeg command
        const command = `${ffmpegPath} -y -rtsp_transport tcp -i ${rtspString} -c:v libx264 -preset ultrafast -t 10 ${outputPath}`;

        // Execute the ffmpeg command
        child_process.exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error executing ffmpeg:', error);
                return;
            }
            // console.log('ffmpeg stdout:', stdout);
            console.error('ffmpeg stderr:', stderr);
            this.sendNotification(`Motion detected! Video available at: ${videoUrl}`);
            this.manageOldFiles();
        });
    }

    private manageOldFiles() {
        fs.readdir(directoryPath, (err, files) => {  // Ensure you use the directoryPath where the videos and images are stored
            if (err) {
                console.log('Error finding files:', err);
                return;
            }

            // Filter for video and image files separately
            let videoFiles = files.filter(file => file.startsWith('video-') && file.endsWith('.mp4'));
            let imageFiles = files.filter(file => file.startsWith('screenshot-') && file.endsWith('.jpg'));

            // Function to delete excess files if above a certain count
            const deleteExcessFiles = (fileList: any[], extension: string, limit: number) => {
                while (fileList.length > limit) {
                    fileList.sort((a, b) => fs.statSync(directoryPath + '/' + a).mtime.getTime() - fs.statSync(directoryPath + '/' + b).mtime.getTime());
                    const fileToDelete = fileList.shift();  // Removes the first element from the array and returns it

                    fs.unlink(directoryPath + '/' + fileToDelete, (err) => {
                        if (err) {
                            console.error('Error deleting ' + extension + ' file:', fileToDelete, err);
                        } else {
                            console.log('Deleted old ' + extension + ' file:', fileToDelete);
                        }
                    });
                }
            };

            // Apply the deletion logic to both video and image files
            deleteExcessFiles(videoFiles, 'video', maxVideoNumber);
            deleteExcessFiles(imageFiles, 'image', maxImageNumber);
        });
    }


}
