import type { AspectRatio } from "../types";

/**
 * Generates a storyboard of 4 scenes from a user prompt.
 * @param prompt The user's initial idea.
 * @returns A promise that resolves to an array of scene descriptions.
 */
export const generateStoryboard = async (prompt: string): Promise<string[]> => {
  try {
  const res = await fetch("https://gemini.ipadnn-com.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "storyboard", prompt }),
    });
    const text = await res.text();
    if (!text) {
      throw new Error("Empty response from server");
    }
    const json = JSON.parse(text);
    if (!res.ok) {
      // Tampilkan error details jika ada
      const details = json.details ? `\nDetails: ${JSON.stringify(json.details)}` : '';
      throw new Error((json.error || "Failed to generate storyboard") + details);
    }
    return json.scenes;
  } catch (error) {
    console.error("Error generating storyboard:", error);
    throw error;
  }
};

/**
 * Generates an image for a single scene description.
 * @param sceneDescription The description of the scene to generate an image for.
 * @param aspectRatio The desired aspect ratio for the image ('16:9', '9:16', or '1:1').
 * @returns A promise that resolves to a base64 encoded image string.
 */
export const generateImageForScene = async (sceneDescription: string, aspectRatio: AspectRatio): Promise<string> => {
  try {
  const res = await fetch("https://gemini.ipadnn-com.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "image", sceneDescription, aspectRatio }),
    });
    const text = await res.text();
    if (!text) {
      throw new Error("Empty response from server");
    }
    const json = JSON.parse(text);
    if (!res.ok) {
      // Tampilkan error details jika ada
      const details = json.details ? `\nDetails: ${JSON.stringify(json.details)}` : '';
      throw new Error((json.error || "Failed to generate image") + details);
    }
    return json.image;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};
