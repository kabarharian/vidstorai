import { onRequestPost } from "./gemini";

export const onRequest = async (context) => {
  if (context.request.method === "POST") {
    return await onRequestPost(context);
  }
  return new Response("Method Not Allowed", { status: 405 });
};
