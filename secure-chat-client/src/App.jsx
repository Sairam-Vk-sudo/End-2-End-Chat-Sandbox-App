import { useContext, useState } from "react";
import { AuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./components/Chat";

function App() {
  const { token } = useContext(AuthContext);
  const [showLogin, setShowLogin] = useState(true);

  if (!token) {
    return (
      <div className="flex h-screen justify-center items-center bg-slate-950 text-white">
        {showLogin ? (
          <Login switchToRegister={() => setShowLogin(false)} />
        ) : (
          <Register switchToLogin={() => setShowLogin(true)} />
        )}
      </div>
    );
  }

  return <Chat />;
}

export default App;