import { useState } from "react";
import axios from "axios";
import Logo from "../components/Logo";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("/api/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      onLogin();
    } catch (err: any) {
      setError(err.response?.data?.error || "Error de login");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#2d3748]">
      <div className="flex flex-col items-center mt-12">
        <Logo size="xl" className="mb-6" />
        <h1 className="text-3xl font-bold text-white mb-6 drop-shadow-lg">Bienvenido a ProCura</h1>
      </div>
      <div className="flex justify-center mt-10">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 bg-white p-10 rounded-xl shadow-2xl w-full max-w-sm"
        >
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder:text-gray-500"
          />
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
            placeholder="Contraseña"
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder:text-gray-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition-colors"
          >
            Entrar
          </button>
          {error && <div className="text-red-600 text-center font-semibold">{error}</div>}
        </form>
      </div>
    </div>
  );
} 