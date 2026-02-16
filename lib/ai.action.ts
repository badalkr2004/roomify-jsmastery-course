import puter from "@heyputer/puter.js";
import {ROOMIFY_RENDER_PROMPT} from "./constants";

export async function fetchAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch image from ${url}: ${response.statusText}`,
    );
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert blob to Data URL"));
      }
    };
    reader.onerror = () => {
      reject(new Error("Error reading blob as Data URL"));
    };
    reader.readAsDataURL(blob);
  });
}

export const generate3DView = async ({ sourceImage }: Generate3DViewParams) => {
  const dataUrl = sourceImage.startsWith("data:")
    ? sourceImage
    : await fetchAsDataUrl(sourceImage);

  const [header, base64] = dataUrl.split(",");
  const mimeType = header.match(/:(.*?);/)?.[1];

  if (!mimeType || !base64) {
    console.error("Invalid data URL format:", { headerPrefix: header.substring(0, 20), hasBase64: !!base64 });
    throw new Error(`Invalid source image: failed to parse ${!mimeType ? "MIME type" : "base64 data"}`);
  }
  const response = await puter.ai.txt2img(ROOMIFY_RENDER_PROMPT,{
    provider: "gemini",
    model: "gemini-2.5-flash-image-preview",
    input_image: base64,
    input_image_mime_type: mimeType,
    ratio: { w: 1024, h: 1024 }
  });

  const rawImageUrl = (response as HTMLImageElement).src ?? null;

  if(!rawImageUrl) return {renderedImage: null, renderedPath: undefined}

  const renderedImage = rawImageUrl.startsWith("data:")
  ? rawImageUrl
  : await fetchAsDataUrl(rawImageUrl);

  return {renderedImage, renderedPath: undefined}

};
