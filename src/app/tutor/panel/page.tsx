"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import Header from "../../header/page";
import Mensajes from "../mensajes/page";
import Resenas from "../resenas/page";
import HorarioManager from "./HorarioManager";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/auth";
const CRUD = `${API_BASE}/crud`;

type Course = any;
type RequestItem = any;

function getTutorId(course: Course): number | null {
  const tutorField = course?.tutor;
  if (tutorField == null) return null;
  if (typeof tutorField === "object") {
    const raw = tutorField.id ?? tutorField.pk ?? tutorField.id_usuario ?? tutorField.user;
    return raw == null ? null : Number(raw);
  }
  return Number(tutorField);
}

function getCategoryId(course: Course): number | null {
  const category = course?.categoria;
  if (!category) return null;
  if (typeof category === "object") return Number(category.id_categoria ?? category.id ?? category);
  return Number(category);
}

function currency(value: number | string | null | undefined) {
  if (value == null) return "Sin precio";
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return amount.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function formatDate(value?: string) {
  if (!value) return "Sin registros";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function TutorPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("panel");
  const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;

  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const authFetch = useCallback(
    async (url: string, init: RequestInit = {}) => {
      const headers: any = { "Content-Type": "application/json", ...(init.headers || {}) };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(url, { ...init, headers });
      const type = response.headers.get("content-type") || "";
      const payload = type.includes("application/json") ? await response.json().catch(() => null) : await response.text().catch(() => null);
      if (!response.ok) {
        const detail = typeof payload === "string" ? payload : payload?.detail || payload?.message || "Error";
        throw new Error(detail);
      }
      return payload;
    },
    [token]
  );

  useEffect(() => {
    if (!token || !user?.id) {
      setCourses([]);
      setCoursesLoading(false);
      return;
    }
    let cancelled = false;
    const loadCourses = async () => {
      setCoursesLoading(true);
      setCoursesError(null);
      try {
        const data = await authFetch(`${CRUD}/cursos/`);
        const list = Array.isArray(data) ? data : data?.results ?? [];
        const mine = list.filter((course: Course) => getTutorId(course) === Number(user.id));
        if (!cancelled) setCourses(mine);
      } catch (error: any) {
        if (!cancelled) setCoursesError(error?.message || "No se pudieron cargar tus cursos");
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    };
    loadCourses();
    return () => {
      cancelled = true;
    };
  }, [authFetch, token, user?.id]);

  useEffect(() => {
    if (!token) {
      setRequests([]);
      setRequestsLoading(false);
      return;
    }
    let cancelled = false;
    const loadRequests = async () => {
      setRequestsLoading(true);
      try {
        const data = await authFetch(`${CRUD}/solicitudes-reserva/`);
        const list = Array.isArray(data) ? data : data?.results ?? [];
        if (!cancelled) setRequests(list);
      } catch (error) {
        if (!cancelled) console.warn("No se pudieron cargar las solicitudes", error);
      } finally {
        if (!cancelled) setRequestsLoading(false);
      }
    };
    loadRequests();
    return () => {
      cancelled = true;
    };
  }, [authFetch, token]);

  const pendingRequests = useMemo(
    () => requests.filter((item) => String(item?.estado).toLowerCase() === "pendiente").length,
    [requests]
  );

  const latestRequest = useMemo(() => {
    if (!requests.length) return null;
    return [...requests].sort(
      (a, b) =>
        new Date(b?.creado_en || b?.actualizado_en || 0).getTime() -
        new Date(a?.creado_en || a?.actualizado_en || 0).getTime()
    )[0];
  }, [requests]);

  const quickStats = useMemo(
    () => [
      {
        label: "Cursos activos",
        value: courses.length.toString(),
        detail: coursesLoading ? "Sincronizando" : courses.length ? "Actualizados" : "Sin cursos",
      },
      {
        label: "Solicitudes pendientes",
        value: pendingRequests.toString(),
        detail: requestsLoading ? "Cargando" : `${requests.length} totales`,
      },
      {
        label: "Ultima solicitud",
        value: latestRequest ? formatDate(latestRequest.creado_en || latestRequest.actualizado_en) : "Sin datos",
        detail: latestRequest ? "Revisa tus solicitudes recientes" : "Aun no recibes solicitudes",
      },
    ],
    [courses.length, coursesLoading, pendingRequests, requests.length, requestsLoading, latestRequest]
  );

  const renderCourses = () => {
    if (!token) {
      return <p className="text-sm text-gray-500">Inicia sesion para ver tus cursos.</p>;
    }
    if (coursesLoading) {
      return <p className="text-sm text-gray-500">Cargando cursos...</p>;
    }
    if (coursesError) {
      return <p className="text-sm text-red-600">{coursesError}</p>;
    }
    if (!courses.length) {
      return (
        <div className="rounded-2xl border border-dashed border-[#0b615b]/30 p-6 text-center text-sm text-gray-500">
          <p>No tienes cursos registrados todavia.</p>
          <Link href="/tutor/BeTutor" className="inline-block mt-3 px-5 py-2 rounded-full bg-[#0b615b] text-white shadow">
            Crear mi primer curso
          </Link>
        </div>
      );
    }
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((course) => {
          const catId = getCategoryId(course);
          const courseId = course.id_curso || course.id;
          const ciudad = course?.ciudad || "Sin ciudad";
          const modalidad = course?.modalidad || "Sin modalidad";
          return (
            <div
              key={courseId}
              className="border border-[#0b615b]/15 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Modalidad: {modalidad}</p>
                  <h4 className="text-lg text-[#0b615b] font-semibold">{course?.nombre || `Curso ${courseId}`}</h4>
                </div>
                <span className="text-sm text-[#0b615b] font-semibold">{currency(course?.precio)}</span>
              </div>
              <p className="text-xs text-gray-500">{ciudad}</p>
              <p className="text-sm text-gray-600 line-clamp-2">{course?.descripcion || "Sin descripcion"}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>ID #{courseId}</span>
                {catId ? (
                  <Link href={`/categoria/${catId}?curso=${courseId}`} className="text-[#0b615b] hover:underline">
                    Ver detalle
                  </Link>
                ) : (
                  <span className="text-gray-400">Sin categoria</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Header />
      <nav className="w-full bg-[#0b615b] text-white mt-16 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-start gap-10 px-6 h-12 text-sm font-medium">
          {[
            { id: "panel", label: "Panel" },
            { id: "mensajes", label: "Mensajes" },
            { id: "resenas", label: "Resenas" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-1 transition ${
                activeTab === tab.id
                  ? "text-white after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-white"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="min-h-screen bg-[#f7fafa] pt-12 pb-20 px-4 flex flex-col items-center">
        <div className="w-full max-w-6xl space-y-10">
          {activeTab === "panel" && (
            <>
              <section className="bg-gradient-to-r from-[#0b615b] via-[#0b8575] to-[#08a89f] text-white rounded-3xl shadow-xl p-8 flex flex-col lg:flex-row gap-10">
                <div className="flex-1 space-y-4">
                  <p className="text-sm uppercase tracking-[0.35em] text-white/70">Panel del tutor</p>
                  <h2 className="text-3xl font-semibold">Impulsa tus tutorias, {user?.username || "Tutor"}</h2>
                  <p className="text-white/80 text-sm max-w-xl">
                    Gestiona tus cursos, responde solicitudes y mantiene tus horarios actualizados para dar la mejor experiencia a tus estudiantes.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/tutor/BeTutor" className="bg-white text-[#0b615b] px-5 py-2 rounded-full font-semibold shadow hover:bg-[#f2fffd] transition">
                      Crear nuevo curso
                    </Link>
                    <button className="px-5 py-2 rounded-full border border-white/40 text-white hover:bg-white/10 transition">
                      Actualizar perfil
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                  {quickStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl bg-white/15 backdrop-blur border border-white/20 p-4 shadow-inner flex flex-col gap-1">
                      <p className="text-xs uppercase tracking-wide text-white/70">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-white/80">{stat.detail}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-[1fr,1.1fr]">
                <div className="bg-white shadow-md rounded-2xl p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg">
                      <Image
                        src={user?.avatar || "https://i.pinimg.com/564x/a0/77/70/a077702ce59215b8b5555fcbfa9604e4.jpg"}
                        alt="Tutor"
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Perfil profesional</p>
                      <h2 className="text-xl text-[#0b615b] font-semibold">{user?.username || "Sin nombre"}</h2>
                      <p className="text-sm text-gray-500">Usuario #{user?.id ?? "--"}</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="font-semibold text-[#0b615b] mb-1">Correo</p>
                      <p className="text-gray-500">{user?.email || "sin correo"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#0b615b] mb-1">Rol</p>
                      <p className="text-gray-500">{user?.rol || "sin rol"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#0b615b] mb-1">Telefono</p>
                      <p className="text-gray-500">{user?.telefono || "sin telefono"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#0b615b] mb-1">Especialidad</p>
                      <p className="text-gray-500">{user?.especialidad || "agrega tu especialidad"}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow-md rounded-2xl p-8">
                  <h3 className="text-[#0b615b] font-semibold text-lg mb-4">Ajustes rapidos</h3>
                  <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
                    <div>
                      <p className="font-medium mb-2">Acerca de mis clases</p>
                      <p className="text-gray-500 leading-relaxed">
                        Edita tu descripcion y comparte detalles relevantes de tus sesiones para que los estudiantes sepan que esperar.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium mb-2">Modalidad preferida</p>
                      <div className="flex items-center gap-6 mb-3">
                        {["Presencial", "Virtual"].map((tipo) => (
                          <label key={tipo} className="flex items-center gap-2">
                            <input type="radio" name="tipo" defaultChecked={tipo === "Presencial"} />
                            <span>{tipo}</span>
                          </label>
                        ))}
                      </div>
                      <button className="px-5 py-1.5 rounded-full border border-[#0b615b] text-[#0b615b] hover:bg-[#0b615b]/10 transition">
                        Guardar cambios
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-white shadow-md rounded-2xl p-8 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-[#0b615b] font-semibold text-lg">Mis cursos</h3>
                    <p className="text-sm text-gray-500">Se muestran los cursos asociados a tu cuenta.</p>
                  </div>
                  <Link href="/tutor/BeTutor" className="px-5 py-2 rounded-full bg-[#0b615b] text-white shadow hover:bg-[#0a7f77] transition">
                    Crear otro curso
                  </Link>
                </div>
                {renderCourses()}
              </section>

              <section className="bg-white shadow-md rounded-2xl p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
                  <div>
                    <h3 className="text-[#0b615b] font-semibold text-lg">Mi disponibilidad</h3>
                    <p className="text-sm text-gray-500">Administra tus horarios y bloqueos de manera visual.</p>
                  </div>
                </div>
                <HorarioManager />
              </section>
            </>
          )}

          {activeTab === "mensajes" && <Mensajes />}
          {activeTab === "resenas" && <Resenas />}
        </div>
      </main>
    </>
  );
}
