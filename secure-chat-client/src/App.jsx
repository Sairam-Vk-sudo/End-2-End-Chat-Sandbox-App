import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import UserList from "./components/UserList";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";

import {
  generateKeyPair,
  generateAESKey,
  encryptMessage,
  encryptAESKey,
} from "./utils/crypto";

const socket = io("http://localhost:5000");

function App() {
  const [privateKey, setPrivateKey] = useState(null);
  const [users, setUsers] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  // 🔐 Initial Setup
  useEffect(() => {
    socket.on("connect", async () => {
      console.log("Connected:", socket.id);

      const keyPair = await generateKeyPair();
      setPrivateKey(keyPair.privateKey);

      const exportedPublicKey = await crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey
      );

      const publicKeyBase64 = btoa(
        String.fromCharCode(...new Uint8Array(exportedPublicKey))
      );

      socket.emit("register", publicKeyBase64);
    });

    socket.on("users", (userList) => {
      setUsers(userList);
    });

    socket.on("receive-message", async (data) => {
      if (!privateKey) return;

      try {
        // 🔓 Decrypt AES key
        const decryptedAESKeyRaw = await crypto.subtle.decrypt(
          { name: "RSA-OAEP" },
          privateKey,
          new Uint8Array(data.encryptedAESKey)
        );

        const aesKey = await crypto.subtle.importKey(
          "raw",
          decryptedAESKeyRaw,
          { name: "AES-GCM" },
          true,
          ["decrypt"]
        );

        // 🔓 Decrypt message
        const decryptedMessage = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: new Uint8Array(data.iv) },
          aesKey,
          new Uint8Array(data.encryptedMessage)
        );

        const decoder = new TextDecoder();
        const finalMessage = decoder.decode(decryptedMessage);

        setChat((prev) => [...prev, "Friend: " + finalMessage]);
      } catch (err) {
        console.error("Decryption failed:", err);
      }
    });

    return () => {
      socket.off("users");
      socket.off("receive-message");
    };
  }, [privateKey]);

  // 📤 Send Encrypted Message
  async function sendMessage() {
    if (!selectedUser || !message) return;

    try {
      const aesKey = await generateAESKey();
      const { encrypted, iv } = await encryptMessage(message, aesKey);

      const encryptedAESKey = await encryptAESKey(
        aesKey,
        users[selectedUser]
      );

      socket.emit("send-message", {
        to: selectedUser,
        encryptedMessage: Array.from(new Uint8Array(encrypted)),
        encryptedAESKey: Array.from(new Uint8Array(encryptedAESKey)),
        iv: Array.from(iv),
      });

      setChat((prev) => [...prev, "You: " + message]);
      setMessage("");
    } catch (err) {
      console.error("Encryption failed:", err);
    }
  }

  return (
  <div className="flex h-screen bg-slate-950 text-white">

    {/* Sidebar */}
    <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">

      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold tracking-wide">
          🔐 SecureChat
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          End-to-End Encrypted
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {Object.keys(users)
          .filter((id) => id !== socket.id)
          .map((id) => (
            <button
              key={id}
              onClick={() => setSelectedUser(id)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all
              ${
                selectedUser === id
                  ? "bg-blue-600"
                  : "bg-slate-800 hover:bg-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>User {id.slice(0, 6)}...</span>
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              </div>
            </button>
          ))}
      </div>
    </div>

    {/* Chat Area */}
    <div className="flex-1 flex flex-col">

      {/* Messages */}
      <div className="flex-1 p-8 overflow-y-auto space-y-4">
        {chat.map((msg, index) => {
          const isYou = msg.startsWith("You:");

          return (
            <div
              key={index}
              className={`max-w-md px-5 py-3 rounded-2xl shadow-md
              ${
                isYou
                  ? "bg-blue-600 ml-auto"
                  : "bg-slate-800"
              }`}
            >
              <div className="text-sm">{msg}</div>

              {/* Encryption Badge
              <div className="text-xs text-slate-300 mt-2 flex items-center gap-1">
                🔐 AES-256 Encrypted
              </div> */}
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      {selectedUser && (
        <div className="p-6 border-t border-slate-800 bg-slate-900 flex gap-4">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a secure message..."
            className="flex-1 px-5 py-3 rounded-xl bg-slate-800 border border-slate-700 
            focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={sendMessage}
            className="px-6 py-3 bg-blue-600 rounded-xl 
            hover:bg-blue-700 transition-all shadow-lg"
          >
            Send
          </button>
        </div>
      )}
    </div>
  </div>
);

}

export default App
