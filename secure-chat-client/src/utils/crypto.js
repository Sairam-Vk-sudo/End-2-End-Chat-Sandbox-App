export async function generateKeyPair() {
  return await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function generateAESKey() {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(message, aesKey) {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoder.encode(message)
  );

  return { encrypted, iv };
}

export async function encryptAESKey(aesKey, receiverPublicKeyBase64) {
  const binaryDer = Uint8Array.from(
    atob(receiverPublicKeyBase64),
    (c) => c.charCodeAt(0)
  );

  const receiverPublicKey = await crypto.subtle.importKey(
    "spki",
    binaryDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );

  const rawAESKey = await crypto.subtle.exportKey("raw", aesKey);

  return await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    receiverPublicKey,
    rawAESKey
  );
}
