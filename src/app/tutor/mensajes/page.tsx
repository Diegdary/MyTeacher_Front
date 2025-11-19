"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { FaArrowRight } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { fetchWithAuth, API_BASE } from "../../lib/authFetch";
import { FaStar } from "react-icons/fa";

const CONV_ENDPOINT = `${API_BASE}/crud/conversaciones/`;
const MSG_ENDPOINT = `${API_BASE}/crud/mensajes/`;
const SOLI_ENDPOINT = `${API_BASE}/crud/solicitudes-reserva/`;
const CRUD = `${API_BASE}/crud`;

type Conv = any;
type Msg = any;

export default function Mensajes() {
  const { user } = useAuth();
  const search = useSearchParams();
  const [convs, setConvs] = React.useState<Conv[]>([]);
  const [selectedConvId, setSelectedConvId] = React.useState<number | null>(null);
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showStartPanel, setShowStartPanel] = React.useState(false);
  const [solPendientes, setSolPendientes] = React.useState<any[]>([]);
  const [solAceptadas, setSolAceptadas] = React.useState<any[]>([]);
  const [soliLoading, setSoliLoading] = React.useState(false);
  // Reseña UI
  const [showReview, setShowReview] = React.useState(false);
  const [reviewReserva, setReviewReserva] = React.useState<string>("");
  const [reviewRating, setReviewRating] = React.useState<number>(0);
  const [reviewComment, setReviewComment] = React.useState<string>("");
  const [reviewMsg, setReviewMsg] = React.useState<string | null>(null);
  const [userProfiles, setUserProfiles] = React.useState<Record<number, any>>({});

  const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;
  const myId = user?.id || user?.pk || user?.user_id || null;

  const authFetch = (url: string, init?: RequestInit) => fetchWithAuth(url, init);

  async function convAction(id: number, action: string) {
    const url = `${CONV_ENDPOINT}${id}/${action}/`;
    return fetchWithAuth(url, { method: "POST" });
  }

  const loadConvs = React.useCallback(async () => {
    setError(null);
    try {
      const data = await authFetch(CONV_ENDPOINT);
      const list = Array.isArray(data) ? data : (data?.results ?? []);
      setConvs(list);
      if (!selectedConvId && list.length > 0) setSelectedConvId(list[0].id);
    } catch (e: any) {
      setError(e.message);
    }
  }, [selectedConvId, token]);

  const loadMsgs = React.useCallback(async (convId: number) => {
    setError(null);
    try {
      const data = await authFetch(`${MSG_ENDPOINT}?conversacion=${convId}`);
      const list = Array.isArray(data) ? data : (data?.results ?? []);
      setMsgs(list);
    } catch (e: any) {
      setError(e.message);
    }
  }, [token]);

  const loadSolicitudes = React.useCallback(async () => {
    setError(null); setSoliLoading(true);
    try {
      const data = await authFetch(SOLI_ENDPOINT);
      const list = Array.isArray(data) ? data : (data?.results ?? []);
      const role = user?.rol;
      const me = myId;
      const mine = list.filter((s: any) => {
        const tutorId = s?.tutor;
        const estId = s?.estudiante?.id ?? s?.estudiante;
        if (role === "tutor") return Number(tutorId) === Number(me);
        if (role === "estudiante") return Number(estId) === Number(me);
        return false;
      });
      setSolAceptadas(mine.filter((s: any) => (s?.estado || s?.estado_solicitud) === "aceptada"));
      setSolPendientes(mine.filter((s: any) => (s?.estado || s?.estado_solicitud) === "pendiente"));
    } catch (e: any) {
      setError(e.message);
    } finally { setSoliLoading(false); }
  }, [token, user, myId]);

  React.useEffect(() => { loadConvs(); }, [loadConvs]);
  React.useEffect(() => {
    const missingIds = new Set<number>();
    convs.forEach((conv) => {
      [conv?.estudiante, conv?.tutor].forEach((participant) => {
        if (participant && typeof participant !== "object") {
          const id = Number(participant);
          if (!Number.isNaN(id) && !(id in userProfiles)) missingIds.add(id);
        }
      });
    });
    if (!missingIds.size) return;
    const fetchProfiles = async () => {
      await Promise.all(
        Array.from(missingIds).map(async (id) => {
          try {
            const data = await authFetch(`${CRUD}/usuarios/${id}/`);
            setUserProfiles((prev) => ({ ...prev, [id]: data }));
          } catch {
            /* ignore */
          }
        })
      );
    };
    fetchProfiles();
  }, [convs, authFetch, userProfiles]);
  React.useEffect(() => { if (selectedConvId) loadMsgs(selectedConvId); }, [selectedConvId, loadMsgs]);
  // Preseleccionar conversación por ?conv=ID
  React.useEffect(() => {
    const cid = search?.get("conv");
    if (cid) {
      const idNum = Number(cid);
      if (!Number.isNaN(idNum)) setSelectedConvId(idNum);
    }
  }, [search]);
  // Marcar como leídos cuando se abre una conversación
  React.useEffect(() => {
    if (!selectedConvId) return;
    convAction(selectedConvId, "marcar_leidos")
      .then((upd) => setConvs((prev) => prev.map((c) => (c.id === upd?.id ? upd : c))))
      .catch(() => {});
  }, [selectedConvId]);
  React.useEffect(() => { if (showStartPanel) loadSolicitudes(); }, [showStartPanel, loadSolicitudes]);

  async function createConversationFromSolicitud(s: any) {
    setError(null);
    try {
      const cursoId = s?.curso?.id ?? s?.curso?.id_curso ?? s?.curso ?? null;
      let estId = s?.estudiante?.id ?? s?.estudiante ?? null;
      let tutorId = s?.curso?.tutor?.id ?? s?.curso?.tutor ?? s?.tutor?.id ?? s?.tutor ?? null;

      const exists = convs.find((c: any) => {
        const ctutor = c?.tutor?.id ?? c?.tutor;
        const cest = c?.estudiante?.id ?? c?.estudiante;
        const ccurs = c?.curso?.id ?? c?.curso?.id_curso ?? c?.curso;
        return (tutorId && ctutor === tutorId) && (estId && cest === estId) && (!cursoId || ccurs === cursoId);
      });
      if (exists) { setSelectedConvId(exists.id); return; }

      const role = user?.rol;
      const estadoSolicitud = (s?.estado || s?.estado_solicitud) === "aceptada" ? "aceptada" : "pendiente";
      // Asegurar ambos campos requeridos por el serializer
      if (role === "tutor") {
        // El tutor autenticado debe estar presente explícitamente para pasar la validación
        tutorId = tutorId ?? myId;
        if (!estId) throw new Error("No se encontró el estudiante de la solicitud");
      } else if (role === "estudiante") {
        estId = estId ?? myId;
        if (!tutorId) throw new Error("No se encontró el tutor de la solicitud");
      }
      if (!tutorId || !estId) throw new Error("Faltan datos para crear la conversación (tutor/estudiante)");
      const payload: any = {
        estado_solicitud: estadoSolicitud,
        tutor: Number(tutorId),
        estudiante: Number(estId),
      };
      if (cursoId) payload.curso = Number(cursoId);

      const created = await authFetch(CONV_ENDPOINT, { method: "POST", body: JSON.stringify(payload) });
      if ((created?.estado_solicitud || created?.estado) !== "aceptada" && estadoSolicitud === "aceptada") {
        try {
          const cid = created.id;
          const upd = await authFetch(`${CONV_ENDPOINT}${cid}/`, { method: "PATCH", body: JSON.stringify({ estado_solicitud: "aceptada" }) });
          setConvs((prev) => [upd, ...prev]); setSelectedConvId(upd.id);
        } catch { setConvs((prev) => [created, ...prev]); setSelectedConvId(created.id); }
      } else {
        setConvs((prev) => [created, ...prev]); setSelectedConvId(created.id);
      }
      setShowStartPanel(false);
    } catch (e: any) { setError(e.message); }
  }

  const formatUserName = (profile: any, fallbackId?: number | string) => {
    if (!profile) return fallbackId ? `Usuario ${fallbackId}` : "Usuario";
    const first = profile.first_name?.trim() ?? "";
    const last = profile.last_name?.trim() ?? "";
    const fullName = `${first} ${last}`.trim();
    return fullName || profile.username || profile.email || (fallbackId ? `Usuario ${fallbackId}` : "Usuario");
  };
  const convStatus = (c: any) => c?.estado_solicitud || c?.estado || "pendiente";
  const isAccepted = (c: any) => convStatus(c) === "aceptada";

  function otherPartyName(c: any): string {
    const role = user?.rol;
    const other = role === "tutor" ? c?.estudiante : c?.tutor;
    if (!other) return `Conv #${c?.id}`;
    if (typeof other === "object") return formatUserName(other, other?.id);
    const id = Number(other);
    const cached = userProfiles[id];
    return formatUserName(cached, other);
  }

  function isMine(m: any): boolean {
    const rid = m?.remitente?.id ?? m?.remitente;
    return myId != null && rid === myId;
  }

  const handleSend = async () => {
    if (!text.trim() || !selectedConvId) return;
    setLoading(true); setError(null);
    try {
      const created = await authFetch(MSG_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({ conversacion: selectedConvId, contenido: text.trim() }),
      });
      setMsgs((prev) => [...prev, created]);
      setText("");
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const defaultAvatarUrl = "https://i.pravatar.cc/80";
  const filteredConvs = React.useMemo(
    () => convs.filter((c) => convStatus(c) !== "archivada"),
    [convs]
  );
  const selectedConv = filteredConvs.find((c) => c.id === selectedConvId) || filteredConvs[0] || null;

  const senderDisplayName = (msg: Msg): string => {
    const remitente = msg?.remitente;
    if (remitente && typeof remitente === "object") {
      return formatUserName(remitente, remitente.id);
    }
    if (isMine(msg)) {
      return formatUserName(user, myId ?? "yo");
    }
    if (selectedConv) {
      return otherPartyName(selectedConv);
    }
    if (remitente != null) {
      const cached = userProfiles[Number(remitente)];
      return formatUserName(cached, remitente);
    }
    return "Usuario";
  };
  const statusChip = (s?: string) => {
    const st = s || "pendiente";
    const map: any = {
      aceptada: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Aceptada" },
      pendiente: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", label: "Pendiente" },
      rechazada: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", label: "Rechazada" },
      archivada: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", label: "Archivada" },
    };
    const sty = map[st] || map.pendiente;
    return <span className={`ml-auto px-2 py-0.5 text-[10px] rounded-full border ${sty.bg} ${sty.text} ${sty.border}`}>{sty.label}</span>;
  };

  const unreadCount = (c: any) => {
    if (!c) return 0;
    const u = user?.rol === "tutor" ? c?.unread_tutor : c?.unread_estudiante;
    return Number(u || 0);
  };
  const resolveDisplayName = (entity: any) => {
    if (!entity) return "Usuario";
    if (typeof entity === "object") return formatUserName(entity, getId(entity));
    const numeric = Number(entity);
    if (Number.isNaN(numeric)) return formatUserName(null, entity);
    const cached = userProfiles[numeric];
    return formatUserName(cached, entity);
  };
  const solicitudDisplay = (s: any) => {
    const curso = s?.curso;
    const nombreCurso =
      typeof curso === "object"
        ? curso?.nombre || `Curso ${getId(curso)}`
        : curso != null
        ? `Curso ${curso}`
        : "Curso";
    const estudianteName = resolveDisplayName(s?.estudiante);
    const tutorName = resolveDisplayName(s?.curso?.tutor ?? s?.tutor);
    return `${estudianteName} · ${tutorName} · ${nombreCurso}`;
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl mt-8">
      {/* Lista de conversaciones */}
      <div className="bg-white rounded-2xl shadow-md p-4 w-full md:w-1/3">
        <h3 className="text-[#0b615b] text-lg font-semibold mb-4 text-center">Conversaciones</h3>
        {error && (
          <div className="mb-2 rounded border border-red-200 bg-red-50 text-red-700 text-xs px-3 py-2">{error}</div>
        )}
        {!token && (
          <div className="mb-2 rounded border border-amber-200 bg-amber-50 text-amber-800 text-xs px-3 py-2">Inicia sesión para ver tus conversaciones.</div>
        )}
        <div className="mb-3 flex justify-center">
          <button
            onClick={() => setShowStartPanel(v => !v)}
            className="text-xs px-3 py-1.5 rounded-full border border-[#0b615b]/40 text-[#0b615b] hover:bg-[#e6f9ff]"
          >
            {showStartPanel ? "Ocultar" : "Iniciar conversación"}
          </button>
        </div>
        {showStartPanel && (
          <div className="mb-3 border rounded-xl p-3 bg-[#f8ffff] space-y-3">
            <div>
              <p className="text-xs text-[#0b615b] mb-2">Solicitudes pendientes</p>
              {soliLoading && <p className="text-xs text-gray-500">Cargando…</p>}
              {!soliLoading && solPendientes.length === 0 && (
                <p className="text-xs text-gray-400">No hay solicitudes pendientes</p>
              )}
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                {solPendientes.map((s: any) => (
                  <div key={s.id || s.pk} className="flex items-center gap-2 text-xs border rounded-lg p-2 bg-white">
                    <span className="font-medium text-[#0b615b]">{solicitudDisplay(s)}</span>
                    <button
                      onClick={() => createConversationFromSolicitud(s)}
                      className="ml-auto px-2 py-1 rounded border border-[#0b615b]/40 text-[#0b615b] hover:bg-[#e6f9ff]"
                    >Crear conversación</button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-[#0b615b] mb-2">Solicitudes aceptadas</p>
              {soliLoading && <p className="text-xs text-gray-500">Cargando…</p>}
              {!soliLoading && solAceptadas.length === 0 && (
                <p className="text-xs text-gray-400">No hay solicitudes aceptadas</p>
              )}
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                {solAceptadas.map((s: any) => (
                  <div key={s.id || s.pk} className="flex items-center gap-2 text-xs border rounded-lg p-2 bg-white">
                    <span className="font-medium text-[#0b615b]">{solicitudDisplay(s)}</span>
                    <button
                      onClick={() => createConversationFromSolicitud(s)}
                      className="ml-auto px-2 py-1 rounded border border-[#0b615b]/40 text-[#0b615b] hover:bg-[#e6f9ff]"
                    >Crear conversación</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {convs.length === 0 && <p className="text-sm text-gray-400">Sin conversaciones</p>}
          {filteredConvs.length === 0 && (
            <p className="text-sm text-gray-400 px-2">No tienes conversaciones activas</p>
          )}
          {filteredConvs.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedConvId(c.id)}
              className={`flex items-center gap-3 border rounded-xl px-3 py-2 text-sm transition ${
                selectedConvId === c.id ? "border-[#0b615b] bg-[#e6f9ff]" : "border-gray-200 hover:border-[#0b615b]/50"
              }`}
            >
              <Image src={defaultAvatarUrl} alt={otherPartyName(c)} width={40} height={40} className="rounded-full object-cover" />
              <span className="text-[#0b615b] font-medium flex-1 text-left">{otherPartyName(c)}</span>
              {unreadCount(c) > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#0b615b] text-white mr-2">{unreadCount(c)}</span>
              )}
              {statusChip(convStatus(c))}
            </button>
          ))}
        </div>
      </div>

      {/* Panel de chat */}
      <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between w-full md:w-2/3 min-h-[420px]">
        <div>
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[#0b615b] font-semibold text-lg flex items-center gap-2">
              <span>{selectedConv ? otherPartyName(selectedConv) : "Selecciona una conversación"}</span>
              {selectedConv && statusChip(convStatus(selectedConv))}
            </h4>
            {selectedConv && user?.rol === "estudiante" && (
              <button
                onClick={() => setShowReview(v => !v)}
                className="text-xs px-3 py-1.5 rounded-full border border-[#0b615b]/40 text-[#0b615b] hover:bg-[#e6f9ff]"
              >
                {showReview ? "Ocultar calificación" : "Calificar tutor"}
              </button>
            )}
          </div>

          {selectedConv && user?.rol === "tutor" && (
            <div className="mb-3 flex gap-2 justify-end">
              {convStatus(selectedConv) === "pendiente" && (
                <>
                  <button
                    onClick={async () => {
                      try {
                        const upd = await convAction(selectedConv.id, "aceptar");
                        setConvs((prev) => prev.map((c) => (c.id === upd.id ? upd : c)));
                      } catch (e: any) { setError(e.message); }
                    }}
                    className="text-xs px-2 py-1 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  >Aceptar</button>
                  <button
                    onClick={async () => {
                      try {
                        const upd = await convAction(selectedConv.id, "rechazar");
                        setConvs((prev) => prev.map((c) => (c.id === upd.id ? upd : c)));
                      } catch (e: any) { setError(e.message); }
                    }}
                    className="text-xs px-2 py-1 rounded border border-rose-300 text-rose-700 hover:bg-rose-50"
                  >Rechazar</button>
                </>
              )}
              <button
                onClick={async () => {
                  try {
                    const upd = await convAction(selectedConv.id, "archivar");
                    setConvs((prev) => prev.map((c) => (c.id === upd.id ? upd : c)));
                  } catch (e: any) { setError(e.message); }
                }}
                className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
              >Archivar</button>
            </div>
          )}
          {/* Panel de reseña */}
          {showReview && user?.rol === "estudiante" && selectedConv && (
            <div className="mb-4 border rounded-xl p-3 bg-[#f8ffff]">
              <p className="text-xs text-[#0b615b] mb-2">Calificar tutor</p>
              {reviewMsg && (
                <div className="mb-2 text-xs rounded border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-2">{reviewMsg}</div>
              )}
              <div className="grid md:grid-cols-3 gap-3 items-center text-sm">
                <label className="flex flex-col">
                  ID Reserva
                  <input
                    type="number"
                    value={reviewReserva}
                    onChange={(e) => setReviewReserva(e.target.value)}
                    placeholder="Ej: 123"
                    className="mt-1 border rounded px-2 py-1"
                  />
                </label>
                <div className="flex flex-col">
                  Puntuación
                  <div className="mt-1 flex items-center gap-1">
                    {[1,2,3,4,5].map((n) => (
                      <FaStar
                        key={n}
                        onClick={() => setReviewRating(n)}
                        className={`cursor-pointer ${reviewRating >= n ? 'text-[#0b615b]' : 'text-gray-300'}`}
                      />
                    ))}
                    <span className="ml-2 text-xs text-gray-500">{reviewRating}/5</span>
                  </div>
                </div>
                <label className="md:col-span-1 flex flex-col">
                  Comentario
                  <input
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="(opcional)"
                    className="mt-1 border rounded px-2 py-1"
                  />
                </label>
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button onClick={() => setShowReview(false)} className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button
                  onClick={async () => {
                    setReviewMsg(null);
                    try {
                      if (!reviewReserva || reviewRating <= 0) throw new Error('Completa reserva y puntuación');
                      const body = { reserva: Number(reviewReserva), puntuacion: reviewRating, comentario: reviewComment };
                      await fetchWithAuth(`${API_BASE}/resenas/crear/`, { method: 'POST', body: JSON.stringify(body) });
                      setReviewMsg('¡Reseña enviada! Gracias por calificar.');
                      setReviewComment(''); setReviewRating(0); setReviewReserva('');
                    } catch (e: any) {
                      setReviewMsg(e.message || 'No se pudo enviar la reseña');
                    }
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-[#0b615b] text-white bg-[#0b615b] hover:bg-[#0a7f77]"
                >
                  Enviar reseña
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            {selectedConv && msgs.map((m: any) => (
              <div key={m.id ?? `${m.creado_en}-${Math.random()}`} className={`flex ${isMine(m) ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${isMine(m) ? "bg-[#c7f4ff] text-[#0b615b]" : "bg-gray-100 text-gray-700"}`}>
                  <p className="font-medium mb-0.5">{senderDisplayName(m)}</p>
                  <p>{m.contenido ?? m.texto ?? ""}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{formatDate(m.creado_en || m.created_at)}</p>
                </div>
              </div>
            ))}
            {selectedConv && msgs.length === 0 && (
              <p className="text-gray-400 text-sm">No hay mensajes aún</p>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="mt-6 flex items-center gap-2">
          <input
            type="text"
            placeholder={
              !selectedConv ? "Selecciona una conversación" : isAccepted(selectedConv) ? "Escribe aquí" : "La solicitud no está aceptada aún"
            }
            disabled={!selectedConv || loading || !isAccepted(selectedConv)}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            className="flex-1 bg-[#e6f9ff] text-sm rounded-full px-4 py-2 focus:outline-none disabled:opacity-60"
          />
          <button onClick={handleSend} disabled={!selectedConv || loading || !text.trim() || !isAccepted(selectedConv)} className="bg-[#0b615b] text-white p-3 rounded-full hover:bg-[#094c46] transition disabled:opacity-60">
            <FaArrowRight size={12} />
          </button>
        </div>
        {!selectedConv ? null : !isAccepted(selectedConv) ? (
          <p className="mt-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Aún no puedes enviar mensajes. La solicitud debe ser aceptada por el tutor.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function formatDate(v?: string) {
  if (!v) return "";
  try { const d = new Date(v); return isNaN(d.getTime()) ? v : d.toLocaleString(); } catch { return v; }
}

function getId(x: any) {
  return x?.id ?? x?.pk ?? x?.user_id ?? x?.id_curso ?? x;
}
