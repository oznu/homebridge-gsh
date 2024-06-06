import argparse
from gradio_client import Client
import os

def call_gradio(image_path, prompt_text, api_name="/answer_question"):
  # Check if image path exists
  if not os.path.exists(image_path):
    raise ValueError(f"Image path not found: {image_path}")

  # Connect to Gradio server
  client = Client("http://127.0.0.1:7860/")  # Replace with your server URL

  # Make prediction
  result = client.predict(image_path, prompt_text, api_name=api_name)

  return result

# Example usage (optional)
if __name__ == "__main__":
  parser = argparse.ArgumentParser(description="Call Gradio server with image and prompt.")
  parser.add_argument("--image_path", required=True, help="Path to the image file")
  parser.add_argument("--prompt_text", required=True, help="Text prompt for the Gradio interface")
  parser.add_argument("--api_name", default="/answer_question", help="Gradio API name")

  args = parser.parse_args()

  print(call_gradio(args.image_path, args.prompt_text, args.api_name))
