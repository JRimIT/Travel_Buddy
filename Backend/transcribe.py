# import whisper

# model = whisper.load_model("medium")  # hoặc "tiny", "small", "medium", "large"

# result = model.transcribe("uploads/Rambo.mp3", language="vi")

# print(result["text"])

import sys
import whisper
import json

model = whisper.load_model("medium")
audio_path = sys.argv[1]

result = model.transcribe(audio_path)
# print(json.dumps(result["text"], ensure_ascii=False))
sys.stdout.buffer.write(result["text"].encode("utf-8"))