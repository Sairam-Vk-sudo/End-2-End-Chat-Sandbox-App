import { useEffect, useState, useContext } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "../context/AuthContext";

import UserList from "./UserList";
import ChatWindow from "./ChatWindow";
import MessageInput from "./MessageInput";

import {
  generateKeyPair,
  generateAESKey,
  encryptMessage,
  encryptAESKey,
} from "../utils/crypto";

function Chat() {
  const { token } = useContext(AuthContext);

  const [socket, setSocket] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [users, setUsers] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  // 🔐 Connect socket after login
  useEffect(() => {
    if (!token) return;

    const newSocket = io("http://localhost:5000", {
      auth: { token },
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [token]);

  // 🔐 Setup encryption
  useEffect(() => {
    if (!socket) return;

    socket.on("connect", async () => {
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
  }, [socket, privateKey]);

  async function sendMessage() {
    if (!selectedUser || !message || !socket) return;

    const aesKey = await generateAESKey();
    const { encrypted, iv } = await encryptMessage(message, aesKey);

    const encryptedAESKey = await encryptAESKey(
      aesKey,
      users[selectedUser].publicKey
    );

    socket.emit("send-message", {
      to: selectedUser,
      encryptedMessage: Array.from(new Uint8Array(encrypted)),
      encryptedAESKey: Array.from(new Uint8Array(encryptedAESKey)),
      iv: Array.from(iv),
    });

    setChat((prev) => [...prev, "You: " + message]);
    setMessage("");
  }

  return (
    <div className="flex h-screen bg-slate-950 text-white">

      <UserList
        users={users}
        socketId={socket?.id}
        selectedUser={selectedUser}
        onSelect={setSelectedUser}
      />

      <div className="flex-1 flex flex-col">
        <ChatWindow chat={chat} />

        {selectedUser && (
          <MessageInput
            message={message}
            setMessage={setMessage}
            sendMessage={sendMessage}
          />
        )}
      </div>
    </div>
  );
}

export default Chat;