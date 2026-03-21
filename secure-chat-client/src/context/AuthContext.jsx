import { createContext, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [publicKey, setPublicKey] = useState(null);

  const login = (jwtToken, user, key, pubKey) => {
    setToken(jwtToken);
    setUsername(user);
    setPrivateKey(key);
    setPublicKey(pubKey);
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    setPrivateKey(null);
    setPublicKey(null);
  };

  return (
    <AuthContext.Provider value={{ token, username, privateKey, publicKey, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}