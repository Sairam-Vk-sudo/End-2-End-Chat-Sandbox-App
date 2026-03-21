import { useState } from "react";
import { generateKeyPair, generateAESKey, deriveMasterKey, encryptSymmetric } from "../utils/crypto";

function Register({ switchToLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister() {
    try {
      const keyPair = await generateKeyPair();
      const appKey = await generateAESKey();
      
      const saltBuffer = crypto.getRandomValues(new Uint8Array(16));
      const saltString = btoa(String.fromCharCode(...saltBuffer));
      const masterKey = await deriveMasterKey(password, saltString);
      
      const privateKeyRaw = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
      const appKeyRaw = await crypto.subtle.exportKey("raw", appKey);
      
      const { encrypted: encryptedPrivateKey, iv: ivPrivateKey } = await encryptSymmetric(privateKeyRaw, appKey);
      const { encrypted: encryptedAppKey, iv: ivAppKey } = await encryptSymmetric(appKeyRaw, masterKey);
      
      const publicKeyRaw = await crypto.subtle.exportKey("spki", keyPair.publicKey);
      const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyRaw)));

      const bufToBase64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));

      await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          publicKey: publicKeyBase64,
          encryptedPrivateKey: bufToBase64(encryptedPrivateKey),
          encryptedAppKey: bufToBase64(encryptedAppKey),
          ivAppKey: bufToBase64(ivAppKey),
          ivPrivateKey: bufToBase64(ivPrivateKey),
          salt: saltString
        }),
      });

      alert("Registered successfully");
      switchToLogin();
    } catch (err) {
      console.error(err);
      alert("Registration failed");
    }
  }

  return (
    <div className="flex flex-col gap-4 w-80">
      <h2 className="text-xl font-bold">Register</h2>

      <input
        className="p-2 rounded bg-slate-800 border border-slate-700"
        placeholder="Username"
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        className="p-2 rounded bg-slate-800 border border-slate-700"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        className="bg-blue-600 p-2 rounded hover:bg-blue-700"
        onClick={handleRegister}
      >
        Register
      </button>

      <p className="text-sm cursor-pointer" onClick={switchToLogin}>
        Already have an account? Login
      </p>
    </div>
  );
}

export default Register;