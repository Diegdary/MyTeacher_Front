"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";

const API_BASE = "http://127.0.0.1:8000/api/auth";
const CRUD = `${API_BASE}/crud`;

type Categoria = {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
};

type Paged<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export default function BecomeTutorWizard() {
  // Paso actual
  const [step, setStep] = useState<1 | 2 | 3 | "done">(1);

  // Datos del formulario
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [search, setSearch] = useState("");
  const [catPage, setCatPage] = useState(1);
  const [catData, setCatData] = useState<Paged<Categoria> | null>(null);
  const [catLoading, setCatLoading] = useState(false);

  const [cursoNombre, setCursoNombre] = useState("");
  const [cursoDescripcion, setCursoDescripcion] = useState("");
  const [modalidad, setModalidad] = useState<"presencial"|"virtual"|"ambas">("presencial");
  const [precio, setPrecio] = useState<string>("");


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);


  const authFetch = async (url: string, init?: RequestInit) => {
    const access = localStorage.getItem("access");
    return fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
      },
    });
  };

  // ---------  Categorías (búsqueda + paginación) ----------
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const load = async () => {
      setCatLoading(true);
      try {
        const url = `${CRUD}/categorias/?search=${encodeURIComponent(debouncedSearch)}&page=${catPage}`;
        const res = await fetch(url);
        const data: Paged<Categoria> = await res.json();
        setCatData(data);
      } catch {
        
      } finally {
        setCatLoading(false);
      }
    };
    load();
  }, [debouncedSearch, catPage]);

  // --------- Paso 3: Crear curso ----------
  const handleCreateCourse = async () => {
    setError(null);
    setSuccess(null);

    if (!categoria) {
      setError("Selecciona una categoría.");
      return;
    }
    if (!cursoNombre || !cursoDescripcion) {
      setError("Completa el título y la descripción del curso.");
      return;
    }
    if (!precio || isNaN(Number(precio))) {
      setError("Indica un precio válido.");
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch(`${CRUD}/cursos/`, {
        method: "POST",
        body: JSON.stringify({
          nombre: cursoNombre,
          descripcion: cursoDescripcion,
          modalidad,
          precio: Number(precio),
          categoria: categoria.id_categoria,
          
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = extractErrorMessage(data) || "No se pudo crear el curso.";
        throw new Error(msg);
      }

      setSuccess("🎉 ¡Curso creado! Tu cuenta ahora es Tutor.");
      
      setTimeout(() => setStep("done"), 1400);
    } catch (e: any) {
      setError(e.message || "Error al crear el curso");
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI ----------
  return (
    <main className="min-h-screen w-full bg-white text-[#0b615b]">
      {/* Header simple */}
     <div className="flex items-center justify-start h-[60px] px-6">
  <Image
    src="/logo_nav.png"
    alt="Logo MyTeacher"
    width={140}      
    height={40}
    className="object-contain"
  />
</div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid md:grid-cols-2 gap-10">
        {/* Panel izquierdo (bienvenida) */}
        <div className="rounded-3xl p-6 bg-gradient-to-b from-[#c7f4ff] to-[#defbff] text-[#356a6f]">
          <h2 className="text-2xl font-semibold mb-3">Bienvenido a my teacher</h2>
          <p className="text-sm opacity-80 leading-6">
            Completa estos pasos para publicar tu primera clase y convertirte en Tutor.
          </p>
        </div>

        {/* Panel derecho (contenido por paso) */}
        <div>
          {step === 1 && (
            <Step1Categorias
              search={search}
              setSearch={setSearch}
              catData={catData}
              catLoading={catLoading}
              catPage={catPage}
              setCatPage={setCatPage}
              categoria={categoria}
              setCategoria={setCategoria}
            />
          )}

          {step === 2 && (
            <Step2Info
              cursoNombre={cursoNombre}
              setCursoNombre={setCursoNombre}
              cursoDescripcion={cursoDescripcion}
              setCursoDescripcion={setCursoDescripcion}
            />
          )}

          {step === 3 && (
            <Step3Config
              modalidad={modalidad}
              setModalidad={setModalidad}
              precio={precio}
              setPrecio={setPrecio}
            />
          )}

          {/* Mensajes bonitos */}
          {!!error && (
            <div className="mt-4 bg-red-100 text-red-700 border border-red-300 rounded-md px-4 py-2 text-sm">
              <div className="flex items-center gap-2"><span>❌</span><p>{error}</p></div>
            </div>
          )}
          {!!success && (
            <div className="mt-4 bg-green-100 text-green-700 border border-green-300 rounded-md px-4 py-2 text-sm">
              <div className="flex items-center gap-2"><span>✅</span><p>{success}</p></div>
            </div>
          )}

          {/* Botones inferiores */}
          <div className="flex justify-end gap-3 mt-6">
            {step !== 1 && step !== "done" && (
              <button
                onClick={() => setStep((p) => (p === 3 ? 2 : 1))}
                className="px-5 py-2 rounded-full bg-[#c7f4ff] hover:bg-[#bdefff]"
              >
                Atrás
              </button>
            )}

            {step === 1 && (
              <button
                disabled={!categoria}
                onClick={() => setStep(2)}
                className="px-6 py-2 rounded-full bg-[#0b615b] text-white disabled:opacity-50"
              >
                Siguiente
              </button>
            )}

            {step === 2 && (
              <button
                disabled={!cursoNombre || !cursoDescripcion}
                onClick={() => setStep(3)}
                className="px-6 py-2 rounded-full bg-[#0b615b] text-white disabled:opacity-50"
              >
                Siguiente
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleCreateCourse}
                disabled={loading}
                className="px-6 py-2 rounded-full bg-[#0b615b] text-white disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Publicar curso"}
              </button>
            )}
          </div>
        </div>
      </div>

      {step === "done" && (
        <div className="max-w-xl mx-auto my-24 text-center">
          <div className="rounded-2xl bg-gradient-to-b from-[#c7f4ff] to-[#e8ffff] py-10">
            <h3 className="text-xl font-semibold">Ya eres tutor en MyTEACHER</h3>
          </div>
          <a href="/" className="inline-block mt-8 px-6 py-2 rounded-full bg-[#063d3a] text-white">
            Volver a inicio
          </a>
        </div>
      )}
    </main>
  );
}

/* ---------- Subcomponentes ---------- */

function Step1Categorias({
  search, setSearch, catData, catLoading, catPage, setCatPage, categoria, setCategoria,
}: {
  search: string;
  setSearch: (v: string) => void;
  catData: Paged<Categoria> | null;
  catLoading: boolean;
  catPage: number;
  setCatPage: (n: number) => void;
  categoria: Categoria | null;
  setCategoria: (c: Categoria | null) => void;
}) {
  return (
    <div>
      <h3 className="text-3xl font-light text-[#063d3a] mb-6">¿Qué enseñas?</h3>

      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setCatPage(1); }}
        placeholder="Busca una categoría..."
        className="w-full rounded-full bg-[#c7f4ff] px-5 py-2 outline-none mb-3"
      />

      <div className="rounded-2xl border border-[#bdefff] p-3 max-h-[360px] overflow-auto">
        {catLoading && <p className="text-sm text-gray-500 px-2">Cargando…</p>}

        {(catData?.results || []).map((c) => (
          <button
            key={c.id_categoria}
            onClick={() => setCategoria(c)}
            className={
              "w-full text-left px-4 py-2 rounded-lg mb-2 " +
              (categoria?.id_categoria === c.id_categoria
                ? "bg-[#0b615b] text-white"
                : "bg-[#e8fdff] hover:bg-[#dff9ff]")
            }
          >
            {c.nombre}
          </button>
        ))}

        <div className="flex justify-between items-center mt-2 px-1">
          <button
            disabled={!catData?.previous}
            onClick={() => setCatPage(Math.max(1, catPage - 1))}
            className="px-3 py-1 rounded-full bg-[#c7f4ff] disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-xs text-gray-500">
            Página {catPage}
          </span>
          <button
            disabled={!catData?.next}
            onClick={() => setCatPage(catPage + 1)}
            className="px-3 py-1 rounded-full bg-[#c7f4ff] disabled:opacity-40"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}

function Step2Info({
  cursoNombre, setCursoNombre, cursoDescripcion, setCursoDescripcion,
}: {
  cursoNombre: string; setCursoNombre: (v: string) => void;
  cursoDescripcion: string; setCursoDescripcion: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[#356a6f] mb-2">Escribe el título de tu clase</label>
      <input
        value={cursoNombre}
        onChange={(e) => setCursoNombre(e.target.value)}
        placeholder="Ej: Matemáticas desde cero"
        className="w-full rounded-full bg-[#c7f4ff] px-5 py-2 outline-none mb-5"
      />
      <label className="block text-[#356a6f] mb-2">Escribe la descripción de tu clase</label>
      <textarea
        value={cursoDescripcion}
        onChange={(e) => setCursoDescripcion(e.target.value)}
        placeholder="Cuenta de qué trata, a quién va dirigida, requisitos…"
        className="w-full rounded-2xl bg-[#c7f4ff] px-5 py-3 outline-none h-40"
      />
    </div>
  );
}

function Step3Config({
  modalidad, setModalidad, precio, setPrecio,
}: {
  modalidad: "presencial"|"virtual"|"ambas";
  setModalidad: (m: "presencial"|"virtual"|"ambas") => void;
  precio: string; setPrecio: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[#356a6f] mb-3">Escribe modalidad</p>
      <div className="flex items-center gap-5 mb-5">
        {(["presencial","virtual","ambas"] as const).map(m => (
          <label key={m} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="modalidad"
              value={m}
              checked={modalidad === m}
              onChange={() => setModalidad(m)}
            />
            <span className="capitalize">{m}</span>
          </label>
        ))}
      </div>

      <label className="block text-[#356a6f] mb-2">Escribe tu precio por hora</label>
      <input
        value={precio}
        onChange={(e) => setPrecio(e.target.value)}
        placeholder="Ej: 50000"
        className="w-full rounded-full bg-[#c7f4ff] px-5 py-2 outline-none"
      />
    </div>
  );
}

/* ---------- Utils ---------- */

function useDebounce<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

function extractErrorMessage(data: any): string | null {
  if (!data) return null;
  if (typeof data === "string") return data;

  
  const first = Object.values(data)[0];
  if (Array.isArray(first)) return String(first[0]);
  if (typeof first === "string") return first;
  return null;
}
