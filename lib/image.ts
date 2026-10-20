"use client";

/** 이 크기보다 큰 파일은 받지 않는다 (휴대폰 원본 사진은 보통 3~8MB) */
export const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
/** 저장할 data URL의 목표 크기 — localStorage(약 5MB)에 여러 장 들어가도록 */
const TARGET_CHARS = 160_000;

async function decode(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  // 사진의 회전 정보(EXIF)를 반영해 읽는다. 지원하지 않는 브라우저는 <img>로 읽는다.
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* 아래로 */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * 사진 파일 → 가운데를 정사각형으로 잘라 줄인 JPEG data URL.
 * 프로필 사진으로 쓰기 좋은 모양이고, 원본 대신 이걸 저장해 기기 저장 공간을 아낀다.
 */
export async function toSquarePhoto(file: File, size = 480): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("not-image");
  if (file.size > MAX_PHOTO_BYTES) throw new Error("too-large");
  const source = await decode(file);
  const side = Math.min(source.width, source.height);
  const out = Math.min(size, side);
  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-canvas");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    source,
    (source.width - side) / 2,
    (source.height - side) / 2,
    side,
    side,
    0,
    0,
    out,
    out
  );
  if ("close" in source && typeof source.close === "function") source.close();

  let quality = 0.86;
  let url = canvas.toDataURL("image/jpeg", quality);
  while (url.length > TARGET_CHARS && quality > 0.5) {
    quality -= 0.08;
    url = canvas.toDataURL("image/jpeg", quality);
  }
  return url;
}
