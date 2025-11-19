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

  const name = categoria?.nombre || `Categoria ${catId}`;

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-[#f2fbfb] via-white to-[#f7fafa] py-20 px-4">
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[#dff7f6]/70 to-transparent blur-3xl pointer-events-none" />
      <div className="relative max-w-6xl mx-auto bg-white/85 backdrop-blur-sm border border-white rounded-3xl shadow-xl px-6 md:px-10 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#0b615b]/60">Categoria</p>
            <h1 className="text-3xl md:text-4xl font-semibold text-[#0b615b]">{name}</h1>
          </div>
          <button
            onClick={() => router.back()}
            className="self-start md:self-auto text-sm px-4 py-2 rounded-full border border-[#0b615b]/30 text-[#0b615b] hover:bg-[#0b615b]/10 transition"
          >
            Volver
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-3 bg-[#e9f8f7] border border-[#0b615b]/10 rounded-2xl p-5 shadow-inner">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#0b615b]/80 uppercase tracking-wide">Modalidad</label>
            <select
              value={modFilter}
              onChange={(e) => setModFilter(e.target.value)}
              className="rounded-2xl border border-transparent bg-white px-4 py-2 text-sm text-[#0b615b] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0b615b]/40"
            >
              <option value="">Todas</option>
              <option value="presencial">Presencial</option>
              <option value="virtual">Virtual</option>
              <option value="ambas">Ambas</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#0b615b]/80 uppercase tracking-wide">Ciudad</label>
            <input
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Ej: Bogota"
              className="rounded-2xl border border-transparent bg-white px-4 py-2 text-sm text-[#0b615b] placeholder-[#6ca9a5] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0b615b]/40"
            />
          </div>
          <div className="flex flex-col justify-end">
            <p className="text-xs text-[#0b615b]/70 mb-1">Cursos encontrados</p>
            <p className="text-2xl font-semibold text-[#0b615b]">{cursos.length}</p>
          </div>
        </div>

        {loading ? (
          <p className="text-[#0b615b]/70">Cargando cursos...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <p className="text-gray-400 mt-6 text-center">No hay cursos en esta categoria.</p>
        )}
        {requestMsg && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-5 py-3 text-sm shadow-sm">
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
  const canRequest = Boolean(user);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#0b615b]/15 bg-gradient-to-br from-white via-[#f9fffe] to-[#e4f6f4] p-6 shadow-lg transition-transform duration-200 hover:-translate-y-1">
      <div className="absolute inset-x-0 -top-8 h-24 bg-gradient-to-br from-[#0b615b]/15 to-transparent blur-2xl pointer-events-none" />
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#0b615b]/50">Curso</p>
          <h3 className="text-xl font-semibold text-[#0b615b]">{nombre}</h3>
        </div>
        {precio != null && (
          <div className="text-right">
            <p className="text-xs text-[#0b615b]/60">Precio</p>
            <p className="text-lg font-semibold text-[#0b615b]">${precio.toFixed(2)}</p>
          </div>
        )}
      </div>
      <div className="relative z-10 flex flex-wrap gap-2 text-xs text-[#0b615b]">
        {modalidad && (
          <span className="px-3 py-1 rounded-full bg-white border border-[#0b615b]/20 shadow-sm capitalize">
            {modalidad}
          </span>
        )}
        {ciudad && (
          <span className="px-3 py-1 rounded-full bg-white border border-[#0b615b]/20 shadow-sm">
            {ciudad}
          </span>
        )}
      </div>
      <p className="relative z-10 mt-3 text-sm text-gray-600 line-clamp-3">{desc || "Sin descripcion"}</p>
      <div className="relative z-10 mt-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#0b615b]">{tutorNombre}</p>
          {rating != null && (
            <p className="text-xs text-[#0b615b]/60">Calificacion: {Number(rating).toFixed(1)}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 text-xs">
          <Link href="#" className="text-[#0b615b] hover:underline">
            Ver detalle
          </Link>
          <button
            onClick={onOpenRequest}
            disabled={!canRequest}
            className="px-4 py-1.5 rounded-full bg-[#0b615b] text-white shadow disabled:opacity-50"
            title={canRequest ? "Enviar solicitud" : "Inicia sesión para solicitar"}
          >
            Solicitar
          </button>
        </div>
      </div>
      {isRequestOpen && (
        <div className="relative z-10 mt-4">
          <SolicitudForm curso={curso} onClose={onCloseRequest} onSubmitted={onSubmitted} />
        </div>
      )}
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
  const [hasExistingRequest, setHasExistingRequest] = React.useState(false);
  const [existingStatus, setExistingStatus] = React.useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;

  const options = courseMod === "ambas" ? ["presencial", "virtual"] : [courseMod];

  React.useEffect(() => {
    if (!token) return;
    const courseId = curso?.id_curso || curso?.id;
    if (!courseId) return;
    (async () => {
      try {
        const headers: any = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(SOLI, { headers });
        const data = await res.json().catch(() => null);
        const list = Array.isArray(data) ? data : data?.results ?? [];
        const normalizedCourseId = Number(courseId);
        const related = list.find((s: any) => {
          const id = Number(s?.curso?.id ?? s?.curso?.id_curso ?? s?.curso);
          const state = String(s?.estado || s?.estado_solicitud || "").toLowerCase();
          return (
            id === normalizedCourseId &&
            !["rechazada", "cancelada", "finalizada"].includes(state)
          );
        });
        if (related) {
          setHasExistingRequest(true);
          setExistingStatus(related?.estado || related?.estado_solicitud || "pendiente");
        } else {
          setHasExistingRequest(false);
          setExistingStatus(null);
        }
      } catch {
        setHasExistingRequest(false);
        setExistingStatus(null);
      }
    })();
  }, [token, curso]);

  const handleSubmit = async () => {
    setError(null);
    if (hasExistingRequest) {
      setError("Ya tienes una solicitud activa para este curso.");
      return;
    }
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
        <button
          onClick={handleSubmit}
          disabled={loading || hasExistingRequest}
          className="text-xs px-3 py-1.5 rounded-full border border-[#0b615b] text-white bg-[#0b615b] hover:bg-[#0a7f77] disabled:opacity-60"
        >
          {hasExistingRequest ? "Solicitud enviada" : loading ? "Enviando…" : "Enviar"}
        </button>
      </div>
      {hasExistingRequest && (
        <p className="mt-2 text-xs text-[#0b615b]">
          Ya existe una solicitud {existingStatus?.toLowerCase() || "activa"} para este curso.
        </p>
      )}
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
