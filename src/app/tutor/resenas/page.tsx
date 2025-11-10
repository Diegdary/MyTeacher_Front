"use client";

import React from "react";
import { FaStar } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { fetchWithAuth, API_BASE } from "../../lib/authFetch";

type Resena = {
  id_reseña?: number;
  id?: number;
  comentario?: string;
  puntuacion?: number;
  fecha_reseña?: string;
  tutor_id?: number;
  estudiante_id?: number;
};

export default function Resenas() {
  const { user } = useAuth();
  const [items, setItems] = React.useState<Resena[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const endpoint = React.useMemo(() => {
    if (user?.rol === "estudiante") return `${API_BASE}/resenas/enviadas/`;
    return `${API_BASE}/resenas/recibidas/`;
  }, [user]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true); setError(null);
      try {
        const data = await fetchWithAuth(endpoint);
        const list = Array.isArray(data) ? data : (data?.results ?? []);
        if (mounted) setItems(list);
      } catch (e: any) {
        if (mounted) setError(e.message);
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [endpoint]);

  return (
    <div className="w-full max-w-6xl bg-white shadow-md rounded-2xl p-8 mt-8">
      <h3 className="text-[#0b615b]/80 font-semibold text-lg mb-6">
        {user?.rol === "estudiante" ? "Mis reseñas enviadas" : "Reseñas recibidas"}
      </h3>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Cargando reseñas…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400">No hay reseñas para mostrar</p>
      ) : (
        <div className="space-y-4">
          {items.map((r: any) => (
            <div key={r.id || r.id_reseña} className="flex items-start justify-between border border-[#d8d8d8] rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition">
              <div className="text-gray-700 text-sm max-w-xl">
                <h4 className="text-[#0b615b] font-semibold text-base">
                  {user?.rol === "estudiante" ? `Tutor ${r.tutor_id || ""}` : `Est. ${r.estudiante_id || ""}`}
                </h4>
                <p className="mt-1 text-gray-600 leading-relaxed">{r.comentario || "Sin comentario"}</p>
                {r.fecha_reseña && (
                  <p className="mt-1 text-[11px] text-gray-400">{r.fecha_reseña}</p>
                )}
              </div>
              <div className="flex items-center gap-2 text-[#0b615b] font-semibold text-base min-w-[70px] justify-end">
                <FaStar className="text-[#0b615b] text-lg" />
                {(Number(r.puntuacion || 0)).toFixed(1)}/5
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
