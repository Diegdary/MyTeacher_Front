"use client";
import React from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/auth";
// Ajusta estas rutas según tu router DRF o usa overrides por ENV
const ENV_DISP = process.env.NEXT_PUBLIC_DISP_ENDPOINT;
const ENV_BLOQ = process.env.NEXT_PUBLIC_BLOQ_ENDPOINT;
const DISP_ENDPOINT = `${API_BASE}/crud/disponibilidades/`;
const BLOQ_ENDPOINT = `${API_BASE}/crud/bloqueos/`;
const DISP_CANDIDATES = [
  `${API_BASE}/crud/disponibilidades/`,
  `${API_BASE}/crud/disponibilidades-semanales/`,
  `${API_BASE}/crud/disponibilidadsemanal/`,
  `${API_BASE}/crud/disponibilidad-semanal/`,
  `${API_BASE}/crud/disponibilidades_semanales/`,
  `${API_BASE}/disponibilidades/`,
  `${API_BASE}/disponibilidades-semanales/`,
  `${API_BASE}/disponibilidadsemanal/`,
  `${API_BASE}/disponibilidad-semanal/`,
  `${API_BASE}/disponibilidades_semanales/`,
];
const BLOQ_CANDIDATES = [
  `${API_BASE}/crud/bloqueos/`,
  `${API_BASE}/crud/bloqueos-horario/`,
  `${API_BASE}/crud/bloqueohorario/`,
  `${API_BASE}/crud/bloqueos_horario/`,
  `${API_BASE}/bloqueos/`,
  `${API_BASE}/bloqueos-horario/`,
  `${API_BASE}/bloqueohorario/`,
  `${API_BASE}/bloqueos_horario/`,
];

type Disponibilidad = {
  id: number;
  dia_semana: number;   // 0=Lunes ... 6=Domingo
  hora_inicio: string;  // "HH:MM[:SS]"
  hora_fin: string;     // "HH:MM[:SS]"
  activo: boolean;
};

type Bloqueo = {
  id: number;
  inicio: string;       // ISO o "YYYY-MM-DDTHH:MM"
  fin: string;
  motivo?: string;
};

