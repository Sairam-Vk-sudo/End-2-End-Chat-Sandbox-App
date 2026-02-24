import { useState } from "react";

function Register({ switchToLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister() {
    await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    alert("Registered successfully");
    switchToLogin();
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