<p align="center">
    <img src="https://raw.githubusercontent.com/homebridge/branding/master/logos/homebridge-color-round-stylized.png" height="140"><br>
    <img src="https://user-images.githubusercontent.com/3979615/62948974-ba97f180-be28-11e9-8aef-d2a1d2f37cee.png" width="150"><br>
</p>

<span align="center">

# SmartGuard Motion Detection System

</span>

## Overview

The SmartGuard Motion Detection System utilizes your existing RTSP-enabled cameras to detect motion and notify you via Line Notify, and integrates with Homebridge to provide compatibility with Google Smart Home for control across both **iOS** and **Android** devices. This system also includes a Python script to process images and videos when motion is detected, adding advanced analytics and custom actions based on the results.

## Features

- **Universal Compatibility**: Works with any RTSP-supported camera.
- **Real-Time Notifications**: Utilizes Google Apps Script with Line Notify for instant alerts.
- **Homebridge Integration**: Ensures full compatibility with iOS and Android via Homebridge-GSH.
- **Advanced Analytics**: Calls a local Python script to analyze detected motion and handle custom alerts.
- **Efficient Storage Management**: Automatically manages storage of video and image files, adhering to user-defined limits.

## Prerequisites

- Node.js and npm installed
- Homebridge setup with the [Homebridge-Google Smart Home](https://github.com/oznu/homebridge-gsh#readme) plugin
- `ffmpeg-for-homebridge` installed for media processing
- Access to RTSP stream URL from your security cameras

## Installation

Ensure you have Homebridge installed with Homebridge-GSH. Then, install `ffmpeg-for-homebridge` for media handling.

```bash
sudo npm install -g ffmpeg-for-homebridge
```

## Configuration

Set up your `.env` file with necessary environment variables including your RTSP stream URL and local storage paths. Also ensure that your Python script path and binary are correctly set.

```plaintext
RTSP_STRING=rtsp://username:password@camera_ip:port
SEND_MESSAGE_STRING=http://your_notification_endpoint
DIRECTORY_TO_SAVE_STRING=/path/to/your/storage/directory
MOTION_DETECTED_STRING=Motion detected!
MAX_VIDEO_NUMBER=50
MAX_IMAGE_NUMBER=50
PYTHON_BIN_PATH=/path/to/python/binary
GRADIO_PROMPT_STRING=Your custom Gradio prompt
```

Further, configure the Homebridge-GSH plugin via Homebridge Config UI X for easy management.

## Usage

The system monitors for motion using your RTSP camera feeds. Upon detecting motion, it captures video and images, sends notifications through Line Notify, and calls a Python script for additional processing.

### Python Script Interaction

When motion is detected, the system calls a local Python script (`call_gradio_local_server.py`). This script processes the image with Gradio, sending the result back to the motion sensor system for further actions based on the analysis.

Here's how the Python script is called:

1. **Image and Video Capture**: On motion detection, video and image files are saved locally.
2. **Python Script Call**: The system then calls the Python script, passing it the paths to the newly captured media.
3. **Custom Actions**: Based on the script's analysis, custom actions such as additional notifications or integration triggers can be performed.

This integration allows for sophisticated handling of motion events, turning simple notifications into intelligent responses.

## Google Apps Script for Notifications

This system utilizes a Google Apps Script to send notifications via Line Notify. Below is the script setup to manage POST requests:

```javascript
function doPost(e) {
  // Function content remains the same as previously described
}

function sendLineNotification(message) {
  // Function content remains the same as previously described
}

function sendError(errorMessage) {
  // Function content remains the same as previously described
}
```

Ensure you replace placeholder tokens with your actual Line Notify tokens.

### Generating a Line Notify Token

To send notifications through Line Notify, you will need a personal access token. Generate this token by visiting the [Line Notify token page](https://notify-bot.line.me/my/).

## Homebridge-GSH Integration

This system uses [Homebridge-GSH](https://github.com/oznu/homebridge-gsh#readme) for easy integration with Google Home devices, allowing voice control and remote management of your Homebridge connected devices.

## Managing Media Files

Automatic file management ensures your storage does not overflow by maintaining only the most recent recordings and images, effectively managing space by deleting the oldest files beyond set thresholds.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

- [oznu](https://github.com/oznu) - For developing Homebridge and the Google Smart Home plugin.
- [NorthernMan54](https://github.com/NorthernMan54) - For creating Hap-Node-Client which facilitates communication with HomeKit-enabled accessories
---