export default function HorarioManager() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [disponibilidades, setDisponibilidades] = React.useState<Disponibilidad[]>([]);
  const [bloqueos, setBloqueos] = React.useState<Bloqueo[]>([]);

  // Endpoints resueltos
  const [dispUrl, setDispUrl] = React.useState<string>(ENV_DISP || DISP_ENDPOINT);
  const [bloqUrl, setBloqUrl] = React.useState<string>(ENV_BLOQ || BLOQ_ENDPOINT);

  // Form disponibilidad
  const [newDia, setNewDia] = React.useState<number>(0);
  const [newInicio, setNewInicio] = React.useState<string>("08:00");
  const [newFin, setNewFin] = React.useState<string>("10:00");

  // Form bloqueo
  const [bloqInicio, setBloqInicio] = React.useState<string>("");
  const [bloqFin, setBloqFin] = React.useState<string>("");
  const [bloqMotivo, setBloqMotivo] = React.useState<string>("");

  const dias = React.useMemo(
    () => [
      { value: 0, label: "Lunes" },
      { value: 1, label: "Martes" },
      { value: 2, label: "Miércoles" },
      { value: 3, label: "Jueves" },
      { value: 4, label: "Viernes" },
      { value: 5, label: "Sábado" },
      { value: 6, label: "Domingo" },
    ],
    []
  );

  const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;

  async function authFetch(url: string, init: RequestInit = {}) {
    const headers: any = { "Content-Type": "application/json", ...(init.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { ...init, headers });
    const contentType = res.headers.get("content-type") || "";
    let data: any = null;
    try {
      if (contentType.includes("application/json")) data = await res.json();
      else data = await res.text();
    } catch {}
    if (!res.ok) {
      const base = `[${res.status} ${res.statusText}] ${url}`;
      if (typeof data === "string" && data) throw new Error(`${base} — ${data.slice(0, 200)}`);
      const detail = data?.detail || data?.non_field_errors || data || "Error";
      throw new Error(`${base} — ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
    }
    return data;
  }

  // Detección de endpoints válidos (acepta 401/403 como existencia)
  const resolveEndpoint = React.useCallback(
    async (candidates: string[]): Promise<string> => {
      for (const url of candidates) {
        try {
          const res = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (res.ok || res.status === 401 || res.status === 403) return url;
        } catch {}
      }
      throw new Error("No se encontró un endpoint válido en el backend (404)");
    },
    [token]
  );

  const cargar = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const resolvedDisp = ENV_DISP || (await resolveEndpoint(DISP_CANDIDATES));
      const resolvedBloq = ENV_BLOQ || (await resolveEndpoint(BLOQ_CANDIDATES));
      setDispUrl(resolvedDisp);
      setBloqUrl(resolvedBloq);

      const [d, b] = await Promise.all([
        authFetch(resolvedDisp),
        authFetch(resolvedBloq),
      ]);
      setDisponibilidades(Array.isArray(d) ? d : (d?.results ?? []));
      setBloqueos(Array.isArray(b) ? b : (b?.results ?? []));
    } catch (e: any) {
      if (!token) setError("No estás autenticado. Inicia sesión para gestionar tu horario.");
      else setError(e.message || "No se pudo cargar el horario");
    } finally {
      setLoading(false);
    }
  }, [token, resolveEndpoint]);

  React.useEffect(() => { cargar(); }, [cargar]);

  const crearDisponibilidad = async () => {
    setError(null);
    if (!newInicio || !newFin) return setError("Completa inicio y fin");
    try {
      const created = await authFetch(dispUrl, {
        method: "POST",
        body: JSON.stringify({
          dia_semana: newDia,
          hora_inicio: newInicio,
          hora_fin: newFin,
          activo: true,
        }),
      });
      setDisponibilidades(prev => [created, ...prev]);
    } catch (e: any) { setError(e.message); }
  };

  const borrarDisponibilidad = async (id: number) => {
    setError(null);
    try {
      await authFetch(`${dispUrl}${id}/`, { method: "DELETE" });
      setDisponibilidades(prev => prev.filter(x => x.id !== id));
    } catch (e: any) { setError(e.message); }
  };

  const crearBloqueo = async () => {
    setError(null);
    if (!bloqInicio || !bloqFin) return setError("Completa inicio y fin del bloqueo");
    try {
      const created = await authFetch(bloqUrl, {
        method: "POST",
        body: JSON.stringify({ inicio: bloqInicio, fin: bloqFin, motivo: bloqMotivo }),
      });
      setBloqueos(prev => [created, ...prev]);
      setBloqMotivo("");
    } catch (e: any) { setError(e.message); }
  };

  const borrarBloqueo = async (id: number) => {
    setError(null);
    try {
      await authFetch(`${bloqUrl}${id}/`, { method: "DELETE" });
      setBloqueos(prev => prev.filter(x => x.id !== id));
    } catch (e: any) { setError(e.message); }
  };

  const dispoPorDia = React.useMemo(() => {
    const m = new Map<number, Disponibilidad[]>();
    for (const d of disponibilidades) {
      const arr = m.get(d.dia_semana) || [];
      arr.push(d);
      m.set(d.dia_semana, arr);
    }
    for (const [k, arr] of m.entries()) arr.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    return m;
  }, [disponibilidades]);

  return (
    <div className="space-y-8">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>}

      {/* Disponibilidad semanal */}
      <div>
        <h4 className="text-[#0b615b] font-semibold mb-3">Disponibilidad semanal</h4>
        <div className="grid md:grid-cols-4 gap-3 items-end">
          <label className="text-sm text-gray-600">
            Día
            <select className="mt-1 w-full border rounded-lg p-2 text-sm" value={newDia} onChange={(e) => setNewDia(parseInt(e.target.value))}>
              {dias.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </label>
          <label className="text-sm text-gray-600">
            Inicio
            <input type="time" className="mt-1 w-full border rounded-lg p-2 text-sm" value={newInicio} onChange={(e) => setNewInicio(e.target.value)} />
          </label>
          <label className="text-sm text-gray-600">
            Fin
            <input type="time" className="mt-1 w-full border rounded-lg p-2 text-sm" value={newFin} onChange={(e) => setNewFin(e.target.value)} />
          </label>
          <button onClick={crearDisponibilidad} disabled={loading} className="bg-[#0b615b] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0a7f77] disabled:opacity-60">
            {loading ? "Guardando..." : "Agregar"}
          </button>
        </div>

        <div className="mt-5 grid md:grid-cols-3 gap-4">
          {dias.map(d => (
            <div key={d.value} className="border rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide text-[#0b615b]/70 mb-2">{d.label}</p>
              <div className="space-y-2">
                {(dispoPorDia.get(d.value) || []).length === 0 && <p className="text-gray-400 text-sm">Sin bloques</p>}
                {(dispoPorDia.get(d.value) || []).map(slot => (
                  <div key={slot.id} className="flex items-center justify-between bg-[#f7fafa] border rounded-lg px-3 py-2">
                    <span className="text-[#0b615b] text-sm font-medium">
                      {slot.hora_inicio.slice(0,5)} - {slot.hora_fin.slice(0,5)}
                    </span>
                    <button onClick={() => borrarDisponibilidad(slot.id)} className="text-red-600 text-xs hover:underline">Eliminar</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bloqueos puntuales */}
      <div>
        <h4 className="text-[#0b615b] font-semibold mb-3">Bloqueos puntuales</h4>
        <div className="grid md:grid-cols-5 gap-3 items-end">
          <label className="text-sm text-gray-600">
            Inicio
            <input type="datetime-local" className="mt-1 w-full border rounded-lg p-2 text-sm" value={bloqInicio} onChange={(e) => setBloqInicio(e.target.value)} />
          </label>
          <label className="text-sm text-gray-600">
            Fin
            <input type="datetime-local" className="mt-1 w-full border rounded-lg p-2 text-sm" value={bloqFin} onChange={(e) => setBloqFin(e.target.value)} />
          </label>
          <label className="text-sm text-gray-600 md:col-span-2">
            Motivo (opcional)
            <input type="text" placeholder="Vacaciones, evento..." className="mt-1 w-full border rounded-lg p-2 text-sm" value={bloqMotivo} onChange={(e) => setBloqMotivo(e.target.value)} />
          </label>
          <button onClick={crearBloqueo} disabled={loading} className="bg-[#0b615b] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0a7f77] disabled:opacity-60">
            {loading ? "Guardando..." : "Agregar"}
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {bloqueos.length === 0 && <p className="text-gray-400 text-sm">No hay bloqueos creados</p>}
          {bloqueos.map(b => (
            <div key={b.id} className="flex items-center justify-between bg-[#f7fafa] border rounded-lg px-3 py-2">
              <span className="text-[#0b615b] text-sm font-medium">
                {formatDate(b.inicio)} - {formatDate(b.fin)}{b.motivo ? ` · ${b.motivo}` : ""}
              </span>
              <button onClick={() => borrarBloqueo(b.id)} className="text-red-600 text-xs hover:underline">Eliminar</button>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-gray-400">Endpoints: disponibilidad {dispUrl} | bloqueos {bloqUrl}</p>
    </div>
  );
}

function formatDate(v: string) {
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return v;
    return d.toLocaleString();
  } catch { return v; }
}
