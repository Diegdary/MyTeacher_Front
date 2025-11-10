"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FaStar } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import Header from "../../header/page";
import Mensajes from "../mensajes/page";
import Resenas from "../resenas/page";
import HorarioManager from "./HorarioManager";
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

              

              {/* --- SECCIÓN HORARIO --- */}
              <section className="bg-white shadow-md rounded-2xl p-8">
                
                <HorarioManager />
                
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
