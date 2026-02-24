import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function Login({ switchToRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);

  async function handleLogin() {
    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (data.token) {
      login(data.token, username);
    } else {
      alert("Invalid credentials");
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