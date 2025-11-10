"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaXTwitter } from "react-icons/fa6";
import { FaStar } from "react-icons/fa";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import "./globals.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import Header from "./header/page";
import { useAuth } from "./context/AuthContext";
import Categorias from "./categorias/page";
export default function HomePage() {
const API_URL = "http://127.0.0.1:8000/api/auth";
const router = useRouter();
const [showLogin, setShowLogin] = useState(false);
const [showRegister, setShowRegister] = useState(false);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [name, setName] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);
const [user] = useState<any | null>(null);
const { setUser } = useAuth();
// --- LOGIN ---
const handleLogin = async () => {
  setError(null);
  setSuccess(null);
  setLoading(true);

  if (!email || !password) {
    setError("Por favor, completa todos los campos 📝");
    setLoading(false);
    return;
  }

  try {
    const res = await fetch(`${API_URL}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.detail || Object.values(data)[0] || "Error al iniciar sesión ❌";
      throw new Error(Array.isArray(msg) ? msg[0] : msg);
    }

    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    localStorage.setItem("user", JSON.stringify(data.user));

    setUser(data.user);

    window.dispatchEvent(new Event("userLoggedIn"));

    
    setSuccess(`✅ Bienvenido ${data.user.username || data.user.email}`);

    
    setTimeout(() => {
      setShowLogin(false);
      setEmail("");
      setPassword("");
      setSuccess(null);
      try {
        const params = new URLSearchParams(window.location.search);
        const next = params.get("next");
        if (next) router.push(next);
      } catch {}
    }, 1500);
  } catch (err: any) {
    setError(err.message || "Error desconocido 😕");
  } finally {
    setLoading(false);
  }
};


// --- REGISTER ---
const handleRegister = async () => {
  setError(null);
  setSuccess(null);
  setLoading(true);

  if (!name || !email || !password ) {
    setError("Por favor, completa todos los campos 📝");
    setLoading(false);
    return;
  }

  

  try {
    const res = await fetch(`${API_URL}/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: name,
        email,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (typeof data === "object") {
        const firstError = Object.values(data)[0];
        throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
      }
      throw new Error("No se pudo registrar. Intenta de nuevo ❌");
    }

    setSuccess("🎉 Registro exitoso, ahora puedes iniciar sesión.");
    setTimeout(() => {
      setShowRegister(false);
      setShowLogin(true);
      setName("");
      setEmail("");
      setPassword("");
      
      setSuccess(null);
    }, 1500);
  } catch (err: any) {
    setError(err.message || "Error desconocido 😕");
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  const fetchUser = async () => {
    const token = localStorage.getItem("access");
    if (!token) {
      setUser(null);
      return;
    }
    const res = await fetch(`${API_URL}/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
    }
  };


  fetchUser();

 
  const handleLoginEvent = () => fetchUser();
  window.addEventListener("userLoggedIn", handleLoginEvent);

  return () => window.removeEventListener("userLoggedIn", handleLoginEvent);
}, []);

// Abrir modal de login automáticamente si ?login=1
useEffect(() => {
  try {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (params.get("login") === "1") setShowLogin(true);
  } catch {}
}, []);


  return (
    <main className="flex flex-col items-center w-full overflow-hidden">
      <Header onLoginClick={() => setShowLogin(true)} />

      {/* HERO SECTION */}
      <section className="w-full bg-gradient-to-b from-[#c7f4ff] to-white text-center py-32 mt-16">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between px-6">
          <div className="md:w-1/2 text-left space-y-6">
            <h1 className="text-5xl font-light text-[#4b4b4b] leading-tight">
              TUS CLASES <br />
              <span className="font-semibold text-[#58aeb9]">
                EN UN SOLO LUGAR
              </span>
            </h1>
            <button className="bg-[#0b615b] text-white px-10 py-3 rounded-full font-semibold text-lg hover:bg-[#0a7f77] transition">
              Comienza aquí
            </button>
          </div>

          <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center">
            <div className="w-[380px] h-[250px] rounded-xl overflow-hidden shadow-lg border-4 border-white hover:shadow-2xl transition-all duration-300">
              <Image
                src="/tutorialcabecera.jpg"
                alt="Tutor explicando en videollamada"
                width={380}
                height={250}
                className="object-cover w-full h-full"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ESTADÍSTICAS */}
      <section className="w-full py-10 text-center bg-white">
        <div className="flex flex-wrap justify-center gap-16 text-[#4b4b4b]">
          <div>
            <h3 className="text-3xl font-bold">10.000+</h3>
            <p className="text-sm">Tutores registrados y verificados</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold">30.000+</h3>
            <p className="text-sm">De estudiantes</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold">30+</h3>
            <p className="text-sm">Ciudades</p>
          </div>
        </div>
      </section>
      
    

      {/* CATEGORÍAS */}
      <Categorias />
      

      
      {/* SECCIÓN VUÉLVETE TUTOR */}
      <section className="w-full mt-20 bg-gradient-to-r from-[#c7f4ff] to-[#e6fbff] py-16 px-6 rounded-2xl shadow-sm">
  <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
    {/* Imagen */}
    <div className="relative w-full md:w-1/2 h-64 md:h-80 rounded-2xl overflow-hidden shadow-lg hover:scale-[1.02] transition-transform duration-300">
      <Image
        src="/tutoria16.jpg"
        alt="Tutor enseñando en clase"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-[#0b615b20]" />
    </div>

    {/* Texto */}
    <div className="md:w-1/2 text-center md:text-left space-y-5">
      <h2 className="text-3xl font-bold text-[#0b615b]">
        ¡Conviértete en tutor!
      </h2>
      <p className="text-gray-600 text-base leading-relaxed">
        Comparte tus conocimientos con miles de estudiantes y genera ingresos
        enseñando lo que te apasiona. Únete a nuestra comunidad de tutores
        certificados y empieza a transformar vidas hoy mismo.
      </p>
      <button className="bg-[#0b615b] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#0a7f77] transition duration-300 shadow-md hover:shadow-lg">
        Saber más
      </button>
    </div>
  </div>
</section>


      {/* CIUDADES */}
      <section className="w-full mt-20 text-center">
        <h3 className="text-2xl font-semibold text-[#4b4b4b] mb-10">
          Busca en tu Ciudad!
        </h3>

        <div className="flex flex-wrap justify-center gap-8 px-4">
          {Array(3)
            .fill(0)
            .map((_, col) => (
              <div
                key={col}
                className="bg-[#e8fdff] w-44 sm:w-56 rounded-2xl py-4 px-2 shadow-sm flex flex-col items-center justify-center space-y-2"
              >
                {Array(7)
                  .fill(["Barranquilla", "Bogotá", "Cali", "Medellín"])
                  .flat()
                  .map((city, i) => (
                    <p
                      key={i}
                      className="text-[#0b615b] text-sm font-light tracking-wide hover:text-[#058f85] transition"
                    >
                      {city}
                    </p>
                  ))}
              </div>
            ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-20 w-full bg-[#022e2a] text-white py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full"></div>
            <div>
              <p className="font-bold text-lg">my TEACHER</p>
              <p className="text-xs opacity-70">© 2025 MyTeacher Inc.</p>
            </div>
          </div>
          <div className="flex space-x-5 mt-6 md:mt-0 text-2xl">
            <FaFacebookF />
            <FaInstagram />
            <FaXTwitter />
            <FaLinkedinIn />
            <FaTiktok />
          </div>
        </div>
      </footer>

      {/* MODAL LOGIN */}
      {showLogin && (
        <div className="fixed inset-0 bg-[#00000095] flex justify-center items-center z-50 transition">
          <div className="bg-white rounded-2xl shadow-lg p-10 w-[90%] max-w-md relative text-center">
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-5 text-2xl text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <div className="flex justify-center h-[60px] text-[#0b615b] text-2xl font-semibold">
              <Image className=" h-full" src={'/logo_nav.png'} alt="Tutor explicando en videollamada" width={200} height={200}/>
            </div>
            <h3 className="text-lg text-gray-600 mt-4 mb-6">INICIA SESIÓN</h3>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <input
              type="email"
              placeholder="Correo Electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-4 px-4 py-3 bg-[#c7f4ff] rounded-full outline-none text-gray-700"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-6 px-4 py-3 bg-[#c7f4ff] rounded-full outline-none text-gray-700"
            />
            <button
              disabled={loading}
              onClick={handleLogin}
              className="bg-[#0b615b] text-white w-full py-3 rounded-full font-semibold hover:bg-[#0a7f77] transition disabled:opacity-60"
            >
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>

            <p className="text-sm mt-4 text-gray-600">
              No tienes cuenta?{" "}
              <span
                className="text-[#0b615b] font-semibold cursor-pointer hover:underline"
                onClick={() => {
                  setShowLogin(false);
                  setShowRegister(true);
                }}
              >
                Regístrate
              </span>
            </p>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO */}
{showRegister && (
  <div className="fixed inset-0 bg-[#00000095] flex justify-center items-center z-50 transition">
    <div className="bg-white rounded-2xl shadow-lg p-10 w-[90%] max-w-md relative text-center animate-fadeIn">
      {/* BOTÓN DE CIERRE */}
      <button
        onClick={() => setShowRegister(false)}
        className="absolute top-4 right-5 text-2xl text-gray-500 hover:text-gray-700"
      >
        ✕
      </button>

      {/* LOGO */}
      <div className="flex justify-center h-[60px] text-[#0b615b] text-2xl font-semibold">
        <Image className=" h-full" src={'/logo_nav.png'} alt="Tutor explicando en videollamada" width={200} height={200}/>
      </div>

      {/* TÍTULO */}
      <h3 className="text-lg text-gray-600 mt-4 mb-6">REGISTRAR</h3>

      {/* MENSAJE DE ERROR */}
      {error && (
        <p className="text-red-500 text-sm mb-3 whitespace-pre-line">
          {typeof error === "string"
            ? error
            : JSON.stringify(error, null, 2)}
        </p>
      )}

      {/* INPUTS */}
      <input
        type="text"
        placeholder="Nombre Completo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full mb-3 px-4 py-3 bg-[#c7f4ff] rounded-full outline-none text-gray-700"
      />
      <input
        type="email"
        placeholder="Correo Electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-3 px-4 py-3 bg-[#c7f4ff] rounded-full outline-none text-gray-700"
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full mb-6 px-4 py-3 bg-[#c7f4ff] rounded-full outline-none text-gray-700"
      />

      {/* BOTÓN REGISTRO */}
      <button
        disabled={loading}
        onClick={handleRegister}
        className="bg-[#0b615b] text-white w-full py-3 rounded-full font-semibold hover:bg-[#0a7f77] transition disabled:opacity-60"
      >
        {loading ? "Registrando..." : "Registrar"}
      </button>

      {/* LINK CAMBIO A LOGIN */}
      <p className="text-sm mt-4 text-gray-600">
        ¿Ya tienes cuenta?{" "}
        <span
          className="text-[#0b615b] font-semibold cursor-pointer hover:underline"
          onClick={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        >
          Inicia sesión
        </span>
      </p>
    </div>
  </div>
)}

    </main>
  );
}
