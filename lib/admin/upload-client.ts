export type UploadKind = "image" | "video" | "document" | "audio";

export interface UploadResult {
  url: string;
  path: string;
  fileName: string;
}

const KIND_LIMITS: Record<UploadKind, number> = {
  image: 8 * 1024 * 1024,
  video: 200 * 1024 * 1024,
  document: 20 * 1024 * 1024,
  audio: 15 * 1024 * 1024,
};

const KIND_TEST: Record<UploadKind, (mime: string) => boolean> = {
  image: (m) => m.startsWith("image/"),
  video: (m) => m.startsWith("video/"),
  document: (m) =>
    m === "application/pdf" ||
    m === "application/msword" ||
    m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    m === "application/vnd.ms-excel" ||
    m === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  audio: (m) => m.startsWith("audio/"),
};

const KIND_LABEL: Record<UploadKind, string> = {
  image: "görsel",
  video: "video",
  document: "PDF/Word/Excel belgesi",
  audio: "ses",
};

// /api/admin/upload'a XHR ile gönderir — gerçek yükleme ilerlemesi (upload.onprogress)
// için fetch değil bilinçli olarak XMLHttpRequest kullanılıyor. ImageUpload,
// BulkImageUpload, VideoUpload ve DocumentUpload bileşenlerinin ortak yükleme mantığı.
export function uploadFile(
  file: File,
  folder: string,
  kind: UploadKind,
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    if (!KIND_TEST[kind](file.type)) {
      reject(new Error(`Yalnızca ${KIND_LABEL[kind]} dosyası yükleyebilirsiniz.`));
      return;
    }
    if (file.size > KIND_LIMITS[kind]) {
      reject(new Error(`Dosya ${Math.round(KIND_LIMITS[kind] / (1024 * 1024))}MB'tan büyük olamaz.`));
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    fd.append("kind", kind);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        const message = (() => {
          try {
            return JSON.parse(xhr.responseText).error;
          } catch {
            return null;
          }
        })();
        reject(new Error(message ?? "Yükleme başarısız oldu."));
      }
    };
    xhr.onerror = () => reject(new Error("Yükleme başarısız oldu."));
    xhr.send(fd);
  });
}

export function deleteUploadedFile(path: string): Promise<void> {
  return fetch(`/api/admin/upload?path=${encodeURIComponent(path)}`, { method: "DELETE" }).then(() => undefined);
}

export function storagePathFromUrl(url: string): string | null {
  const match = url.match(/\/object\/public\/media\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}
