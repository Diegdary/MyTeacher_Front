"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function Header({
  onLoginClick,
}: {
  onLoginClick?: () => void;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState(false);

  // Determinar si el usuario es tutor
  const esTutor = user?.rol?.toLowerCase?.() === "tutor";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#dfe7e7] shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 md:px-8">
        {/* --- LOGO --- */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 shrink-0 hover:opacity-90 transition"
        >
          <Image
            src="/logo_nav.png"
            alt="MyTeacher"
            width={110}
            height={20}
            priority
            className="h-auto w-auto"
          />
        </button>

        {/* --- ACCIONES --- */}
        <div className="flex items-center gap-4">
          {/* ✅ Mostrar solo si el usuario está logueado */}
          {user && (
            <button
              onClick={() =>
                router.push(esTutor ? "/tutor/panel" : "/tutor/BeTutor")
              }
              className={`hidden sm:inline-flex items-center rounded-full text-sm font-medium px-4 py-2 transition ${
                esTutor
                  ? "bg-[#0b615b] text-white hover:bg-[#094e4a] shadow-[0_8px_24px_rgba(11,97,91,0.35)]"
                  : "bg-[#0b615b]/10 text-[#0b615b] hover:bg-[#0b615b]/15"
              }`}
            >
              {esTutor ? "Panel de tutor" : "Conviértete en tutor"}
            </button>
          )}

          {/* --- USUARIO --- */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setOpenMenu((v) => !v)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#0b615b] text-white font-semibold uppercase text-sm hover:opacity-90 transition"
              >
                {user.username?.[0] || user.email?.[0] || "?"}
              </button>

              {openMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-[#e5e8e8] shadow-[0_16px_40px_rgba(0,0,0,0.08)] text-sm animate-fadeIn">
                  <div className="px-4 py-3 border-b border-[#eef2f2] text-left">
                    <p className="text-[11px] text-gray-500 leading-none mb-1">
                      Sesión activa
                    </p>
                    <p className="text-[13px] font-semibold text-[#0b615b] truncate">
                      {user.username || user.email}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setOpenMenu(false);
                      router.push("/perfil");
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#0b615b]/5 text-[#0b615b] font-medium"
                  >
                    Mi perfil
                  </button>

                  {esTutor && (
                    <button
                      onClick={() => {
                        setOpenMenu(false);
                        router.push("/tutor/panel");
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#0b615b]/5 text-[#0b615b] font-medium"
                    >
                      Panel de tutor
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setOpenMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 font-medium border-t border-[#eef2f2]"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="inline-flex items-center rounded-full bg-[#0b615b] text-white text-sm font-medium px-4 py-2 hover:bg-[#094e4a] transition shadow-[0_8px_24px_rgba(11,97,91,0.35)]"
            >
              Iniciar sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
