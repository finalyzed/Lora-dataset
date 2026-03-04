# 🏗️ LoRA Dataset Architect V1.1

A comprehensive, **100% local and offline** tool for cropping, curating, and captioning image datasets for AI image training (LoRA). 

If you've ever trained a LoRA, you know that prepping the dataset is the most tedious part. Manually cropping photos, fixing lighting, and writing hundreds of text files takes hours. **LoRA Dataset Architect** automates the entire pipeline. It runs entirely on your own hardware, ensuring your private photos never leave your computer.

---

## ✨ Features

* **🔒 100% Local & Private:** The UI runs in your browser, and the AI vision model runs via a local Python server on your GPU. No cloud APIs, no subscriptions, no data harvesting.
* **✂️ Smart Face-Tracking Cropping:** Drop in images of any size or aspect ratio. It uses MediaPipe to detect faces and automatically crops them perfectly into squares at your target resolution (512, 768, 1024, or 1280).
* **📊 Automated Curation & Sorting:** Automatically scores your images to weed out blurry or bad crops. Use a slider to set a minimum quality threshold, and sort by "Best to Worst" to quickly delete outliers.
* **🎨 1-Click Color Grading:** Apply a uniform color grade to all images instantly (Realistic, Anime, Cinematic, or Vintage) to help the AI learn a consistent style.
* **🤖 Local AI Captioning:** Connects to a local instance of `Qwen2-VL-7B-Instruct` to automatically look at your images and write highly detailed captions.
* **📝 Flexible Formatting:** Choose between comma-separated tags or natural descriptive sentences. Add a custom trigger word (e.g., `ohwx man`) that automatically prepends to every text file.
* **📦 1-Click ZIP Export:** Generates a `.zip` file containing all your perfectly cropped images and their matching `.txt` files, ready to be dropped straight into Kohya or your trainer of choice.

### 🆕 What's New in V1.1
* **Live Captioning Previews:** Watch the AI write captions in real-time! A live preview box shows the exact image being processed alongside the generated text, so you can verify your settings without waiting for the whole dataset to finish.
* **Custom Prompt Instructions:** You can now give the AI specific instructions on what to focus on or ignore (e.g. "Focus on the clothing and lighting, ignore the background").
* **Stop Generation Button:** Added a stop button so you can halt the captioning process at any time if you notice the captions aren't coming out right.
* **Review Before Curation:** The app no longer auto-skips the cropping step. You can now review your cropped grid (and see warnings for low-res images) before moving on.
* **Smart Python Detection & Isolation:** The startup scripts now automatically hunt for Python 3.10/3.11 and create an isolated Virtual Environment (`venv`). This prevents dependency conflicts with your other AI tools (like ComfyUI) and allows you to keep newer/older global Python versions installed without breaking the app.
* **Enhanced Security:** The local AI server now strictly binds to `127.0.0.1` to ensure it is not unintentionally exposed to your local network.
* **Fail-Fast Installers:** Scripts now instantly catch errors (like missing 64-bit Python) and tell you exactly how to fix them, rather than crashing silently.

---

## 📸 Screenshots

*(Add your screenshots here! Just drag and drop images into GitHub while editing this file to upload them.)*

