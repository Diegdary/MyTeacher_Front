"use client";

import React from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/auth";
const CRUD = `${API_BASE}/crud`;
const SOLI = `${CRUD}/solicitudes-reserva/`;

type Categoria = { id_categoria?: number; id?: number; nombre?: string; descripcion?: string } | any;
type Curso = any;
type Usuario = any;

export default function CategoriaCursosPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const catId = Number(params?.id);
  const { user } = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [categoria, setCategoria] = React.useState<Categoria | null>(null);
  const [cursos, setCursos] = React.useState<Curso[]>([]);
  const [tutores, setTutores] = React.useState<Record<number, Usuario>>({});
  const [requestFor, setRequestFor] = React.useState<number | null>(null);
  const [requestMsg, setRequestMsg] = React.useState<string | null>(null);
  // Filtros
  const [modFilter, setModFilter] = React.useState<string>(""); // '', 'presencial', 'virtual', 'ambas'
  const [cityFilter, setCityFilter] = React.useState<string>("");

  const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;

  async function apiFetch(url: string, init: RequestInit = {}) {
    const headers: any = { "Content-Type": "application/json", ...(init.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { ...init, headers });
    const ct = res.headers.get("content-type") || "";
    let data: any = null;
    try { data = ct.includes("application/json") ? await res.json() : await res.text(); } catch {}
    if (!res.ok) {
      const base = `[${res.status} ${res.statusText}] ${url}`;
      const detail = typeof data === "string" ? data : (data?.detail || data || "Error");
      throw new Error(`${base} — ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
    }
    return data;
  }

  const loadCategoria = React.useCallback(async () => {
    try {
      const data = await apiFetch(`${CRUD}/categorias/${catId}/`);
      setCategoria(data);
    } catch (e: any) {
      // Si no existe endpoint detail, no bloquea la vista
      setCategoria({ id_categoria: catId, nombre: `Categoría ${catId}` });
    }
  }, [catId]);

  const loadCursos = React.useCallback(async () => {
    // 1) Intentar con querystring (servidor filtra por categoria y, si soporta, por modalidad/ciudad)
    try {
      const qs = new URLSearchParams();
      qs.set("categoria", String(catId));
      if (modFilter) qs.set("modalidad", modFilter);
      if (cityFilter) qs.set("ciudad", cityFilter);
      const byQuery = await apiFetch(`${CRUD}/cursos/?${qs.toString()}`);
      const list = Array.isArray(byQuery) ? byQuery : (byQuery?.results ?? []);
      // Filtro seguro en cliente por si el backend ignora algún parámetro
      const filtered = list
        .filter((c: any) => equalsCat(c?.categoria, catId))
        .filter((c: any) => !modFilter || String(c?.modalidad).toLowerCase() === modFilter.toLowerCase())
        .filter((c: any) => !cityFilter || String(c?.ciudad || "").toLowerCase().includes(cityFilter.toLowerCase()));
      if (filtered.length > 0 || list.length === 0) {
        setCursos(filtered);
        return;
      }
      // Si llega algo pero no coincide, hacemos fallback a traer todo y filtrar
    } catch {}

    // 2) Fallback: traer todos y filtrar client-side
    try {
      const all = await apiFetch(`${CRUD}/cursos/`);
      const listAll = Array.isArray(all) ? all : (all?.results ?? []);
      const filteredAll = listAll
        .filter((c: any) => equalsCat(c?.categoria, catId))
        .filter((c: any) => !modFilter || String(c?.modalidad).toLowerCase() === modFilter.toLowerCase())
        .filter((c: any) => !cityFilter || String(c?.ciudad || "").toLowerCase().includes(cityFilter.toLowerCase()));
      setCursos(filteredAll);
    } catch (e) {
      setCursos([]);
    }
  }, [catId, modFilter, cityFilter]);

  const loadTutores = React.useCallback(async (cursos: Curso[]) => {
    // Reunir IDs de tutores que no vengan anidados
    const ids = new Set<number>();
    for (const c of cursos) {
      const t = c?.tutor;
      if (t && typeof t !== "object") ids.add(Number(t));
    }
    if (ids.size === 0) return;
    const fetched: Record<number, Usuario> = {};
    await Promise.all(
      Array.from(ids).map(async (id) => {
        try {
          const u = await apiFetch(`${CRUD}/usuarios/${id}/`);
          fetched[id] = u;
        } catch {}
      })
    );
    if (Object.keys(fetched).length) setTutores((prev) => ({ ...prev, ...fetched }));
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setError(null);
      setLoading(true);
      try {
        await loadCategoria();
        await loadCursos();
      } catch (e: any) {
        if (!mounted) return;
        setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [loadCategoria, loadCursos]);

  React.useEffect(() => {
    loadTutores(cursos);
  }, [cursos, loadTutores]);

  const name = categoria?.nombre || `Categoría ${catId}`;

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 bg-[#f7fafa]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-[#0b615b]">{name}</h1>
          <button onClick={() => router.back()} className="text-sm text-[#0b615b] hover:underline">Volver</button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>
        )}

        {/* Filtros */}
        <div className="mb-4 flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#0b615b]">Modalidad</label>
            <select
              value={modFilter}
              onChange={(e) => setModFilter(e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm"
            >
              <option value="">Todas</option>
              <option value="presencial">Presencial</option>
              <option value="virtual">Virtual</option>
              <option value="ambas">Ambas</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#0b615b]">Ciudad</label>
            <input
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Ej: Bogotá"
              className="border rounded-lg px-2 py-1 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando cursos…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cursos.map((curso: any) => (
              <CursoCard
                key={curso.id_curso || curso.id}
                curso={curso}
                tutor={resolveTutor(curso?.tutor, tutores)}
                isRequestOpen={requestFor === (curso.id_curso || curso.id)}
                onOpenRequest={() => {
                  if (!user) {
                    const next = `${pathname}`;
                    router.push(`/?login=1&next=${encodeURIComponent(next)}`);
                    return;
                  }
                  if (user?.rol !== "estudiante") {
                    setRequestMsg("Debes iniciar sesión como estudiante para solicitar.");
                    return;
                  }
                  setRequestFor(curso.id_curso || curso.id);
                }}
                onCloseRequest={() => setRequestFor(null)}
                onSubmitted={(msg) => { setRequestMsg(msg); setRequestFor(null); }}
                user={user}
              />
            ))}
          </div>
        )}

        {!loading && cursos.length === 0 && !error && (
          <p className="text-gray-400 mt-6">No hay cursos en esta categoría.</p>
        )}
        {requestMsg && (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-2 text-sm">
            {requestMsg}
          </div>
        )}
      </div>
    </main>
  );
}

function equalsCat(catField: any, id: number) {
  if (catField == null) return false;
  if (typeof catField === "object") {
    const cid = catField.id_categoria ?? catField.id ?? null;
    return Number(cid) === Number(id);
  }
  return Number(catField) === Number(id);
}

function resolveTutor(tutorField: any, tutoresMap: Record<number, any>) {
  if (!tutorField) return null;
  if (typeof tutorField === "object") return tutorField;
  const id = Number(tutorField);
  return tutoresMap[id] || { id, username: `Tutor ${id}` };
}

function CursoCard({ curso, tutor, isRequestOpen, onOpenRequest, onCloseRequest, onSubmitted, user }: {
  curso: any;
  tutor: any;
  isRequestOpen: boolean;
  onOpenRequest: () => void;
  onCloseRequest: () => void;
  onSubmitted: (msg: string) => void;
  user: any;
}) {
  const precio = curso?.precio != null ? Number(curso.precio) : null;
  const modalidad = curso?.modalidad || "";
  const ciudad = curso?.ciudad || "";
  const nombre = curso?.nombre || `Curso ${curso?.id_curso || curso?.id}`;
  const desc = curso?.descripcion || "";
  const tutorNombre = tutor?.username || tutor?.email || `Tutor ${tutor?.id ?? ""}`;
  const rating = tutor?.calificacion_promedio;
  const canRequest = user?.rol === "estudiante";

  return (
    <div className="group bg-white border border-[#0b615b]/30 rounded-2xl shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between min-h-[240px]">
      <div>
        <h3 className="text-lg font-semibold text-[#0b615b] mb-1">{nombre}</h3>
        <p className="text-xs text-[#0b615b]/70 mb-2">{modalidad}{ciudad ? ` · ${ciudad}` : ""}</p>
        <p className="text-gray-600 text-sm line-clamp-3">{desc}</p>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-[#0b615b]">
          <p className="font-medium">{tutorNombre}</p>
          {rating != null && (
            <p className="text-xs text-[#0b615b]/70">Calificación: {Number(rating).toFixed(1)}</p>
          )}
        </div>
        <div className="text-right">
          {precio != null && (
            <p className="text-[#0b615b] font-semibold">${precio.toFixed(2)}</p>
          )}
          <div className="flex gap-2 justify-end mt-1">
            <Link href="#" className="text-xs text-[#0b615b] hover:underline">Ver detalle</Link>
            <button
              onClick={onOpenRequest}
              disabled={!canRequest}
              className="text-xs px-3 py-1 rounded-full border border-[#0b615b]/40 text-[#0b615b] hover:bg-[#e6f9ff] disabled:opacity-50"
              title={canRequest ? "Enviar solicitud" : "Inicia sesión como estudiante"}
            >
              Solicitar
            </button>
          </div>
        </div>
      </div>
      {isRequestOpen && (
        <SolicitudForm curso={curso} onClose={onCloseRequest} onSubmitted={onSubmitted} />)
      }
    </div>
  );
}

function SolicitudForm({ curso, onClose, onSubmitted }: { curso: any; onClose: () => void; onSubmitted: (msg: string) => void }) {
  const [fecha, setFecha] = React.useState<string>(todayStr());
  const courseMod = (curso?.modalidad || "").toLowerCase();
  const [modalidad, setModalidad] = React.useState<string>(courseMod === "ambas" ? "virtual" : courseMod);
  const [duracion, setDuracion] = React.useState<number | "">("");
  const [mensaje, setMensaje] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;

  const options = courseMod === "ambas" ? ["presencial", "virtual"] : [courseMod];

  const handleSubmit = async () => {
    setError(null);
    if (!fecha || !modalidad) { setError("Completa fecha y modalidad"); return; }
    setLoading(true);
    try {
      const payload: any = {
        curso: curso?.id_curso || curso?.id,
        fecha_propuesta: fecha,
        modalidad,
      };
      if (duracion) payload.duracion = Number(duracion);
      if (mensaje) payload.mensaje = mensaje;
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(SOLI, { method: "POST", headers, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const detail = data?.detail || data || "Error";
        throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
      }
      onSubmitted("Solicitud enviada. El tutor será notificado.");
    } catch (e: any) {
      setError(e.message || "No se pudo enviar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 border rounded-xl p-3 bg-[#f8ffff]">
      <p className="text-xs text-[#0b615b] mb-2">Enviar solicitud</p>
      {error && <div className="mb-2 text-xs border border-red-200 bg-red-50 text-red-700 rounded px-3 py-2">{error}</div>}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="flex flex-col">
          Fecha propuesta
          <input type="date" min={todayStr()} value={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-1 border rounded px-2 py-1" />
        </label>
        <label className="flex flex-col">
          Modalidad
          {options.length > 1 ? (
            <select value={modalidad} onChange={(e) => setModalidad(e.target.value)} className="mt-1 border rounded px-2 py-1">
              {options.map((op) => <option key={op} value={op}>{capitalize(op)}</option>)}
            </select>
          ) : (
            <input value={capitalize(options[0])} disabled className="mt-1 border rounded px-2 py-1 bg-gray-50" />
          )}
        </label>
        <label className="flex flex-col">
          Duración (min) opcional
          <input type="number" min={15} step={15} value={duracion} onChange={(e) => setDuracion(e.target.value ? Number(e.target.value) : "")} className="mt-1 border rounded px-2 py-1" />
        </label>
        <label className="flex flex-col col-span-2">
          Mensaje (opcional)
          <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={2} className="mt-1 border rounded px-2 py-1" />
        </label>
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button onClick={onClose} className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50">Cancelar</button>
        <button onClick={handleSubmit} disabled={loading} className="text-xs px-3 py-1.5 rounded-full border border-[#0b615b] text-white bg-[#0b615b] hover:bg-[#0a7f77] disabled:opacity-60">{loading ? "Enviando…" : "Enviar"}</button>
      </div>
    </div>
  );
}

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
