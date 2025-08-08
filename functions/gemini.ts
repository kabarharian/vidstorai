import { GoogleGenAI, Type } from "@google/genai";

export const onRequestPost: PagesFunction = async (context) => {
  const { API_KEY } = context.env;
  if (!API_KEY) {
    return new Response(
      JSON.stringify({ error: "API_KEY is not set in environment." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const { type, prompt, sceneDescription, aspectRatio } = await context.request.json();

    if (type === "storyboard") {
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
      const scenesArray = JSON.parse(jsonString);
      if (!Array.isArray(scenesArray)) {
        throw new Error("AI did not return a valid array of scenes.");
      }
      return new Response(JSON.stringify({ scenes: scenesArray.map(s => s.scene_description) }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (type === "image") {
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
      return new Response(JSON.stringify({ image: response.generatedImages[0].image.imageBytes }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
