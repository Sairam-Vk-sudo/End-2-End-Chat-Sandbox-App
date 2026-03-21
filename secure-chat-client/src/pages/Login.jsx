import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { deriveMasterKey, decryptSymmetric } from "../utils/crypto";

function Login({ switchToRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);

  async function handleLogin() {
    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.token) {
        const base64ToBuf = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const masterKey = await deriveMasterKey(password, data.salt);

        const appKeyRaw = await decryptSymmetric(
          base64ToBuf(data.encryptedAppKey),
          base64ToBuf(data.ivAppKey),
          masterKey
        );
        const appKey = await crypto.subtle.importKey(
          "raw",
          appKeyRaw,
          { name: "AES-GCM" },
          true,
          ["encrypt", "decrypt"]
        );

        const privateKeyRaw = await decryptSymmetric(
          base64ToBuf(data.encryptedPrivateKey),
          base64ToBuf(data.ivPrivateKey),
          appKey
        );
        const privateKey = await crypto.subtle.importKey(
          "pkcs8",
          privateKeyRaw,
          { name: "RSA-OAEP", hash: "SHA-256" },
          true,
          ["decrypt"]
        );

        login(data.token, username, privateKey, data.publicKey);
      } else {
        alert("Invalid credentials: " + (data.error || ""));
      }
    } catch (err) {
      console.error(err);
      alert("Login failed or decryption error");
    }
  }

  return (
    <div className="flex flex-col gap-4 w-80">
      <h2 className="text-xl font-bold">Login</h2>

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
        onClick={handleLogin}
      >
        Login
      </button>

      <p className="text-sm cursor-pointer" onClick={switchToRegister}>
        Don’t have an account? Register
      </p>
    </div>
  );
}

export default Login;