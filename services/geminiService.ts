import type { AspectRatio } from "../types";

/**
 * Generates a storyboard of 4 scenes from a user prompt.
 * @param prompt The user's initial idea.
 * @returns A promise that resolves to an array of scene descriptions.
 */
export const generateStoryboard = async (prompt: string): Promise<string[]> => {
  try {
    const res = await fetch("/functions/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "storyboard", prompt }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to generate storyboard");
    }
    const data = await res.json();
    return data.scenes;
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
    const res = await fetch("/functions/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "image", sceneDescription, aspectRatio }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to generate image");
    }
    const data = await res.json();
    return data.image;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};
