<p align="center">
    <img src="https://raw.githubusercontent.com/homebridge/branding/master/logos/homebridge-color-round-stylized.png" height="140"><br>
    <img src="https://user-images.githubusercontent.com/3979615/62948974-ba97f180-be28-11e9-8aef-d2a1d2f37cee.png" width="150"><br>
</p>

<span align="center">

# SmartGuard Motion Detection System

</span>

## Overview

The SmartGuard Motion Detection System leverages RTSP-enabled cameras to monitor environments effectively. It detects motion, captures media (video and image), sends real-time notifications, and employs an advanced Python script for in-depth analysis and responsive actions. This robust system is designed for compatibility with both **iOS** and **Android** devices through Homebridge integration.

## Features

- **Universal Compatibility**: Compatible with any security camera that supports RTSP, providing flexible deployment options across different hardware.
- **Real-Time Notifications**: Employs Line Notify powered by a Google Apps Script to deliver instant alerts upon motion detection, ensuring timely awareness.
- **Advanced Media Analysis**: Integrates a sophisticated Python script that utilizes machine learning to analyze captured media, enhancing the identification of specific threats or anomalies.
- **Proactive Security Responses**: The script's analysis can trigger specific, automated security responses such as turning on additional cameras, locking doors, or activating alarms.
- **Homebridge Integration**: Fully compatible with iOS and Android through the Homebridge-GSH plugin, allowing for seamless operation and integration with smart home ecosystems.
- **Efficient Storage Management**: Implements smart storage strategies that automatically manage video and image files, maintaining operational efficiency by adhering to set storage limits.
- **Customizable Action Triggers**: Based on the Python script’s output, the system can execute customized actions, enhancing security measures and providing tailored responses to different situations.

## Prerequisites

- Node.js and npm installed
- Homebridge setup with the Homebridge-Google Smart Home plugin
- `ffmpeg-for-homebridge` installed for media processing
- Access to RTSP stream URL from your security cameras

## Installation

Install Homebridge with the Homebridge-GSH plugin and `ffmpeg-for-homebridge` for handling media files.

```bash
sudo npm install -g ffmpeg-for-homebridge
```

## Configuration

Create a `.env` file for your environment variables, including paths and settings for the RTSP stream, notification endpoints, local storage, and the Python environment.

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

Configure the Homebridge-GSH plugin via Homebridge Config UI X for seamless management.

## Usage

Upon detecting motion, the system:
1. **Captures Media**: Saves videos and images locally.
2. **Calls the Python Script**: Executes `call_gradio_local_server.py`, passing it the paths to the captured media.
3. **Processes Output**: The script analyzes the media and returns results, which are used to trigger custom actions (like additional notifications or automated responses).

### Integration of Python Script for Advanced Media Analysis

The integration of the Python script adds significant value by enabling sophisticated analysis of the media captured during motion events:
- **Deep Learning Models**: The script utilizes advanced machine learning models to interpret the content of the images and videos, identifying potential threats or unusual activities.
- **Custom Response Logic**: Based on the analysis, the system can execute specific actions such as activating alarms, initiating further recordings, or sending detailed alerts with descriptions of the detected event.
- **Enhanced Decision Making**: This allows for smarter decision-making in security protocols, providing a higher level of automation and precision in responses.

This setup not only notifies but also intelligently analyzes and responds to different scenarios detected by your cameras, offering a more robust security solution.

## Google Apps Script for Notifications

Utilize a Google Apps Script to handle notification dispatch via Line Notify. This script ensures that notifications are sent out promptly when the Python script flags an event.

```javascript
function doPost(e) {
  try {
    if (e && e.postData && e.postData.type === "application/json") {
      var content = JSON.parse(e.postData.contents);
      if (content.message) {
        sendLineNotification(content.message);
        return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return sendError("No message provided");
      }
    } else {
      return sendError("Invalid request or content type");
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return sendError("Error processing request");
  }
}

function sendLineNotification(message) {
  var tokens = [
    // Replace with actual tokens
  ]; // Array of LINE Notify tokens

  var responses = [];

  tokens.forEach(function(token) {
    var options = {
      method: "post",
      headers: {
        "Authorization": "Bearer " + token
      },
      payload: {
        message: message
      },
      muteHttpExceptions: true
    };

    var url = "https://notify-api.line.me/api/notify";
    var response = UrlFetchApp.fetch(url, options);
    console.log('LINE Notify response for token', token, ':', response.getContentText());
    responses.push(response.getContentText());
  });

  return responses; // Optionally return responses for logging or other purposes
}

function sendError(errorMessage) {
  console.error(errorMessage);
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: errorMessage }))
    .setMimeType(ContentService.MimeType.JSON);
}
```
Ensure you replace placeholder tokens with your actual Line Notify tokens.

### Generating a Line Notify Token

To send notifications through Line Notify, you will need a personal access token. Generate this token by visiting the [Line Notify token page](https://notify-bot.line.me/my/).

## Homebridge-GSH Integration

This system uses [Homebridge-GSH](https://github.com/oznu/homebridge-gsh#readme) for easy integration with Google Home devices, allowing voice control and remote management of your Homebridge-connected devices.

## Managing Media Files

Automatic file management ensures your storage does not overflow by maintaining only the most recent recordings and images, effectively managing space by deleting the oldest files beyond set thresholds.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

- [oznu](https://github.com/oznu) - For developing Homebridge and the Google Smart Home plugin.
- [NorthernMan54](https://github.com/NorthernMan54) - For creating Hap-Node-Client which facilitates communication with HomeKit-enabled accessories
