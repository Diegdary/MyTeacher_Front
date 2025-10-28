"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FaArrowRight } from "react-icons/fa";

export default function Mensajes() {
  const [selectedChat, setSelectedChat] = useState(0);
  const defaultAvatarUrl =
    "https://1.bp.blogspot.com/-_sEoHg_XDdU/Wm9aRBP3mxI/AAAAAAAAEfc/RNhCzXjPfCEuvUMikYK_lnTSoVH4ZzjegCK4BGAYYCw/s1600/look5-look5.st.JPG";
  const chats = [
    {
      id: 1,
      nombre: "Héctor",
      avatar: defaultAvatarUrl,
      mensajes: [
        { autor: "Héctor", texto: "Hola, me interesa la clase de baile." },
        { autor: "Tú", texto: "¡Hola Héctor! Claro, cuéntame qué nivel tienes." },
      ],
    },
    {
      id: 2,
      nombre: "Otro Héctor",
      avatar: defaultAvatarUrl,
      mensajes: [
        { autor: "Otro Héctor", texto: "¿Tienes horarios disponibles en la tarde?" },
      ],
    },
  ];

  const chat = chats[selectedChat];

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl mt-8">
      {/* --- LISTA DE CONVERSACIONES --- */}
      <div className="bg-white rounded-2xl shadow-md p-4 w-full md:w-1/3">
        <h3 className="text-[#0b615b] text-lg font-semibold mb-4 text-center">
          Conversación
        </h3>
        <div className="flex flex-col gap-3">
          {chats.map((c, index) => (
            <button
              key={c.id}
              onClick={() => setSelectedChat(index)}
              className={`flex items-center gap-3 border rounded-xl px-3 py-2 text-sm transition ${
                selectedChat === index
                  ? "border-[#0b615b] bg-[#e6f9ff]"
                  : "border-gray-200 hover:border-[#0b615b]/50"
              }`}
            >
              <Image
                src={c.avatar}
                alt={c.nombre}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
              <span className="text-[#0b615b] font-medium">{c.nombre}</span>
            </button>
          ))}
        </div>
      </div>

      {/* --- PANEL DE CHAT --- */}
      <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between w-full md:w-2/3 min-h-[400px]">
        <div>
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[#0b615b] font-semibold text-lg">
              Nueva solicitud · Est: {chat.nombre}
            </h4>
            <div className="flex items-center gap-2">
              <button className="bg-[#0b615b] text-white w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#094c46] transition">
                ✕
              </button>
              <button className="bg-[#0b615b] text-white w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#094c46] transition">
                ✓
              </button>
            </div>
          </div>

          {/* --- MENSAJES --- */}
          <div className="space-y-4">
            {chat.mensajes.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.autor === "Tú" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                    m.autor === "Tú"
                      ? "bg-[#c7f4ff] text-[#0b615b] self-end"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <p className="font-medium">{m.autor}</p>
                  <p>{m.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- INPUT DE MENSAJE --- */}
        <div className="mt-6 flex items-center gap-2">
          <input
            type="text"
            placeholder="Escribe aquí"
            className="flex-1 bg-[#e6f9ff] text-sm rounded-full px-4 py-2 focus:outline-none"
          />
          <button className="bg-[#0b615b] text-white p-3 rounded-full hover:bg-[#094c46] transition">
            <FaArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
