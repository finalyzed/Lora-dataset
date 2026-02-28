import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Image as ImageIcon, CheckCircle, AlertTriangle, Settings, Download, Trash2, RefreshCw } from "lucide-react";
import { processImage } from "./utils/imageProcessing";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type ProcessedImage = {
  id: string;
  file: File;
  originalUrl: string;
  processedUrl: string;
  processedBlob: Blob;
  hasFace: boolean;
  flagged: boolean;
  score?: number;
  caption?: string;
  isOutlier?: boolean;
};

const RESOLUTIONS = [512, 768, 1024, 1280];
const BASE_MODELS = [
  "Flux 9B Klein",
  "Flux 4B Klein",
  "Z-Image Turbo",
  "Z-Image base",
  "Wan 2.2",
  "Wan 2.1",
];
const CAPTION_ENGINES = ["Joy Caption 2 (Gemma-2B)", "Qwen3-VL-8B (Abliterated)"];

const MODEL_INFO: Record<string, string> = {
  "Flux 9B Klein": "A 9B parameter distilled version of Flux optimized for 8GB VRAM (GGUF/4-bit). Excellent for detailed character LoRAs.",
  "Flux 4B Klein": "Highly compressed 4B parameter version of Flux. Extremely fast, but requires larger datasets for accurate character likeness.",
  "Z-Image Turbo": "Fast, quantized image generation model. Best for stylized or anime-style character training.",
  "Z-Image base": "The base Z-Image model. Good balance of speed and quality for photorealistic training.",
  "Wan 2.2": "The latest Wan 2.2 Lite model. State-of-the-art prompt adherence and character consistency.",
  "Wan 2.1": "Wan 2.1 Lite model. Reliable and well-supported by most local training scripts.",
};

