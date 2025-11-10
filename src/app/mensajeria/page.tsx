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
  const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;
  const myId = user?.id || user?.pk || user?.user_id || null;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [solPend, setSolPend] = React.useState<any[]>([]);
  const [solAcep, setSolAcep] = React.useState<any[]>([]);
  const [convs, setConvs] = React.useState<any[]>([]);

  const authFetch = (url: string, init?: RequestInit) => fetchWithAuth(url, init);

  const loadAll = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [s, c] = await Promise.all([
        authFetch(`${CRUD}/solicitudes-reserva/`),
        authFetch(`${CRUD}/conversaciones/`),
      ]);
      const listS = Array.isArray(s) ? s : (s?.results ?? []);
      const listC = Array.isArray(c) ? c : (c?.results ?? []);
      setConvs(listC);

      const mine = listS.filter((x: any) => {
        const estId = x?.estudiante?.id ?? x?.estudiante;
        return user?.rol === "estudiante" && Number(estId) === Number(myId);
      });

      const isAcceptedByConv = (sol: any) => {
        const cursoId = sol?.curso?.id ?? sol?.curso?.id_curso ?? sol?.curso;
        const tutorId = sol?.curso?.tutor?.id ?? sol?.curso?.tutor ?? sol?.tutor;
        const estId = sol?.estudiante?.id ?? sol?.estudiante;
        return listC.some((cv: any) => {
          const ctutor = cv?.tutor?.id ?? cv?.tutor;
          const cest = cv?.estudiante?.id ?? cv?.estudiante;
          const ccurs = cv?.curso?.id ?? cv?.curso?.id_curso ?? cv?.curso;
          const okIds = Number(ctutor) === Number(tutorId) && Number(cest) === Number(estId) && Number(ccurs) === Number(cursoId);
          return okIds && (cv?.estado_solicitud || cv?.estado) === "aceptada";
        });
      };

      const aceptadas = mine.filter((x: any) => (x?.estado || x?.estado_solicitud) === "aceptada" || isAcceptedByConv(x));
      const pendientes = mine.filter((x: any) => (x?.estado || x?.estado_solicitud) === "pendiente" && !isAcceptedByConv(x));

      setSolAcep(aceptadas);
      setSolPend(pendientes);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }, [user, myId, token]);

  React.useEffect(() => { loadAll(); }, [loadAll]);

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
                  <SolicitudItem key={s.id} s={s} onOpen={() => openChat(s)} />
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-md p-4">
              <h2 className="text-[#0b615b] text-lg font-semibold mb-3">Solicitudes aceptadas</h2>
              <div className="space-y-3">
                {solAcep.length === 0 && <p className="text-sm text-gray-400">No tienes solicitudes aceptadas</p>}
                {solAcep.map((s) => (
                  <SolicitudItem key={s.id} s={s} onOpen={() => openChat(s)} />
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

function SolicitudItem({ s, onOpen }: { s: any; onOpen: () => void }) {
  const curso = s?.curso;
  const nombreCurso = curso?.nombre || `Curso ${curso?.id || s?.curso}`;
  const tutor = curso?.tutor;
  const tutorName = tutor?.username || tutor?.email || `Tutor ${tutor?.id || s?.tutor}`;
  const fecha = s?.fecha_propuesta;
  const modalidad = s?.modalidad;
  const estado = s?.estado || s?.estado_solicitud || "pendiente";
  const canOpen = estado === "aceptada" || estado === "pendiente"; // permitimos crear conv incluso en pendiente

  return (
    <div className="border rounded-xl p-3 flex items-center justify-between">
      <div className="text-sm">
        <p className="text-[#0b615b] font-semibold">{nombreCurso}</p>
        <p className="text-[#0b615b]/70 text-xs">{tutorName}</p>
        <p className="text-gray-500 text-xs">{fecha} · {capitalize(modalidad)} · {capitalize(estado)}</p>
      </div>
      <button onClick={onOpen} disabled={!canOpen} className="text-xs px-3 py-1.5 rounded-full border border-[#0b615b] text-white bg-[#0b615b] hover:bg-[#0a7f77] disabled:opacity-50">
        Abrir chat
      </button>
    </div>
  );
}

function capitalize(s?: string) { if (!s) return ""; return s.charAt(0).toUpperCase() + s.slice(1); }
