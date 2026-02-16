import os
from openai import OpenAI
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

class ChatBot:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        # self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.conversation_history = []

    def getSystemPrompt(self, analysis_data=None):
        base_prompt = """You are an AI assistant specialized in drone image analysis
    and YOLO object detection. You help users understand their detection results.

    The system uses YOLOv8 for object detection and provides the following data for each detected object:
    - Class name and confidence score (0-100%)
    - Bounding box coordinates (xMin, yMin, xMax, yMax)
    - Center position (xCenter, yCenter) in pixels
    - Width and height in pixels
    - Pixel area (width x height)
    - Aspect ratio (width / height)
    - Prominence score
    - Estimated 3D distance (X, Y, Z)

    PROMINENCE SCORE:
    The prominence score is a value between 0 and 1 that measures how visually significant
    an object is in the image. It is calculated as a weighted combination of two normalized components:

    1. Normalized Area (50% weight):
    - Each object's pixel area is divided by the largest object's pixel area in the image
    - This gives a relative size score between 0 and 1
    - Larger objects score higher

    2. Normalized Confidence (50% weight):
    - The raw confidence score is passed through a sigmoid function: 1 / (1 + e^(-k * (x - x0)))
    - Parameters: k=15.0 (steepness), x0=0.67 (midpoint)
    - This means objects with confidence near or above 67% score significantly higher
    - Objects below 67% confidence are penalized

    Final score = (normalized_area * 0.5) + (normalized_confidence * 0.5)

    A score close to 1.0 means the object is both large and detected with high confidence.
    A score close to 0.0 means the object is small and/or detected with low confidence.

    DISTANCE ESTIMATION:
    The X, Y, Z distance values are estimated using a Random Forest regression model trained
    on detection statistics. The model takes the following features as input:
    - Confidence score
    - Pixel area
    - Prominence score
    - Bounding box width
    - Bounding box height
    - Aspect ratio

    IMPORTANT LIMITATION: The distance model was trained primarily on person objects.
    This means:
    - Distance estimates for PERSON objects are reliable and should be trusted
    - Distance estimates for NON-PERSON objects (trees, cars, etc.) are unreliable
    and should be treated as rough approximations only
    - Always caveat distance values for non-person objects when discussing them

    X = lateral distance (left/right)
    Y = depth distance (forward/backward)
    Z = vertical distance (up/down)
    All distances are in meters.

    Be concise and helpful. If asked about something unrelated to the analysis,
    politely redirect the conversation back to the image analysis."""

        if analysis_data:
            detections = analysis_data.get('detections', [])
            stats = analysis_data.get('statistics', {})
            class_dist = stats.get('class_distribution', {})

            detection_details = "\n".join([
                f"  - {d['class_name']}: confidence {d['confidence']:.2%}, "
                f"area {d['pixelArea']:.0f}px², "
                f"size {d['width']}x{d['height']}px, "
                f"score {d['score']:.3f}, "
                f"position ({d['xCenter']:.0f}, {d['yCenter']:.0f}), "
                f"aspect ratio {d['aspectRatio']:.2f}, "
                f"distance (X:{d['distance']['x']:.2f}m, Y:{d['distance']['y']:.2f}m, Z:{d['distance']['z']:.2f}m)"
                f"{' [distance reliable]' if d['class_name'] == 'person' else ' [distance unreliable - not a person]'}"
                for d in detections
            ])

            context = f"""

    Current Image Analysis Context:
    - Total objects detected: {analysis_data.get('count', 0)}
    - Class distribution: {class_dist}
    - Average confidence: {stats.get('average_confidence', 0):.2%}
    - Average score: {stats.get('average_score', 0):.3f}
    - Average area: {stats.get('average_area', 0):.0f}px²
    - Image coverage: {stats.get('coverage_percentage', 0):.2f}%
    - Size range: min {stats.get('size_range', {}).get('min', 0):.0f}px² / max {stats.get('size_range', {}).get('max', 0):.0f}px²
    - Average distance: X:{stats.get('average_distance', {}).get('x', 0):.2f}m, Y:{stats.get('average_distance', {}).get('y', 0):.2f}m, Z:{stats.get('average_distance', {}).get('z', 0):.2f}m

    Individual Detections:
    {detection_details}

    Use this data to answer the user's questions about the image.
    Remember to flag unreliable distance estimates for non-person objects."""

            return base_prompt + context

        return base_prompt

    def chat(self, user_message, analysis_data=None):
        system_prompt = self.getSystemPrompt(analysis_data)

        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(self.conversation_history)
        messages.append({"role": "user", "content": user_message})

        response = self.client.chat.completions.create(
            # model="llama-3.3-70b-versatile",
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=500,
            temperature=0.7,
        )

        assistant_message = response.choices[0].message.content

        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })
        self.conversation_history.append({
            "role": "assistant",
            "content": assistant_message
        })

        return assistant_message

    def clearHistory(self):
        self.conversation_history = []

    def getHistory(self):
        return self.conversation_history