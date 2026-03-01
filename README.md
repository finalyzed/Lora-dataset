# LoRA Dataset Architect

A comprehensive tool for cropping, curating, and captioning image datasets for LoRA training.

This application runs **100% locally** and offline. It uses open-source vision models (like Qwen2-VL) to automatically caption your images, ensuring your data never leaves your computer.

---

## 🚀 One-Click Install & Setup Guide

Since this app runs powerful AI models locally, it requires a dedicated Nvidia GPU and a Python environment. Follow these steps carefully to get everything running.

### Prerequisites

1. **Nvidia GPU**: You need an Nvidia GPU with at least 8GB of VRAM (12GB+ recommended).
2. **Python 3.10 or 3.11**: Download and install from [python.org](https://www.python.org/downloads/).
   - ⚠️ **CRITICAL:** During the Python installation, you **MUST** check the box at the bottom that says **"Add Python to PATH"** before clicking Install.
3. **Git**: Download and install from [git-scm.com](https://git-scm.com/downloads).
4. **Node.js**: Download and install from [nodejs.org](https://nodejs.org/) (required to run the user interface).

---

### Step 1: Install the Local AI Server (Python)

The AI server handles the heavy lifting of looking at your images and generating captions.

1. Open your terminal (Command Prompt or PowerShell on Windows).
2. Navigate to the folder where you extracted this project.
3. Install PyTorch with CUDA support (this allows Python to use your Nvidia GPU):
   ```bash
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
   ```
4. Install the required AI libraries:
   ```bash
   pip install fastapi uvicorn transformers pillow accelerate qwen-vl-utils
   ```

### Step 2: Start the AI Server

In the same terminal, run the following command to start the AI server:

```bash
python local_caption_server.py
```

**What happens next?**
- The first time you run this, it will automatically download the `Qwen2-VL-7B-Instruct` model. 
- You do **not** need to manually download any files from HuggingFace or figure out where to put them. The script handles it automatically!
- *Note: The download is about 15GB, so it may take a while depending on your internet speed.*
- Once it finishes downloading and loading into your GPU, you will see a message saying: `Uvicorn running on http://0.0.0.0:8000`. Leave this terminal window open!

### Step 3: Start the User Interface (React)

Now that the AI server is running in the background, you need to start the visual app.

1. Open a **new** terminal window (keep the Python one running).
2. Navigate to the project folder again.
3. Install the UI dependencies:
   ```bash
   npm install
   ```
4. Start the UI:
   ```bash
   npm run dev
   ```
5. Open your web browser and go to `http://localhost:3000`.

---

## ⚙️ App Configuration

1. In the web app, click the **Settings** gear icon in the top right corner.
2. Ensure the **Local API URL** is set to `http://localhost:8000` (this tells the UI where to find your Python server).
3. Close the settings. You are now ready to drag and drop your images and start captioning!

---

## 🛠️ Troubleshooting

- **"CUDA out of memory"**: Your GPU doesn't have enough VRAM to load the 7B parameter model. 
  - *Fix:* Open `local_caption_server.py` in a text editor. Change `MODEL_ID = "Qwen/Qwen2-VL-7B-Instruct"` to `MODEL_ID = "Qwen/Qwen2-VL-2B-Instruct"`. Save the file and restart the Python server. The 2B model is much smaller and fits on almost any GPU.
- **"Connection Refused" / "Local API failed" in the web app**: 
  - *Fix:* This means the web app can't talk to the Python server. Ensure the Python script is actually running in your other terminal window and hasn't crashed. Ensure the URL in the app settings exactly matches `http://localhost:8000`.
- **"pip is not recognized as an internal or external command"**: 
  - *Fix:* You forgot to check the "Add Python to PATH" box when installing Python. Re-run the Python installer, select "Modify", and check that box.
- **"ModuleNotFoundError: No module named 'fastapi'"**: 
  - *Fix:* You didn't run the `pip install` commands, or you ran them in a different environment. Run the installation commands from Step 1 again.
