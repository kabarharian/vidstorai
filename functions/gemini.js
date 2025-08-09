
// Contoh implementasi onRequestPost jika belum ada
export async function onRequestPost(context) {
  // Membaca dan memproses data JSON dari request body
  let requestData = {};
  try {
    // Cek jika body kosong
    const text = await context.request.text();
    if (!text) {
      return new Response(JSON.stringify({ error: "Empty request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    requestData = JSON.parse(text);
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Proses data sesuai kebutuhan aplikasi
  // Contoh: echo kembali data yang diterima
  const responseData = {
    received: requestData,
    message: "Data processed successfully"
    // Tambahkan logika lain sesuai kebutuhan aplikasi Anda
  };

  return new Response(JSON.stringify(responseData), {
    headers: { "Content-Type": "application/json" }
  });
}

export const onRequest = async (context) => {
  if (context.request.method === "POST") {
    return await onRequestPost(context);
  }
  // Selalu kembalikan JSON untuk method yang tidak didukung
  return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" }
  });
};
