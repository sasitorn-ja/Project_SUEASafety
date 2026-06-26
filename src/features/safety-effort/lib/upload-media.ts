export type UploadedMedia = {
  id: string;
  url: string;
  originalName?: string | null;
  mimeType?: string | null;
  provider?: string | null;
};

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const TARGET_UPLOAD_BYTES = Math.floor(MAX_UPLOAD_BYTES * 0.92);
const MAX_IMAGE_DIMENSION = 2048;
const DIRECT_UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function canUploadDirectly(file: File) {
  return DIRECT_UPLOAD_TYPES.has(file.type) && file.size <= TARGET_UPLOAD_BYTES;
}

async function loadImageElement(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("image_decode_failed"));
      nextImage.src = objectUrl;
    });
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  if (!blob) throw new Error("image_encode_failed");
  return blob;
}

async function normalizeImageForUpload(file: File) {
  if (canUploadDirectly(file)) return file;
  if (!file.type.startsWith("image/")) throw new Error("unsupported_file_type");
  if (file.type === "image/gif" && file.size > TARGET_UPLOAD_BYTES) throw new Error("file_too_large");

  const image = await loadImageElement(file);
  let width = image.naturalWidth || image.width;
  let height = image.naturalHeight || image.height;

  if (!width || !height) throw new Error("image_decode_failed");

  const initialScale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height));
  width = Math.max(1, Math.round(width * initialScale));
  height = Math.max(1, Math.round(height * initialScale));

  const canvas = document.createElement("canvas");

  for (let attempt = 0; attempt < 6; attempt += 1) {
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("image_encode_failed");

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const quality of [0.9, 0.82, 0.74, 0.66, 0.58]) {
      const blob = await canvasToBlob(canvas, "image/jpeg", quality);
      if (blob.size <= TARGET_UPLOAD_BYTES) {
        const normalizedName = file.name.replace(/\.[^.]+$/, "") || "upload";
        return new File([blob], `${normalizedName}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
      }
    }

    width = Math.max(1, Math.round(width * 0.82));
    height = Math.max(1, Math.round(height * 0.82));
  }

  throw new Error("file_too_large");
}

export async function uploadSafetyEffortMedia(
  file: File,
  options: {
    ownerType: string;
    ownerId?: string | null;
    linkType: string;
  },
): Promise<UploadedMedia> {
  const normalizedFile = await normalizeImageForUpload(file);
  const formData = new FormData();
  formData.set("file", normalizedFile);
  formData.set("module", "safety-effort");
  formData.set("ownerType", options.ownerType);
  formData.set("linkType", options.linkType);
  if (options.ownerId) formData.set("ownerId", options.ownerId);

  const response = await fetch("/api/uploads", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const payload = await response.json().catch(() => null);
  const media = payload?.data?.media || payload?.data?.attachment;

  if (!response.ok || !payload?.ok || !media?.url || !media?.id) {
    throw new Error(payload?.error || "upload_failed");
  }

  return media;
}

export async function uploadSafetyEffortMediaSource(
  source: string,
  options: Parameters<typeof uploadSafetyEffortMedia>[1] & { fileName: string },
) {
  if (!source.startsWith("data:") && !source.startsWith("blob:")) return { id: "", url: source };
  const response = await fetch(source);
  if (!response.ok) throw new Error("media_source_read_failed");
  const blob = await response.blob();
  const file = new File([blob], options.fileName, { type: blob.type || "image/jpeg" });
  return uploadSafetyEffortMedia(file, options);
}
