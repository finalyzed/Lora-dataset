# LoRA Dataset Architect

A comprehensive tool for cropping, curating, and captioning image datasets for AI image training (LoRA).

This application runs **100% locally** and offline. It uses open-source vision models (like Qwen2-VL) to automatically caption your images, ensuring your private data never leaves your computer.

---

## 📸 Screenshots

*(Add your screenshots here! Just drag and drop images into GitHub while editing this file to upload them.)*

![Screenshot 1 Placeholder](https://via.placeholder.com/800x400.png?text=Step+1:+Import+and+Crop)
![Screenshot 2 Placeholder](https://via.placeholder.com/800x400.png?text=Step+2:+Curate+and+Color+Grade)
![Screenshot 3 Placeholder](https://via.placeholder.com/800x400.png?text=Step+3:+Live+Captioning+with+Qwen2-VL)

---

## 🚀 The "One-Click" Install & Setup Guide

Since this app runs powerful AI models locally on your own hardware, it requires a dedicated Nvidia GPU and a few basic programs installed on your computer. 

Don't worry if you aren't computer savvy! Just follow these steps exactly.

### Step 1: Install the Prerequisites (Do this once)

Before you can run the app, your computer needs to know how to read the code. You need to install three standard programs:

1. **Python (The brain)**: 
   - Go to [python.org/downloads](https://www.python.org/downloads/) and download Python 3.10 or 3.11.
   - ⚠️ **CRITICAL STEP:** When you open the Python installer, look at the very bottom of the window. You **MUST** check the box that says **"Add Python to PATH"** before you click Install. If you miss this, the app will not work!
2. **Node.js (The user interface)**: 
   - Go to [nodejs.org](https://nodejs.org/) and download the "LTS" (Long Term Support) version. Install it normally (just keep clicking Next).
3. **Git (The downloader)**: 
   - Go to [git-scm.com/downloads](https://git-scm.com/downloads) and download it for your operating system. Install it normally (just keep clicking Next).

### Step 2: Run the App!

Once you have installed the three programs above, you are ready to start the app.

**If you are on Windows:**
1. Open the folder where you saved this project.
2. Double-click the file named `start_windows.bat`.
3. A black terminal window will open. It will automatically download all the necessary AI files and start the server. 
   - *Note: The very first time you run this, it will download the AI model (about 15GB). This may take 10-30 minutes depending on your internet speed. Be patient!*
4. A second black window will pop up for the AI server. **Leave both black windows open.**
5. Open your web browser (Chrome, Edge, etc.) and go to the web address shown in the terminal (usually `http://localhost:5173` or `http://localhost:3000`).

**If you are on Mac or Linux:**
1. Open your Terminal.
2. Navigate to the folder where you saved this project.
3. Run this command to make the script executable: `chmod +x start_mac_linux.sh`
4. Run the script: `./start_mac_linux.sh`
5. Open your web browser and go to the web address shown in the terminal.

---

## ⚙️ How to Use the App

1. **Settings**: In the web app, click the **Settings** gear icon in the top right corner. Ensure the **Local API URL** is set to `http://localhost:8000`. Close the settings.
2. **Import**: Drag and drop your images into the app. It will automatically detect faces and crop them perfectly into squares.
3. **Curate**: The app will grade your images. You can use the slider to set a minimum score. Images below the score turn red and will be ignored. You can also apply an automatic color grade (like "Cinematic" or "Realistic") to make all your photos match!
4. **Caption**: Click "Generate Captions". The AI running in your black terminal window will look at every photo and write a detailed description of it.
5. **Export**: Click "Export Dataset". You will get a `.zip` file containing all your perfectly cropped images and their matching text files, ready to be uploaded to a LoRA trainer!

---

## 🛠️ Troubleshooting (Common Errors)

- **"CUDA out of memory" in the black window**: 
  - *What it means:* Your graphics card (GPU) doesn't have enough memory (VRAM) to load the large AI model. 
  - *How to fix it:* Open the file named `local_caption_server.py` in Notepad. Look for line 24 that says `MODEL_ID = "Qwen/Qwen2-VL-7B-Instruct"`. Change the `7B` to `2B` so it looks like this: `MODEL_ID = "Qwen/Qwen2-VL-2B-Instruct"`. Save the file and double-click `start_windows.bat` again. The 2B model is much smaller and fits on almost any GPU.
- **"Connection Refused" or "Local API failed" in the web app**: 
  - *What it means:* The web app can't talk to the Python AI server. 
  - *How to fix it:* Ensure the second black terminal window (the one running Python) is actually open and hasn't crashed. Ensure the URL in the app settings exactly matches `http://localhost:8000`.
- **"python is not recognized as an internal or external command"**: 
  - *What it means:* You forgot to check the "Add Python to PATH" box when installing Python. 
  - *How to fix it:* Re-run the Python installer you downloaded, select "Modify", and make sure that box is checked.
