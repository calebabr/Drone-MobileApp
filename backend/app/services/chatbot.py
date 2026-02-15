import os
# from openai import OpenAI
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

class ChatBot:
    def __init__(self):
        # self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.conversation_history = []

    def getSystemPrompt(self, analysis_data=None):
        base_prompt = """You are an AI assistant specialized in drone image analysis
and YOLO object detection. You help users understand their detection results.

You can explain:
- Detected objects, confidence scores, and what they mean
- Distance estimations (X, Y, Z coordinates)
- Object prominence scores and how they are calculated
- Class distributions and image statistics
- General drone photography and computer vision concepts

Be concise and helpful. If asked about something unrelated to the analysis,
politely redirect the conversation back to the image analysis."""

        if analysis_data:
            detections = analysis_data.get('detections', [])
            stats = analysis_data.get('statistics', {})
            class_dist = stats.get('class_distribution', {})

            detection_details = "\n".join([
                f"  - {d['class_name']}: confidence {d['confidence']:.2%}, "
                f"score {d['score']:.3f}, "
                f"distance (X:{d['distance']['x']:.2f}m, Y:{d['distance']['y']:.2f}m, Z:{d['distance']['z']:.2f}m)"
                for d in detections
            ])

            context = f"""

Current Image Analysis Context:
- Total objects detected: {analysis_data.get('count', 0)}
- Class distribution: {class_dist}
- Average confidence: {stats.get('average_confidence', 0):.2%}
- Average score: {stats.get('average_score', 0):.3f}
- Image coverage: {stats.get('coverage_percentage', 0):.2f}%
- Size range: min {stats.get('size_range', {}).get('min', 0):.0f}px² / max {stats.get('size_range', {}).get('max', 0):.0f}px²

Individual Detections:
{detection_details}

Use this data to answer the user's questions about the image."""

            return base_prompt + context

        return base_prompt

    def chat(self, user_message, analysis_data=None):
        system_prompt = self.getSystemPrompt(analysis_data)

        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(self.conversation_history)
        messages.append({"role": "user", "content": user_message})

        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
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