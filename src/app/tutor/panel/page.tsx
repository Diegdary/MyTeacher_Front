"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FaStar } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import Header from "../../header/page";
import Mensajes from "../mensajes/page";
import Resenas from "../resenas/page";
export default function TutorPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("panel");

  return (
    <>
      {/* --- HEADER PRINCIPAL --- */}
      <Header />

      {/* --- SUBHEADER DEL PANEL --- */}
      <nav className="w-full bg-[#0b615b] text-white mt-16 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-start gap-10 px-6 h-12 text-sm font-medium">
          {[
            { id: "panel", label: "Panel de control" },
            { id: "mensajes", label: "Mensajes" },
            { id: "resenas", label: "Reseñas" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-1 transition ${
                activeTab === tab.id
                  ? "text-white after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-white"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* --- CONTENIDO --- */}
      <main className="min-h-screen bg-[#f7fafa] pt-12 pb-20 px-4 flex flex-col items-center">
        <div className="w-full max-w-6xl space-y-10">
          {/* === TAB: PANEL DE CONTROL === */}
          {activeTab === "panel" && (
            <>
              {/* --- SECCIÓN PERFIL Y SOLICITUDES --- */}
              <section className="grid md:grid-cols-2 gap-6">
                {/* Perfil */}
                <div className="bg-white shadow-md rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden shadow-md">
                    <Image
                      src={user?.avatar || "https://i.pinimg.com/564x/a0/77/70/a077702ce59215b8b5555fcbfa9604e4.jpg"}
                      alt="Tutor"
                      width={128}
                      height={128}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <h2 className="mt-4 text-[#0b615b] text-lg font-semibold">
                    {user?.username || "Samuel"}
                  </h2>
                </div>

                {/* Solicitudes recibidas */}
                <div className="bg-white shadow-md rounded-2xl p-6">
                  <h3 className="text-[#0b615b]/80 font-semibold text-lg mb-2">
                    Solicitudes recibidas
                  </h3>
                  <div className="border border-dashed border-[#0b615b]/30 rounded-xl p-10 text-gray-400 text-sm text-center">
                    (Aquí se mostrarán las solicitudes pendientes)
                  </div>
                </div>
              </section>

              {/* --- SECCIÓN EDITAR DATOS --- */}
              <section className="bg-white shadow-md rounded-2xl p-8">
                <h3 className="text-[#0b615b]/80 font-semibold text-lg mb-6">
                  Editar Mis datos
                </h3>

                <div className="grid md:grid-cols-2 gap-8 text-gray-600 text-sm">
                  
                  <div>
                    <p className="font-medium mb-2">
                      Nombre:{" "}
                      <span className="font-normal">
                        {user?.username || "Samuel"}
                      </span>
                    </p>

                    <p className="font-medium mb-2">Perfil</p>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">
                      Profesor de baile con más de 5 años de experiencia
                      enseñando diversos estilos como salsa, bachata y tango.
                    </p>

                    <p className="font-medium mb-2">Categorías</p>
                    <div className="flex flex-wrap gap-2">
                      {["Baile", "Arte", "Queer", "Pole dancing"].map((cat) => (
                        <span
                          key={cat}
                          className="px-3 py-1 bg-[#c7f4ff] text-[#0b615b] rounded-full text-xs font-medium"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                 
                  <div>
                    <p className="font-medium mb-2">Acerca de la clase</p>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">
                      Ofrezco clases personalizadas para todos los niveles y
                      edades. Mi objetivo es ayudarte a alcanzar tus metas de
                      aprendizaje de manera efectiva y divertida.
                    </p>

                    <p className="font-medium mb-2">Ubicación</p>
                    <p className="text-gray-500 mb-4">Barranquilla</p>

                    <p className="font-medium mb-2">Tipo de clase</p>
                    <div className="flex items-center gap-6 mb-4">
                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input type="radio" name="tipo" defaultChecked />{" "}
                        Presencial
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input type="radio" name="tipo" /> Virtual
                      </label>
                    </div>

                    <button className="bg-[#c7f4ff] text-[#0b615b] font-medium px-6 py-1.5 rounded-full text-sm hover:bg-[#b0ecff] transition">
                      Guardar
                    </button>
                  </div>
                </div>
              </section>

              {/* --- SECCIÓN RESEÑAS --- */}
              <section className="bg-white shadow-md rounded-2xl p-8">
                <h3 className="text-[#0b615b]/80 font-semibold text-lg mb-6">
                  Reseñas recibidas
                </h3>

                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 border border-[#e0e0e0] rounded-xl p-4"
                    >
                      <Image
                        src="https://1.bp.blogspot.com/-_sEoHg_XDdU/Wm9aRBP3mxI/AAAAAAAAEfc/RNhCzXjPfCEuvUMikYK_lnTSoVH4ZzjegCK4BGAYYCw/s1600/look5-look5.st.JPG"
                        alt="Reseña usuario"
                        width={45}
                        height={45}
                        className="rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[#0b615b] font-semibold text-sm">
                            Héctor
                          </h4>
                          <div className="flex items-center gap-1 text-[#0b615b] text-sm font-medium">
                            <FaStar className="text-[#0b615b]" />
                            4.9/5
                          </div>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">
                          Quiero la clase, necesito mejorar mis habilidades.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* --- SECCIÓN HORARIO --- */}
              <section className="bg-white shadow-md rounded-2xl p-8">
                <h3 className="text-[#0b615b]/80 font-semibold text-lg mb-6">
                  Editar Horario
                </h3>
                {/* Collage tipo mosaico del horario */}
                <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[88px] gap-3">
                  {[
                    { day: "Lunes", time: "08:00 - 10:00", span: "col-span-2 row-span-2", from: "#c7f4ff", to: "#eafff7" },
                    { day: "Martes", time: "14:00 - 16:00", span: "row-span-1", from: "#ffe4e6", to: "#fff7ed" },
                    { day: "Miércoles", time: "18:00 - 19:30", span: "row-span-1", from: "#e0f2fe", to: "#f0fdfa" },
                    { day: "Jueves", time: "09:00 - 11:00", span: "row-span-2", from: "#f5f3ff", to: "#ecfeff" },
                    { day: "Viernes", time: "16:00 - 18:00", span: "col-span-2 row-span-1", from: "#fff7ed", to: "#f0fdf4" },
                    { day: "Sábado", time: "10:00 - 12:00", span: "row-span-1", from: "#e9d5ff", to: "#f0f9ff" },
                    { day: "Domingo", time: "Libre", span: "row-span-1", from: "#f1f5f9", to: "#ffffff" },
                  ].map((slot, idx) => (
                    <div
                      key={idx}
                      className={`${slot.span} rounded-xl p-4 border border-[#e8e8e8] shadow-sm hover:shadow-md transition`}
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${slot.from}, ${slot.to})`,
                      }}
                    >
                      <p className="text-xs uppercase tracking-wide text-[#0b615b]/60">{slot.day}</p>
                      <p className="text-[#0b615b] font-semibold leading-tight">{slot.time}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">Vista ilustrativa tipo collage. (No editable aún)</p>
              </section>
            </>
          )}

          {/* MENSAJES*/}
          {activeTab === "mensajes" && <Mensajes />}


          {/*RESEÑAS */}
          {activeTab === "resenas" && <Resenas />}

        </div>
      </main>
    </>
  );
}
