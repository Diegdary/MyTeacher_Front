"use client";
import React, { useState } from "react";
import Image from "next/image";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaXTwitter,
} from "react-icons/fa6";
import { FaStar } from "react-icons/fa";
import "./globals.css";

export default function HomePage() {
const API_URL = "http://127.0.0.1:8000/api/auth";

const [showLogin, setShowLogin] = useState(false);
const [showRegister, setShowRegister] = useState(false);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [name, setName] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);

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
      if (data?.detail) {
        throw new Error(data.detail);
      } else if (typeof data === "object") {
        const firstError = Object.values(data)[0];
        throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        throw new Error("Error al iniciar sesión ❌");
      }
    }

    // Guardar tokens en localStorage
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    localStorage.setItem("user", JSON.stringify(data.user));

    setSuccess(`✅ Bienvenido ${data.user.username || data.user.email}`);
    setTimeout(() => {
      setShowLogin(false);
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


  return (
    <main className="flex flex-col items-center w-full overflow-hidden">
      {/* NAVBAR */}
      <nav className="w-full flex justify-between items-center px-10 py-4 bg-white shadow-sm fixed top-0 z-50">
        <h1 className="text-[#0b615b] text-2xl font-semibold">my TEACHER</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowRegister(true)}
            className="bg-[#d3f9ff] text-[#0b615b] px-5 py-2 rounded-full font-medium hover:bg-[#bdf2ff] transition"
          >
            Conviértete en tutor
          </button>
          <button
            onClick={() => setShowLogin(true)}
            className="bg-[#d3f9ff] text-[#0b615b] px-5 py-2 rounded-full font-medium hover:bg-[#bdf2ff] transition"
          >
            Iniciar sesión
          </button>
        </div>
      </nav>

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
      <section className="max-w-4xl w-full grid md:grid-cols-2 gap-6 text-center text-[#0b615b] px-4">
        {[
          { name: "Tutores de deportes", icon: "⚽" },
          { name: "Tutores de música", icon: "🎵" },
          { name: "Tutores de inglés", icon: "EN" },
          { name: "Tutores de matemáticas", icon: "∑" },
        ].map((cat, i) => (
          <div
            key={i}
            className="border border-[#0b615b] rounded-xl py-6 px-4 flex items-center justify-between hover:bg-[#e5ffff] transition"
          >
            <span className="text-lg font-semibold flex items-center gap-3">
              <span className="text-2xl">{cat.icon}</span> {cat.name}
            </span>
            <span className="text-[#0b615b] text-xl">➜</span>
          </div>
        ))}
      </section>

      {/* BUSCADOR */}
      <section className="mt-14 mb-4 w-full flex justify-center">
        <div className="flex w-[80%] max-w-lg rounded-full overflow-hidden bg-gradient-to-r from-[#c7f4ff] to-[#e8ffff] shadow-sm">
          <input
            type="text"
            placeholder="Busca aquí"
            className="flex-grow px-6 py-3 bg-transparent outline-none text-[#0b615b] placeholder-[#64a7b3]"
          />
          <button className="bg-[#0b615b] text-white px-6 hover:bg-[#0a7f77] transition">
            🔍
          </button>
        </div>
      </section>

      <p className="text-sm text-[#67b1b8] mb-10 flex items-center gap-1">
        Contamos con miles de tutores calificados y evaluados <FaStar />
      </p>

      {/* TUTORES */}
      <section className="max-w-6xl mx-auto px-4 grid md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-md p-4 text-center border border-[#e0e0e0]"
          >
            <div className="w-full h-52 bg-gray-200 rounded-md flex items-center justify-center">
              <span className="text-gray-500 text-sm">[Foto tutor]</span>
            </div>
            <div className="mt-3 text-sm text-gray-700 space-y-1">
              <p className="font-semibold">50k / hora</p>
              <p className="flex justify-center items-center gap-1 text-[#0b615b]">
                <FaStar className="text-yellow-400" /> 5/5 (69 opiniones)
              </p>
              <p className="text-gray-500 text-xs leading-tight">
                Baile erótico. Soy Samuel, bailarín desde hace años, mente
                abierta...
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* SECCIÓN VUÉLVETE TUTOR */}
      <section className="w-full mt-20 max-w-5xl bg-[#c7f4ff] py-10 px-6 text-center rounded-2xl shadow-sm">
        <div className="max-w-xl mx-auto space-y-5">
          <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-500 text-sm">[Imagen de tutoría]</span>
          </div>
          <h2 className="text-2xl font-semibold text-[#0b615b]">
            ¡Vuélvete un tutor!
          </h2>
          <p className="text-sm text-[#4b4b4b]">
            Este es un texto invitando a volverte tutor, animando a enseñar tus
            habilidades y generar ingresos.
          </p>
          <button className="bg-[#0b615b] text-white px-8 py-2 rounded-full font-semibold hover:bg-[#0a7f77] transition">
            Saber más
          </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 transition">
          <div className="bg-white rounded-2xl shadow-lg p-10 w-[90%] max-w-md relative text-center">
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-5 text-2xl text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <div className="flex flex-col items-center space-y-2">
              <Image src="/file.svg" alt="Logo" width={50} height={50} />
              <h2 className="text-3xl font-bold text-[#0b615b]">my TEACHER</h2>
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
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 transition">
    <div className="bg-white rounded-2xl shadow-lg p-10 w-[90%] max-w-md relative text-center animate-fadeIn">
      {/* BOTÓN DE CIERRE */}
      <button
        onClick={() => setShowRegister(false)}
        className="absolute top-4 right-5 text-2xl text-gray-500 hover:text-gray-700"
      >
        ✕
      </button>

      {/* LOGO */}
      <div className="flex flex-col items-center space-y-2">
        <Image src="/file.svg" alt="Logo" width={50} height={50} />
        <h2 className="text-3xl font-bold text-[#0b615b]">my TEACHER</h2>
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
