import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

let faceDetector: FaceDetector | null = null;

export async function initFaceDetector() {
  if (faceDetector) return faceDetector;
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );
  faceDetector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
      delegate: "GPU",
    },
    runningMode: "IMAGE",
  });
  return faceDetector;
}

export async function processImage(
  file: File,
  targetResolution: number
): Promise<{ blob: Blob; url: string; hasFace: boolean; flagged: boolean }> {
  return new Promise(async (resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      try {
        const detector = await initFaceDetector();
        const detections = detector.detect(img);
        
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");

        canvas.width = targetResolution;
        canvas.height = targetResolution;

        let hasFace = false;
        let flagged = false;

        // If image is smaller than target resolution, flag it
        if (img.width < targetResolution || img.height < targetResolution) {
          flagged = true;
        }

        if (detections.detections.length > 0) {
          hasFace = true;
          const face = detections.detections[0].boundingBox;
          if (face) {
            // Center crop on face
            const faceCenterX = face.originX + face.width / 2;
            const faceCenterY = face.originY + face.height / 2;
            
            let cropSize = Math.min(img.width, img.height);
            let startX = faceCenterX - cropSize / 2;
            let startY = faceCenterY - cropSize / 2;

            if (startX < 0) startX = 0;
            if (startY < 0) startY = 0;
            if (startX + cropSize > img.width) startX = img.width - cropSize;
            if (startY + cropSize > img.height) startY = img.height - cropSize;

            ctx.drawImage(
              img,
              startX,
              startY,
              cropSize,
              cropSize,
              0,
              0,
              targetResolution,
              targetResolution
            );
          }
        } else {
          // Center crop
          const cropSize = Math.min(img.width, img.height);
          const startX = (img.width - cropSize) / 2;
          const startY = (img.height - cropSize) / 2;
          
          ctx.drawImage(
            img,
            startX,
            startY,
            cropSize,
            cropSize,
            0,
            0,
            targetResolution,
            targetResolution
          );
        }

        canvas.toBlob((blob) => {
          if (blob) {
            resolve({ blob, url: URL.createObjectURL(blob), hasFace, flagged });
          } else {
            reject(new Error("Failed to create blob"));
          }
        }, file.type);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}
