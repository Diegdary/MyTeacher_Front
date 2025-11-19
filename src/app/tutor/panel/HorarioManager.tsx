"use client";

import React from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/auth";
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
];

const BLOQ_CANDIDATES = [
  `${API_BASE}/crud/bloqueos/`,
  `${API_BASE}/crud/bloqueos-horario/`,
  `${API_BASE}/crud/bloqueohorario/`,
  `${API_BASE}/crud/bloqueos_horario/`,
  `${API_BASE}/bloqueos/`,
];

type Disponibilidad = {
  id: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
};

type Bloqueo = {
  id: number;
  inicio: string;
  fin: string;
  motivo?: string;
};

export default function HorarioManager() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [disponibilidades, setDisponibilidades] = React.useState<Disponibilidad[]>([]);
  const [bloqueos, setBloqueos] = React.useState<Bloqueo[]>([]);

  const [dispUrl, setDispUrl] = React.useState<string>(ENV_DISP || DISP_ENDPOINT);
  const [bloqUrl, setBloqUrl] = React.useState<string>(ENV_BLOQ || BLOQ_ENDPOINT);

  const [newDia, setNewDia] = React.useState<number>(0);
  const [newInicio, setNewInicio] = React.useState<string>("08:00");
  const [newFin, setNewFin] = React.useState<string>("10:00");

  const [bloqInicio, setBloqInicio] = React.useState<string>("");
  const [bloqFin, setBloqFin] = React.useState<string>("");
  const [bloqMotivo, setBloqMotivo] = React.useState<string>("");

  const dias = React.useMemo(
    () => [
      { value: 0, label: "Lunes" },
      { value: 1, label: "Martes" },
      { value: 2, label: "Miercoles" },
      { value: 3, label: "Jueves" },
      { value: 4, label: "Viernes" },
      { value: 5, label: "Sabado" },
      { value: 6, label: "Domingo" },
    ],
    []
  );

  const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;

  async function authFetch(url: string, init: RequestInit = {}) {
    const headers: any = { "Content-Type": "application/json", ...(init.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { ...init, headers });
    const type = res.headers.get("content-type") || "";
    let data: any = null;
    try {
      data = type.includes("application/json") ? await res.json() : await res.text();
    } catch {}
    if (!res.ok) {
      const base = `[${res.status} ${res.statusText}] ${url}`;
      const detail = typeof data === "string" ? data : data?.detail || "Error";
      throw new Error(`${base} - ${detail}`);
    }
    return data;
  }

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
      throw new Error("No se encontro un endpoint valido (404)");
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

      const [d, b] = await Promise.all([authFetch(resolvedDisp), authFetch(resolvedBloq)]);
      setDisponibilidades(Array.isArray(d) ? d : d?.results ?? []);
      setBloqueos(Array.isArray(b) ? b : b?.results ?? []);
    } catch (e: any) {
      if (!token) setError("Necesitas iniciar sesion para gestionar tu horario.");
      else setError(e.message || "No se pudo cargar el horario");
    } finally {
      setLoading(false);
    }
  }, [token, resolveEndpoint]);

  React.useEffect(() => {
    cargar();
  }, [cargar]);

  const crearDisponibilidad = async () => {
    setError(null);
    if (!newInicio || !newFin) {
      setError("Completa inicio y fin");
      return;
    }
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
      setDisponibilidades((prev) => [created, ...prev]);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const borrarDisponibilidad = async (id: number) => {
    setError(null);
    try {
      await authFetch(`${dispUrl}${id}/`, { method: "DELETE" });
      setDisponibilidades((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const crearBloqueo = async () => {
    setError(null);
    if (!bloqInicio || !bloqFin) {
      setError("Completa inicio y fin del bloqueo");
      return;
    }
    try {
      const created = await authFetch(bloqUrl, {
        method: "POST",
        body: JSON.stringify({ inicio: bloqInicio, fin: bloqFin, motivo: bloqMotivo }),
      });
      setBloqueos((prev) => [created, ...prev]);
      setBloqMotivo("");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const borrarBloqueo = async (id: number) => {
    setError(null);
    try {
      await authFetch(`${bloqUrl}${id}/`, { method: "DELETE" });
      setBloqueos((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const dispoPorDia = React.useMemo(() => {
    const m = new Map<number, Disponibilidad[]>();
    for (const d of disponibilidades) {
      const arr = m.get(d.dia_semana) || [];
      arr.push(d);
      m.set(d.dia_semana, arr);
    }
    for (const [, arr] of m.entries()) arr.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    return m;
  }, [disponibilidades]);

  const totalHours = React.useMemo(() => {
    return disponibilidades.reduce((acc, slot) => {
      const start = parseMinutes(slot.hora_inicio);
      const end = parseMinutes(slot.hora_fin);
      if (start == null || end == null) return acc;
      return acc + Math.max(0, (end - start) / 60);
    }, 0);
  }, [disponibilidades]);

  const nextBlock = React.useMemo(() => {
    if (!bloqueos.length) return null;
    return [...bloqueos].sort(
      (a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
    )[0];
  }, [bloqueos]);

  return (
    <div className="space-y-8">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#0b615b]/20 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-[#0b615b]/70">Bloques activos</p>
          <p className="text-2xl font-semibold text-[#0b615b]">{disponibilidades.length}</p>
          <p className="text-xs text-gray-500">Disponibilidades registradas</p>
        </div>
        <div className="rounded-2xl border border-[#0b615b]/20 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-[#0b615b]/70">Horas abiertas</p>
          <p className="text-2xl font-semibold text-[#0b615b]">{totalHours.toFixed(1)}h</p>
          <p className="text-xs text-gray-500">Tiempo disponible por semana</p>
        </div>
        <div className="rounded-2xl border border-[#0b615b]/20 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-[#0b615b]/70">Proximo bloqueo</p>
          <p className="text-sm text-[#0b615b] font-semibold">{nextBlock ? formatDate(nextBlock.inicio) : "Sin bloqueos"}</p>
          <p className="text-xs text-gray-500">{nextBlock?.motivo || "Calendario libre"}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-3xl border border-[#0b615b]/10 bg-white p-6 shadow-sm">
          <h4 className="text-[#0b615b] font-semibold mb-4">Disponibilidad semanal</h4>
          <div className="grid md:grid-cols-4 gap-3 items-end">
            <label className="text-sm text-gray-600">
              Dia
              <select className="mt-1 w-full border rounded-lg p-2 text-sm" value={newDia} onChange={(e) => setNewDia(parseInt(e.target.value))}>
                {dias.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
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
            <button
              onClick={crearDisponibilidad}
              disabled={loading}
              className="bg-[#0b615b] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0a7f77] disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Agregar"}
            </button>
          </div>

          <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dias.map((d) => (
              <div key={d.value} className="border border-[#0b615b]/15 rounded-2xl bg-[#f7fcfc] p-4">
                <p className="text-xs uppercase tracking-wide text-[#0b615b]/70 mb-2">{d.label}</p>
                <div className="space-y-2 max-h-40 overflow-auto pr-1">
                  {(dispoPorDia.get(d.value) || []).length === 0 && <p className="text-gray-400 text-sm">Sin bloques</p>}
                  {(dispoPorDia.get(d.value) || []).map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between bg-white border border-[#0b615b]/10 rounded-lg px-3 py-2">
                      <span className="text-[#0b615b] text-sm font-medium">
                        {slot.hora_inicio.slice(0, 5)} - {slot.hora_fin.slice(0, 5)}
                      </span>
                      <button onClick={() => borrarDisponibilidad(slot.id)} className="text-red-600 text-xs hover:underline">
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-[#0b615b]/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#0b615b] mb-3">Bloqueo puntual</p>
            <div className="space-y-3">
              <label className="flex flex-col text-xs text-gray-600">
                Inicio
                <input type="datetime-local" className="mt-1 border rounded-lg p-2 text-sm" value={bloqInicio} onChange={(e) => setBloqInicio(e.target.value)} />
              </label>
              <label className="flex flex-col text-xs text-gray-600">
                Fin
                <input type="datetime-local" className="mt-1 border rounded-lg p-2 text-sm" value={bloqFin} onChange={(e) => setBloqFin(e.target.value)} />
              </label>
              <label className="flex flex-col text-xs text-gray-600">
                Motivo opcional
                <input type="text" placeholder="Vacaciones, evento..." className="mt-1 border rounded-lg p-2 text-sm" value={bloqMotivo} onChange={(e) => setBloqMotivo(e.target.value)} />
              </label>
              <button
                onClick={crearBloqueo}
                disabled={loading}
                className="w-full bg-[#0b615b] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0a7f77] disabled:opacity-60"
              >
                {loading ? "Guardando..." : "Guardar bloqueo"}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-[#0b615b]/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#0b615b] mb-3">Bloqueos programados</p>
            <div className="space-y-2 max-h-60 overflow-auto pr-1">
              {bloqueos.length === 0 && <p className="text-gray-400 text-sm">No hay bloqueos creados</p>}
              {bloqueos.map((b) => (
                <div key={b.id} className="flex items-center justify-between bg-[#f7fcfc] border border-[#0b615b]/15 rounded-lg px-3 py-2">
                  <span className="text-[#0b615b] text-sm font-medium">
                    {formatDate(b.inicio)} - {formatDate(b.fin)}
                    {b.motivo ? ` • ${b.motivo}` : ""}
                  </span>
                  <button onClick={() => borrarBloqueo(b.id)} className="text-red-600 text-xs hover:underline">
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
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
  } catch {
    return v;
  }
}

function parseMinutes(value: string) {
  if (!value) return null;
  const [h, m] = value.split(":").map((chunk) => Number(chunk));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}
