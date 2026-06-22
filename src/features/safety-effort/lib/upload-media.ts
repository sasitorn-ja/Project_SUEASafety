export type UploadedMedia = {
  id: string;
  url: string;
  originalName?: string | null;
  mimeType?: string | null;
  provider?: string | null;
};

export async function uploadSafetyEffortMedia(
  file: File,
  options: {
    ownerType: string;
    ownerId?: string | null;
    linkType: string;
  },
): Promise<UploadedMedia> {
  const formData = new FormData();
  formData.set("file", file);
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