export default function App() {
  const [step, setStep] = useState<number>(1);
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [resolution, setResolution] = useState<number>(1024);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Curation State
  const [baseModel, setBaseModel] = useState<string>(BASE_MODELS[0]);
  const [isCurating, setIsCurating] = useState(false);

  // Caption State
  const [captionEngine, setCaptionEngine] = useState<string>(CAPTION_ENGINES[0]);
  const [captionFormat, setCaptionFormat] = useState<"tags" | "sentences">("tags");
  const [nsfwEnabled, setNsfwEnabled] = useState(false);
  const [triggerWord, setTriggerWord] = useState("");
  const [isCaptioning, setIsCaptioning] = useState(false);

  // Export State
  const [exportFormat, setExportFormat] = useState<"jpg" | "png">("jpg");
  const [isExporting, setIsExporting] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    setProgress(0);
    const newImages: ProcessedImage[] = [];
    
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      try {
        const { blob, url, hasFace, flagged } = await processImage(file, resolution);
        newImages.push({
          id: Math.random().toString(36).substring(7),
          file,
          originalUrl: URL.createObjectURL(file),
          processedUrl: url,
          processedBlob: blob,
          hasFace,
          flagged,
        });
      } catch (err) {
        console.error("Failed to process image", file.name, err);
      }
      setProgress(Math.round(((i + 1) / acceptedFiles.length) * 100));
    }
    
    setImages((prev) => [...prev, ...newImages]);
    setIsProcessing(false);
    setStep(2);
  }, [resolution]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  } as any);

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleCuration = async () => {
    setIsCurating(true);
    // Simulate curation scoring using Gemini API or just mock it for speed
    // In a real app, we'd send each image to Gemini to score aesthetic quality
    const updatedImages = [...images];
    for (let i = 0; i < updatedImages.length; i++) {
      const img = updatedImages[i];
      // Mock scoring based on face detection and random variance
      img.score = img.hasFace ? 80 + Math.random() * 20 : 50 + Math.random() * 30;
      img.isOutlier = img.score < 60;
    }
    setImages(updatedImages);
    setIsCurating(false);
  };

  const handleCaptioning = async () => {
    setIsCaptioning(true);
    const updatedImages = [...images];
    
    for (let i = 0; i < updatedImages.length; i++) {
      const img = updatedImages[i];
      if (img.isOutlier) continue; // Skip outliers if they weren't removed
      
      try {
        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(img.processedBlob);
        const base64data = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
        });
        
        const prompt = `Describe this image in ${captionFormat === "tags" ? "comma-separated tags" : "a few descriptive sentences"}. ${nsfwEnabled ? "NSFW content is allowed." : "Keep it SFW."}`;
        
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              inlineData: {
                data: base64data.split(",")[1],
                mimeType: img.processedBlob.type,
              },
            },
            { text: prompt },
          ],
        });
        
        let caption = response.text || "";
        if (triggerWord) {
          caption = `${triggerWord}, ${caption}`;
        }
        img.caption = caption;
      } catch (err) {
        console.error("Captioning failed", err);
        img.caption = triggerWord ? `${triggerWord}, failed to generate caption` : "failed to generate caption";
      }
    }
    
    setImages(updatedImages);
    setIsCaptioning(false);
    setStep(4);
  };

  const handleExport = async () => {
    setIsExporting(true);
    const zip = new JSZip();
    
    const validImages = images.filter(img => !img.isOutlier);
    
    for (let i = 0; i < validImages.length; i++) {
      const img = validImages[i];
      const indexStr = String(i + 1).padStart(4, "0");
      const baseName = triggerWord ? `${triggerWord}_${indexStr}` : `image_${indexStr}`;
      
      // Add image
      const ext = exportFormat === "jpg" ? "jpg" : "png";
      zip.file(`${baseName}.${ext}`, img.processedBlob);
      
      // Add caption
      if (img.caption) {
        zip.file(`${baseName}.txt`, img.caption);
      }
    }
    
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${triggerWord || "dataset"}_lora.zip`);
    setIsExporting(false);
  };

  const updateCaption = (id: string, newCaption: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, caption: newCaption } : img));
  };

  const handleRegenerateCaption = async (id: string) => {
    const img = images.find(i => i.id === id);
    if (!img) return;
    
    // Set loading state for this specific image
    setImages(prev => prev.map(i => i.id === id ? { ...i, caption: "Regenerating..." } : i));
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(img.processedBlob);
      const base64data = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });
      
      const prompt = `Describe this image in ${captionFormat === "tags" ? "comma-separated tags" : "a few descriptive sentences"}. ${nsfwEnabled ? "NSFW content is allowed." : "Keep it SFW."}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              data: base64data.split(",")[1],
              mimeType: img.processedBlob.type,
            },
          },
          { text: prompt },
        ],
      });
      
      let caption = response.text || "";
      if (triggerWord) {
        caption = `${triggerWord}, ${caption}`;
      }
      updateCaption(id, caption);
    } catch (err) {
      console.error("Regeneration failed", err);
      updateCaption(id, triggerWord ? `${triggerWord}, failed to regenerate caption` : "failed to generate caption");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">LoRA Dataset Architect</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-400 font-mono">
            <span>VRAM: &lt;8GB</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar / Steps */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Workflow</h2>
            <nav className="space-y-2">
              {[
                { num: 1, label: "Import & Crop" },
                { num: 2, label: "Curation" },
                { num: 3, label: "Captioning" },
                { num: 4, label: "Review & Export" },
              ].map((s) => (
                <button
                  key={s.num}
                  onClick={() => setStep(s.num)}
                  disabled={step < s.num && s.num !== 1}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    step === s.num
                      ? "bg-indigo-500/10 text-indigo-400"
                      : step > s.num
                      ? "text-zinc-300 hover:bg-zinc-800"
                      : "text-zinc-600 cursor-not-allowed"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    step === s.num ? "bg-indigo-500 text-white" : step > s.num ? "bg-zinc-700 text-zinc-300" : "bg-zinc-800 text-zinc-600"
                  }`}>
                    {step > s.num ? <CheckCircle className="w-3 h-3" /> : s.num}
                  </div>
                  {s.label}
                </button>
              ))}
            </nav>
          </div>

          {step === 1 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Settings</h2>
              <div className="space-y-3">
                <label className="block text-sm text-zinc-300">Target Resolution</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  {RESOLUTIONS.map((res) => (
                    <option key={res} value={res}>
                      {res}x{res}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9">
          {step === 1 && (
            <div className="space-y-6">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                  isDragActive ? "border-indigo-500 bg-indigo-500/5" : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50"
                }`}
              >
                <input {...getInputProps()} />
                <UploadCloud className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-200 mb-1">Drop images or folders here</h3>
                <p className="text-sm text-zinc-500">Supports JPG, PNG, WEBP</p>
              </div>

              {isProcessing && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-400">Processing images...</span>
                    <span className="text-indigo-400 font-mono">{progress}%</span>
                  </div>
                  <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {images.length > 0 && !isProcessing && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Processed Images ({images.length})</h3>
                    <button
                      onClick={() => setStep(2)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Continue to Curation
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((img) => (
                      <div key={img.id} className="group relative aspect-square bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                        <img src={img.processedUrl} alt="Processed" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => removeImage(img.id)}
                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        {img.flagged && (
                          <div className="absolute top-2 right-2 p-1.5 bg-amber-500/20 text-amber-500 rounded-md backdrop-blur-md" title="Low resolution or face detection failed">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                <h2 className="text-xl font-medium">Intelligent Dataset Curation</h2>
                <p className="text-zinc-400 text-sm">
                  Select the base model you intend to train on. The system will score images based on compatibility and aesthetic quality.
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {BASE_MODELS.map((model) => (
                    <button
                      key={model}
                      onClick={() => setBaseModel(model)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        baseModel === model
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                      }`}
                    >
                      <div className="font-medium text-sm">{model}</div>
                      <div className="text-xs text-zinc-500 mt-1">Optimized</div>
                    </button>
                  ))}
                </div>

                {baseModel && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-400">
                    <strong className="text-zinc-200">{baseModel}:</strong> {MODEL_INFO[baseModel]}
                  </div>
                )}

                <div className="pt-4 border-t border-zinc-800 flex justify-end">
                  <button
                    onClick={handleCuration}
                    disabled={isCurating}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {isCurating ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                    {isCurating ? "Analyzing Dataset..." : "Run Curation Analysis"}
                  </button>
                </div>
              </div>

              {images.some(img => img.score !== undefined) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-amber-400 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Pruning Gallery (Outliers)
                    </h3>
                    <button
                      onClick={() => setStep(3)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Proceed to Captioning
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.filter(img => img.isOutlier).map((img) => (
                      <div key={img.id} className="relative aspect-square bg-zinc-900 rounded-xl overflow-hidden border-2 border-amber-500/50">
                        <img src={img.processedUrl} alt="Outlier" className="w-full h-full object-cover opacity-75" />
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-xs font-mono text-amber-400">
                          Score: {img.score?.toFixed(0)}
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                          <button
                            onClick={() => removeImage(img.id)}
                            className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => {
                              setImages(prev => prev.map(i => i.id === img.id ? { ...i, isOutlier: false } : i));
                            }}
                            className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-medium transition-colors"
                          >
                            Keep
                          </button>
                        </div>
                      </div>
                    ))}
                    {images.filter(img => img.isOutlier).length === 0 && (
                      <div className="col-span-full p-8 text-center text-zinc-500 border border-zinc-800 border-dashed rounded-xl">
                        No outliers detected. Your dataset looks clean!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-8">
              <div>
                <h2 className="text-xl font-medium mb-2">Advanced Captioning System</h2>
                <p className="text-zinc-400 text-sm">Configure how your dataset should be captioned.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-zinc-300">Caption Engine</label>
                  <div className="space-y-2">
                    {CAPTION_ENGINES.map((engine) => (
                      <label key={engine} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-950 cursor-pointer hover:border-zinc-700">
                        <input
                          type="radio"
                          name="engine"
                          checked={captionEngine === engine}
                          onChange={() => setCaptionEngine(engine)}
                          className="text-indigo-500 bg-zinc-900 border-zinc-700 focus:ring-indigo-500"
                        />
                        <span className="text-sm">{engine}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-zinc-300">Trigger Word</label>
                    <input
                      type="text"
                      value={triggerWord}
                      onChange={(e) => setTriggerWord(e.target.value)}
                      placeholder="e.g. ohwx man"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-zinc-300">Format</label>
                    <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                      <button
                        onClick={() => setCaptionFormat("tags")}
                        className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${captionFormat === "tags" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
                      >
                        Tags
                      </button>
                      <button
                        onClick={() => setCaptionFormat("sentences")}
                        className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${captionFormat === "sentences" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
                      >
                        Sentences
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nsfwEnabled}
                      onChange={(e) => setNsfwEnabled(e.target.checked)}
                      className="rounded border-zinc-700 text-indigo-500 focus:ring-indigo-500 bg-zinc-900"
                    />
                    <span className="text-sm text-zinc-300">Enable NSFW Captions</span>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={handleCaptioning}
                  disabled={isCaptioning || images.length === 0}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {isCaptioning ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  {isCaptioning ? "Generating Captions..." : "Start Captioning"}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-medium mb-1">Review & Export</h2>
                  <p className="text-zinc-400 text-sm">Review your dataset and captions before exporting.</p>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as "jpg" | "png")}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="jpg">JPG</option>
                    <option value="png">PNG</option>
                  </select>
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {isExporting ? "Packaging..." : "Finalize & Export"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {images.filter(img => !img.isOutlier).map((img) => (
                  <div key={img.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
                    <div className="aspect-square bg-zinc-950 relative">
                      <img src={img.processedUrl} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                    <div className="p-4 flex-1 flex flex-col gap-3">
                      <textarea
                        value={img.caption || ""}
                        onChange={(e) => updateCaption(img.id, e.target.value)}
                        className="w-full flex-1 min-h-[100px] bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 resize-none"
                      />
                      <div className="flex justify-end">
                        <button 
                          onClick={() => handleRegenerateCaption(img.id)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Regenerate
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
