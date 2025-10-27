"use client";

import React from "react";
import Image from "next/image";
import { FaStar } from "react-icons/fa";

export default function Resenas() {
  const reseñas = [
    {
      id: 1,
      nombre: "Héctor",
      avatar: "/default-avatar.png",
      texto:
        "Quiero la clase. Le faltó más dinamismo, pero el profesor fue amable y paciente. Excelente experiencia en general.",
      calificacion: 4.9,
    },
    {
      id: 2,
      nombre: "Héctor",
      avatar: "/default-avatar.png",
      texto:
        "Las clases fueron muy claras y útiles. Me ayudó a mejorar mi técnica rápidamente. Totalmente recomendado.",
      calificacion: 4.9,
    },
  ];

  return (
    <div className="w-full max-w-6xl bg-white shadow-md rounded-2xl p-8 mt-8">
      <h3 className="text-[#0b615b]/80 font-semibold text-lg mb-6">
        Reseñas recibidas
      </h3>

      <div className="space-y-4">
        {reseñas.map((r) => (
          <div
            key={r.id}
            className="flex items-start justify-between border border-[#d8d8d8] rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition"
          >
            {/* --- Lado izquierdo (avatar + texto) --- */}
            <div className="flex items-start gap-4">
              <Image
                src={r.avatar}
                alt={r.nombre}
                width={45}
                height={45}
                className="rounded-full object-cover"
              />
              <div className="text-gray-700 text-sm">
                <h4 className="text-[#0b615b] font-semibold text-base">
                  {r.nombre}
                </h4>
                <p className="mt-1 text-gray-600 leading-relaxed max-w-xl">
                  {r.texto}
                </p>
              </div>
            </div>

            {/* --- Calificación --- */}
            <div className="flex items-center gap-2 text-[#0b615b] font-semibold text-base min-w-[70px] justify-end">
              <FaStar className="text-[#0b615b] text-lg" />
              {r.calificacion}/5
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
