export type EvidenceMedia = {
  id?: string | null;
  url: string;
  originalName?: string | null;
  mimeType?: string | null;
  provider?: string | null;
  file?: File | null;
  isLocal?: boolean;
};

function normalizeEvidenceMedia(item: any): EvidenceMedia | null {
  if (typeof item === "string") {
    const url = item.trim();
    return url ? { url } : null;
  }
  if (!item || typeof item !== "object") return null;

  const urlValue = item.url || item.href || item.src;
  if (typeof urlValue !== "string" || !urlValue.trim()) return null;
  const file = typeof File !== "undefined" && item.file instanceof File ? item.file : null;

  return {
    id: item.id == null ? null : String(item.id),
    url: urlValue.trim(),
    originalName: item.originalName == null ? null : String(item.originalName),
    mimeType: item.mimeType == null ? null : String(item.mimeType),
    provider: item.provider == null ? null : String(item.provider),
    file,
    isLocal: Boolean(item.isLocal || file || urlValue.startsWith("blob:")),
  };
}

export function createLocalEvidenceMedia(file: File): EvidenceMedia {
  return {
    id: null,
    url: URL.createObjectURL(file),
    originalName: file.name,
    mimeType: file.type || null,
    provider: "local-preview",
    file,
    isLocal: true,
  };
}

export function revokeLocalEvidenceMedia(item: any) {
  if (item?.isLocal && typeof item.url === "string" && item.url.startsWith("blob:")) {
    URL.revokeObjectURL(item.url);
  }
}

export function normalizeEvidenceMediaList(input: any): EvidenceMedia[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => normalizeEvidenceMedia(item))
    .filter((item): item is EvidenceMedia => Boolean(item));
}

export function serializeEvidenceMediaList(input: any): EvidenceMedia[] {
  return normalizeEvidenceMediaList(input).map((item) => ({
    id: item.id ?? null,
    url: item.url,
    originalName: item.originalName ?? null,
    mimeType: item.mimeType ?? null,
    provider: item.provider ?? null,
    file: item.file ?? null,
    isLocal: item.isLocal ?? false,
  }));
}

export function evidenceMediaUrls(input: any): string[] {
  return normalizeEvidenceMediaList(input).map((item) => item.url);
}

export function normalizeItemStatesEvidence(itemStates: any) {
  if (!itemStates || typeof itemStates !== "object") return {};
  return Object.fromEntries(
    Object.entries(itemStates).map(([key, value]: [string, any]) => [
      key,
      {
        status: value?.status ?? null,
        note: value?.note ?? "",
        photos: normalizeEvidenceMediaList(value?.photos ?? value?.attachments ?? []),
      },
    ]),
  );
}
