"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { fetchWithAuth, API_BASE } from "../lib/authFetch";
import Header from "../header/page";

const CRUD = `${API_BASE}/crud`;

export default function Mensajeria() {
  const router = useRouter();
  const { user } = useAuth();
  const viewerRole = user?.rol ?? null;
  const myId = user?.id || user?.pk || user?.user_id || null;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [solPend, setSolPend] = React.useState<any[]>([]);
  const [solAcep, setSolAcep] = React.useState<any[]>([]);
  const [convs, setConvs] = React.useState<any[]>([]);
  const [userProfiles, setUserProfiles] = React.useState<Record<number, any>>({});

  const authFetch = React.useCallback(
    (url: string, init?: RequestInit) => fetchWithAuth(url, init),
    []
  );

  const loadAll = React.useCallback(async () => {
    const me = toNumber(myId);
    if (me == null) {
      setSolAcep([]);
      setSolPend([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [s, c] = await Promise.all([
        authFetch(`${CRUD}/solicitudes-reserva/`),
        authFetch(`${CRUD}/conversaciones/`),
      ]);
      const listS = Array.isArray(s) ? s : (s?.results ?? []);
      const listC = Array.isArray(c) ? c : (c?.results ?? []);
      setConvs(listC);

      const mine = listS.filter((x: any) => {
        const tutorId = toNumber(x?.curso?.tutor?.id ?? x?.curso?.tutor ?? x?.tutor);
        const estId = toNumber(x?.estudiante?.id ?? x?.estudiante);
        if (viewerRole === "tutor") return tutorId != null && tutorId === me;
        if (viewerRole === "estudiante") return estId != null && estId === me;
        return (tutorId != null && tutorId === me) || (estId != null && estId === me);
      });

      const isAcceptedByConv = (sol: any) => {
        const cursoId = toNumber(sol?.curso?.id ?? sol?.curso?.id_curso ?? sol?.curso);
        const tutorId = toNumber(sol?.curso?.tutor?.id ?? sol?.curso?.tutor ?? sol?.tutor);
        const estId = toNumber(sol?.estudiante?.id ?? sol?.estudiante);
        return listC.some((cv: any) => {
          const ctutor = toNumber(cv?.tutor?.id ?? cv?.tutor);
          const cest = toNumber(cv?.estudiante?.id ?? cv?.estudiante);
          const ccurs = toNumber(cv?.curso?.id ?? cv?.curso?.id_curso ?? cv?.curso);
          const okIds =
            ctutor != null &&
            cest != null &&
            ccurs != null &&
            tutorId != null &&
            estId != null &&
            cursoId != null &&
            ctutor === tutorId &&
            cest === estId &&
            ccurs === cursoId;
          return okIds && (cv?.estado_solicitud || cv?.estado) === "aceptada";
        });
      };

      const aceptadas = mine.filter(
        (x: any) => (x?.estado || x?.estado_solicitud) === "aceptada" || isAcceptedByConv(x)
      );
      const pendientes = mine.filter(
        (x: any) =>
          (x?.estado || x?.estado_solicitud) === "pendiente" && !isAcceptedByConv(x)
      );

      setSolAcep(aceptadas);
      setSolPend(pendientes);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch, myId, viewerRole]);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  React.useEffect(() => {
    const ids = new Set<number>();
    const track = (entity: any) => {
      const id = extractUserId(entity);
      if (id != null && userProfiles[id] == null) ids.add(id);
    };
    [...solPend, ...solAcep].forEach((sol) => {
      track(sol?.estudiante);
      track(sol?.curso?.tutor ?? sol?.tutor);
    });
    if (!ids.size) return;
    let cancelled = false;
    const fetchMissing = async () => {
      await Promise.all(
        Array.from(ids).map(async (id) => {
          try {
            const data = await authFetch(`${CRUD}/usuarios/${id}/`);
            if (!cancelled) {
              setUserProfiles((prev) => (prev[id] ? prev : { ...prev, [id]: data }));
            }
          } catch {
            /* ignore errors */
          }
        })
      );
    };
    fetchMissing();
    return () => {
      cancelled = true;
    };
  }, [solPend, solAcep, userProfiles, authFetch]);

  const resolveName = React.useCallback(
    (entity: any) => {
      if (!entity) return "Usuario";
      if (typeof entity === "object") {
        return formatUserName(entity, extractUserId(entity));
      }
      const numeric = extractUserId(entity);
      if (numeric == null) return formatUserName(null, entity);
      return formatUserName(userProfiles[numeric], numeric);
    },
    [userProfiles]
  );

  const findConv = (sol: any) => {
    const cursoId = sol?.curso?.id ?? sol?.curso?.id_curso ?? sol?.curso;
    const tutorId = sol?.curso?.tutor?.id ?? sol?.curso?.tutor ?? sol?.tutor;
    const estId = sol?.estudiante?.id ?? sol?.estudiante;
    return convs.find((c: any) => {
      const ctutor = c?.tutor?.id ?? c?.tutor;
      const cest = c?.estudiante?.id ?? c?.estudiante;
      const ccurs = c?.curso?.id ?? c?.curso?.id_curso ?? c?.curso;
      return Number(ctutor) === Number(tutorId) && Number(cest) === Number(estId) && Number(ccurs) === Number(cursoId);
    });
  };

  const createConvFromSol = async (s: any, accepted: boolean) => {
    try {
      const cursoId = s?.curso?.id ?? s?.curso?.id_curso ?? s?.curso;
      const tutorId = s?.curso?.tutor?.id ?? s?.curso?.tutor ?? s?.tutor;
      const estId = s?.estudiante?.id ?? s?.estudiante ?? myId;
      const payload: any = {
        tutor: Number(tutorId),
        estudiante: Number(estId),
        estado_solicitud: accepted ? "aceptada" : "pendiente",
      };
      if (cursoId) payload.curso = Number(cursoId);
      const created = await authFetch(`${CRUD}/conversaciones/`, { method: "POST", body: JSON.stringify(payload) });
      return created;
    } catch (e: any) { setError(e.message); return null; }
  };

  const openChat = async (sol: any) => {
    const existing = findConv(sol);
    if (existing) {
      router.push(`/tutor/mensajes?conv=${existing.id}`);
      return;
    }
    const accepted = (sol?.estado || sol?.estado_solicitud) === "aceptada";
    const created = await createConvFromSol(sol, accepted);
    if (created?.id) router.push(`/tutor/mensajes?conv=${created.id}`);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f7fafa] pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-[#0b615b]">Mensajería</h1>
        </div>

        {error && <div className="mb-4 rounded border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-2">{error}</div>}

        {loading ? (
          <p className="text-gray-500">Cargando…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white rounded-2xl shadow-md p-4">
              <h2 className="text-[#0b615b] text-lg font-semibold mb-3">Solicitudes pendientes</h2>
              <div className="space-y-3">
                {solPend.length === 0 && <p className="text-sm text-gray-400">No tienes solicitudes pendientes</p>}
                {solPend.map((s) => (
                  <SolicitudItem
                    key={s.id || s.pk}
                    s={s}
                    viewerRole={viewerRole}
                    resolveName={resolveName}
                    onOpen={() => openChat(s)}
                  />
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-md p-4">
              <h2 className="text-[#0b615b] text-lg font-semibold mb-3">Solicitudes aceptadas</h2>
              <div className="space-y-3">
                {solAcep.length === 0 && <p className="text-sm text-gray-400">No tienes solicitudes aceptadas</p>}
                {solAcep.map((s) => (
                  <SolicitudItem
                    key={s.id || s.pk}
                    s={s}
                    viewerRole={viewerRole}
                    resolveName={resolveName}
                    onOpen={() => openChat(s)}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
        </div>
      </main>
    </>
  );
}

function SolicitudItem({
  s,
  onOpen,
  viewerRole,
  resolveName,
}: {
  s: any;
  onOpen: () => void;
  viewerRole: string | null;
  resolveName: (entity: any) => string;
}) {
  const curso = s?.curso;
  const nombreCurso = curso?.nombre || `Curso ${curso?.id || s?.curso}`;
  const tutorName = resolveName(curso?.tutor ?? s?.tutor);
  const estudianteName = resolveName(s?.estudiante);
  const fecha = s?.fecha_propuesta;
  const modalidad = s?.modalidad;
  const estado = (s?.estado || s?.estado_solicitud || "pendiente") as string;
  const canOpen = estado === "aceptada" || estado === "pendiente"; // permitimos crear conv incluso en pendiente
  const counterpart =
    viewerRole === "tutor"
      ? `Estudiante: ${estudianteName}`
      : `Tutor: ${tutorName}`;
  const badge = statusStyles(estado);

  return (
    <div className="border rounded-xl p-3 flex items-center justify-between gap-3">
      <div className="text-sm">
        <p className="text-[#0b615b] font-semibold">{nombreCurso}</p>
        <p className="text-[#0b615b]/70 text-xs">{counterpart}</p>
        <p className="text-gray-500 text-xs">
          {fecha ? `${fecha} · ` : ""}
          {modalidad ? `${capitalize(modalidad)} · ` : ""}
          {capitalize(estado)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2 text-xs">
        <span className={`px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>{badge.label}</span>
        <button
          onClick={onOpen}
          disabled={!canOpen}
          className="text-xs px-3 py-1.5 rounded-full border border-[#0b615b] text-white bg-[#0b615b] hover:bg-[#0a7f77] disabled:opacity-50"
        >
          Abrir chat
        </button>
      </div>
    </div>
  );
}

function capitalize(s?: string) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toNumber(value: any): number | null {
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function statusStyles(state?: string) {
  const map: Record<string, { bg: string; text: string; border: string; label: string }> = {
    aceptada: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      label: "Aceptada",
    },
    pendiente: {
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-200",
      label: "Pendiente",
    },
    rechazada: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      label: "Rechazada",
    },
  };
  return map[state || "pendiente"] || map.pendiente;
}

function formatUserName(profile: any, fallback?: string | number | null) {
  if (!profile) return fallback ? `Usuario ${fallback}` : "Usuario";
  const first = profile.first_name?.trim?.() ?? "";
  const last = profile.last_name?.trim?.() ?? "";
  const full = `${first} ${last}`.trim();
  return full || profile.username || profile.email || (fallback ? `Usuario ${fallback}` : "Usuario");
}

function extractUserId(entity: any): number | null {
  if (!entity) return null;
  if (typeof entity === "object") {
    const raw = entity.id ?? entity.pk ?? entity.user_id ?? entity.id_usuario ?? null;
    return raw == null ? null : toNumber(raw);
  }
  return toNumber(entity);
}
