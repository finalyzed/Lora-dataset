import base64
import io
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import torch
from transformers import Qwen2VLForConditionalGeneration, AutoProcessor
from qwen_vl_utils import process_vision_info

app = FastAPI()

# Allow CORS so the React app can communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model globally so it stays in memory
# We use Qwen2-VL-7B-Instruct as an example of a powerful open-source vision model.
# If you have limited VRAM, you can use a smaller model or load in 4-bit/8-bit.
MODEL_ID = "Qwen/Qwen2-VL-7B-Instruct"

print(f"Loading model {MODEL_ID}... This may take a while.")
try:
    # Load model in float16 to save VRAM, compatible with all modern Nvidia GPUs
    model = Qwen2VLForConditionalGeneration.from_pretrained(
        MODEL_ID, 
        torch_dtype=torch.float16, 
        device_map="auto"
    )
    processor = AutoProcessor.from_pretrained(MODEL_ID)
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    print("Make sure you have enough VRAM and have installed the required packages.")

class CaptionRequest(BaseModel):
    image: str  # base64 encoded image string
    prompt: str

@app.post("/api/caption")
async def generate_caption(request: CaptionRequest):
    try:
        # Decode the base64 image
        image_data = base64.b64decode(request.image)
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        
        # Prepare the conversation format for Qwen-VL
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": request.prompt},
                ],
            }
        ]
        
        # Process inputs
        text = processor.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        image_inputs, video_inputs = process_vision_info(messages)
        inputs = processor(
            text=[text],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt",
        )
        inputs = inputs.to(model.device)
        
        # Generate output
        generated_ids = model.generate(**inputs, max_new_tokens=128)
        generated_ids_trimmed = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
        ]
        output_text = processor.batch_decode(
            generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
        )
        
        return {"caption": output_text[0]}
        
    except Exception as e:
        print(f"Error during generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Run the server on port 8000
    uvicorn.run(app, host="127.0.0.1", port=8000)