![Screenshot 1 Placeholder](https://via.placeholder.com/800x400.png?text=Step+1:+Import+and+Crop)
![Screenshot 2 Placeholder](https://via.placeholder.com/800x400.png?text=Step+3:+Live+Captioning+with+Qwen2-VL)

---

## 🚀 The "One-Click" Install & Setup Guide (For Beginners)

Since this app runs powerful AI models locally on your own hardware, it requires a dedicated Nvidia GPU and a few basic programs installed on your computer. Don't worry if you aren't computer savvy! Just follow these steps exactly.

### Step 1: Install the Prerequisites (Do this once)

Before you can run the app, your computer needs to know how to read the code. You need to install three standard programs:

1. **Python (The brain)**: 
   * Go to [python.org/downloads](https://www.python.org/downloads/) and download the **64-bit Windows installer** for **Python 3.11**. *(Note: PyTorch does not fully support Python 3.12+ or 32-bit versions yet. It is perfectly fine to have multiple versions of Python installed at the same time!)*
   * ⚠️ **CRITICAL STEP:** When you open the Python installer, look at the very bottom of the window. You **MUST** check the box that says **"Add Python to PATH"** before you click Install. If you miss this, the app will not work!
2. **Node.js (The user interface)**: 
   * Go to [nodejs.org](https://nodejs.org/) and download the "LTS" (Long Term Support) version. Install it normally (just keep clicking Next).
3. **Git (The downloader)**: 
   * Go to [git-scm.com/downloads](https://git-scm.com/downloads) and download it for your operating system. Install it normally (just keep clicking Next).

### Step 2: Download and Run the App

1. Download this repository to your computer (either via `git clone` or by clicking the green "Code" button and selecting "Download ZIP", then extracting it).
2. Open the folder you just downloaded/extracted.
3. **If you are on Windows:** Double-click the `start_windows.bat` file.
4. **If you are on Mac/Linux:** Open your terminal, navigate to the folder, and run `bash start_mac_linux.sh`.

### Step 3: Wait for the First-Time Setup

The script will automatically create an isolated environment and download everything it needs. 
* ☕ **Grab a coffee!** The first time you run this, it has to download the PyTorch machine learning library and the Qwen2-VL AI model. This is about **15GB of data** and can take a while depending on your internet speed.
* Once it finishes, two things will happen:
  1. A black terminal window will stay open (this is your AI brain running in the background).
  2. A browser window will automatically open to `http://localhost:5173` (this is the user interface).

*(Note: In the future, when you run the start script, it will launch almost instantly since everything is already downloaded!)*

---

## 🚶‍♂️ How to Use the App

1. **Step 1: Import & Crop:** Select your target resolution (e.g., 1024x1024 for SDXL/Flux). Drag and drop a folder of images into the app. It instantly processes them locally, detects faces, and crops them into perfect squares. Click "Continue to Curation".
2. **Step 2: Curation & Color:** You'll see a grid of your cropped images. Use the **Score Threshold** slider to filter out low-quality images (they turn red). Use the **Sort** dropdown (Best to Worst) to easily find and delete bad images. Click one of the **Automatic Color Grading** buttons to apply a uniform filter to every image.
3. **Step 3: Captioning:** Type in your **Trigger Word** (e.g., `xyz person`). Select your format: **Tags** (booru style) or **Sentences** (Flux/Midjourney style). Click **Start Captioning**. A live preview will show you exactly what the AI is writing for each image.
4. **Step 4: Review & Export:** Review your final grid and text. Click into any text box to manually edit a caption if the AI missed something. Choose your format (JPG or PNG) and click **Export Dataset**. You get a perfectly formatted `.zip` file ready for training!

---

## 🛠️ Troubleshooting

**"CUDA out of memory" error in the black terminal window:**
The default AI model (`Qwen2-VL-7B-Instruct`) requires about 8GB+ of VRAM. If your GPU has less memory, the server will crash when trying to caption. 
* **The Fix:** Open `local_caption_server.py` in a text editor (like Notepad). Change line 25 from `MODEL_ID = "Qwen/Qwen2-VL-7B-Instruct"` to `MODEL_ID = "Qwen/Qwen2-VL-2B-Instruct"`. Save the file, close the terminal windows, and run the start script again. The 2B model is much smaller and runs on almost any GPU!

**"Could not find a 64-bit installation of Python 3.10 or 3.11"**
You either have a 32-bit version of Python, or a version that is too new (like 3.13 or 3.14). PyTorch requires 64-bit Python 3.10 or 3.11. Go to python.org, download the 64-bit Windows installer for Python 3.11, install it, and run the script again. The script will automatically find it!
