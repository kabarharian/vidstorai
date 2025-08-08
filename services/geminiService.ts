import { GoogleGenAI, Type } from "@google/genai";
import type { AspectRatio } from "../types";

// The API key is obtained exclusively from the environment variable `process.env.API_KEY`.
// This variable is assumed to be pre-configured and accessible in the execution environment.
if (!process.env.API_KEY) {
  throw new Error("The API_KEY environment variable is not set. Please ensure it is configured in your execution environment.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a storyboard of 4 scenes from a user prompt.
 * @param prompt The user's initial idea.
 * @returns A promise that resolves to an array of scene descriptions.
 */
export const generateStoryboard = async (prompt: string): Promise<string[]> => {
  try {
    const systemInstruction = `You are a film director's assistant. Based on the user's prompt, create a storyboard of exactly 4 sequential, visually rich scenes for a short video. Each scene description should be a single, concise sentence perfect for an AI image generator. The description must be purely visual. Do not include camera directions like 'close-up' or 'wide shot'. Respond ONLY with a JSON array of objects, where each object has a 'scene_description' key.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              scene_description: {
                type: Type.STRING,
                description: "A single, concise, visual description of the scene."
              },
            },
            required: ["scene_description"],
          },
        },
      },
    });

    const jsonString = response.text.trim();
    const scenesArray: { scene_description: string }[] = JSON.parse(jsonString);
    
    if (!Array.isArray(scenesArray)) {
      throw new Error("AI did not return a valid array of scenes.");
    }
    
    return scenesArray.map(scene => scene.scene_description);

  } catch (error) {
    console.error("Error generating storyboard:", error);
    throw new Error("Failed to communicate with the AI to generate a storyboard.");
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
        const enhancedPrompt = `${sceneDescription}, cinematic lighting, hyper-detailed, epic, 16k resolution, cinematic`;
        
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: enhancedPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio,
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("The image generation model returned no images.");
        }
        
        return response.generatedImages[0].image.imageBytes;

    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error(`Failed to generate an image for scene: "${sceneDescription}"`);
    }
};