
"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faDollarSign,
  faBriefcase,
  faFlask,
  faBookOpen,
  faChartLine,
  faCalculator,
  faGlobe,
  faChalkboardTeacher,
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/auth";
const DEFAULT_CITIES = ["Barranquilla", "Cartagena", "Medellín"];
const MODALITY_OPTIONS = [
  { value: "presencial", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
  { value: "ambas", label: "Ambas" },
];

const normalizeValue = (value?: string | null) => (value ?? "").trim().toLowerCase();

const sentenceCase = (value?: string | null, fallback = "No especificado") => {
  const normalized = (value ?? "").trim();
  if (!normalized) return fallback;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
};

const formatCurrency = (value: number | string) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return "$0";
  return `$${amount.toLocaleString("es-CO")}`;
};

const CATEGORY_ICON_MAP: { match: RegExp; icon: any }[] = [
  { match: /admin|negoc|empresa|contabilidad|finanza|econom/i, icon: faBriefcase },
  { match: /bio|quim|cienc/i, icon: faFlask },
  { match: /lect|redac|compren|idioma|literat/i, icon: faBookOpen },
  { match: /conta|estad|analit|datos/i, icon: faChartLine },
  { match: /mate|calcu|algebra|fisic/i, icon: faCalculator },
  { match: /idioma|global|hist|geogra/i, icon: faGlobe },
  { match: /ense|pedag|didact|formaci/i, icon: faChalkboardTeacher },
];

const getCategoryIcon = (name: string) => {
  const entry = CATEGORY_ICON_MAP.find(({ match }) => match.test(name));
  return entry?.icon ?? faBookOpen;
};

interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion: string;
}

interface Usuario {
  id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface Curso {
  id_curso: number;
  nombre: string;
  descripcion?: string;
  modalidad?: string;
  ciudad?: string;
  precio: number | string;
  tutor?: number | Usuario;
  categoria?: number | Categoria;
}

export default function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const MAX_CATEGORY_CARDS = 4;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [filteredCursos, setFilteredCursos] = useState<Curso[]>([]);
  const [cursosLoading, setCursosLoading] = useState(true);
  const [cursosError, setCursosError] = useState<string | null>(null);
  const [courseQuery, setCourseQuery] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedModalities, setSelectedModalities] = useState<string[]>([]);
  const [tutores, setTutores] = useState<Record<number, Usuario>>({});
  const displayedCategories = useMemo(() => categorias.slice(0, MAX_CATEGORY_CARDS), [categorias]);

  const fetchCategorias = async (url = `${API_URL}/crud/categorias/`) => {
    try {
      setLoading(true);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al cargar categorías");
      const data = await res.json();
      setCategorias(data.results || data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No fue posible cargar las categorías";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTutorProfiles = useCallback(
    async (lista: Curso[]) => {
      const missing = Array.from(
        new Set(
          lista
            .map((curso) => (typeof curso.tutor === "number" ? curso.tutor : curso.tutor?.id))
            .filter((id): id is number => typeof id === "number" && !(id in tutores))
        )
      );
      if (!missing.length) return;

      const resolved: Record<number, Usuario> = {};
      await Promise.all(
        missing.map(async (id) => {
          try {
            const res = await fetch(`${API_URL}/crud/usuarios/${id}/`);
            if (!res.ok) return;
            resolved[id] = await res.json();
          } catch {
            // Ignoramos fallos individuales y continuamos con los demás perfiles.
          }
        })
      );

      if (Object.keys(resolved).length) {
        setTutores((prev) => ({ ...prev, ...resolved }));
      }
    },
    [tutores]
  );

  const fetchCursos = useCallback(async () => {
    try {
      setCursosLoading(true);
      setCursosError(null);
      const params = new URLSearchParams();
      if (courseSearch) params.set("search", courseSearch);
      if (categoryFilter) params.set("categoria", categoryFilter);
      const query = params.toString();
      const url = query ? `${API_URL}/filtrar-cursos/?${query}` : `${API_URL}/filtrar-cursos/`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al cargar cursos");
      const data = await res.json();
      const list: Curso[] = Array.isArray(data) ? data : data.results || [];
      setCursos(list);
      await fetchTutorProfiles(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No fue posible cargar los cursos";
      setCursos([]);
      setFilteredCursos([]);
      setCursosError(message);
    } finally {
      setCursosLoading(false);
    }
  }, [categoryFilter, courseSearch, fetchTutorProfiles]);

  const cityOptions = useMemo(() => {
    const dynamic = Array.from(
      new Set(
        cursos
          .map((curso) => (curso.ciudad || "").trim())
          .filter((city) => city.length > 0)
      )
    );
    return dynamic.length ? dynamic : DEFAULT_CITIES;
  }, [cursos]);

  useEffect(() => {
    fetchCategorias();
  }, []);

  useEffect(() => {
    fetchCursos();
  }, [fetchCursos]);

  useEffect(() => {
    let filtered = [...cursos];
    if (selectedCities.length) {
      filtered = filtered.filter((curso) => selectedCities.includes(normalizeValue(curso.ciudad)));
    }
    if (selectedModalities.length) {
      filtered = filtered.filter((curso) =>
        selectedModalities.includes(normalizeValue(curso.modalidad))
      );
    }
    setFilteredCursos(filtered);
  }, [cursos, selectedCities, selectedModalities]);

  useEffect(() => {
    const allowed = new Set(cityOptions.map((city) => normalizeValue(city)));
    setSelectedCities((prev) => prev.filter((city) => allowed.has(city)));
  }, [cityOptions]);

  const handleSearch = () => {
    setCourseSearch(courseQuery.trim());
  };

  const toggleCity = (city: string) => {
    const normalized = normalizeValue(city);
    setSelectedCities((prev) =>
      prev.includes(normalized) ? prev.filter((item) => item !== normalized) : [...prev, normalized]
    );
  };

  const toggleModalidad = (value: string) => {
    const normalized = normalizeValue(value);
    setSelectedModalities((prev) =>
      prev.includes(normalized) ? prev.filter((item) => item !== normalized) : [...prev, normalized]
    );
  };

  const resolveTutorName = useCallback(
    (curso: Curso) => {
      const tutorData =
        typeof curso.tutor === "object" ? curso.tutor : tutores[Number(curso.tutor)];
      if (!tutorData) return "Tutor disponible";
      const first = tutorData.first_name?.trim() ?? "";
      const last = tutorData.last_name?.trim() ?? "";
      const fallback = tutorData.username || tutorData.email || "Tutor disponible";
      const fullName = `${first} ${last}`.trim();
      return fullName || fallback;
    },
    [tutores]
  );

  return (
    <section className="flex flex-col w-full mt-12 mb-16 text-center px-4 max-w-6xl mx-auto">
      <h2 className="text-3xl font-semibold text-[#0b615b] mb-8">Categorías populares</h2>

      {error ? (
        <p className="text-red-500">{error}</p>
      ) : loading ? (
        <p className="text-gray-500">Cargando categorías...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          <AnimatePresence>
            {displayedCategories.map((cat) => (
              <motion.div
                key={cat.id_categoria}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="group bg-white border border-[#0b615b]/40 rounded-2xl shadow-sm hover:shadow-md transition hover:-translate-y-1 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="text-[#0b615b] text-4xl mb-3">
                    <FontAwesomeIcon icon={getCategoryIcon(cat.nombre)} />
                  </div>
                  <h3 className="text-lg font-semibold text-[#0b615b] mb-1">{cat.nombre}</h3>
                  <p className="text-gray-500 text-sm line-clamp-3">
                    {cat.descripcion || "Sin descripción"}
                  </p>
                </div>
                <Link
                  href={`/categoria/${cat.id_categoria}`}
                  className="mt-4 inline-block text-sm font-semibold text-[#0b615b] hover:text-[#087b74] transition"
                >
                  Ver Cursos
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <h2 className="text-3xl font-semibold text-[#0b615b] my-8">Cursos</h2>

      <div className="flex justify-center mb-8">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSearch();
          }}
          className="flex w-[90%] max-w-lg rounded-full overflow-hidden bg-gradient-to-r from-[#c7f4ff] to-[#e8ffff] shadow-sm border border-[#0b615b20]"
        >
          <select
            className="text-[#0b615b] px-3 outline-none"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Categoría</option>
            {categorias.map((cat) => (
              <option key={cat.id_categoria} value={String(cat.id_categoria)}>
                {cat.nombre}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Busca un curso..."
            value={courseQuery}
            onChange={(e) => setCourseQuery(e.target.value)}
            className="flex-grow px-6 py-3 bg-transparent outline-none text-[#0b615b] placeholder-[#64a7b3]"
          />
          <button
            type="submit"
            className="bg-[#0b615b] text-white px-6 hover:bg-[#0a7f77] transition"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
        </form>
      </div>

      <article className="flex flex-col sm:flex-row justify-center w-full sm:h-[620px] self-center">
        <div className="flex flex-row sm:flex-col justify-around sm:justify-start items-start sm:w-[20%] sm:border-r-1 border-gray-300">
          <div className="flex flex-col items-start">
            <h3 className="font-bold">Ciudades:</h3>
            {cityOptions.map((city) => {
              const id = `city-${normalizeValue(city)}`;
              const normalized = normalizeValue(city);
              return (
                <div key={id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={id}
                    checked={selectedCities.includes(normalized)}
                    onChange={() => toggleCity(city)}
                  />
                  <label className="ml-2.5" htmlFor={id}>
                    {city}
                  </label>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col items-start">
            <h3 className="font-bold">Modalidad:</h3>
            {MODALITY_OPTIONS.map(({ value, label }) => {
              const id = `modal-${value}`;
              return (
                <div key={value} className="flex items-center">
                  <input
                    type="checkbox"
                    id={id}
                    checked={selectedModalities.includes(value)}
                    onChange={() => toggleModalidad(value)}
                  />
                  <label className="ml-2.5" htmlFor={id}>
                    {label}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
        <div className="px-6 w-[80%] grid grid-rows-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {cursosLoading ? (
            <p className="col-span-full text-gray-500">Cargando cursos...</p>
          ) : cursosError ? (
            <p className="col-span-full text-red-500">{cursosError}</p>
          ) : filteredCursos.length === 0 ? (
            <p className="col-span-full text-gray-500">
              No encontramos cursos con los filtros seleccionados.
            </p>
          ) : (
            filteredCursos.map((curso) => {
              const catId =
                typeof curso.categoria === "number"
                  ? curso.categoria
                  : curso.categoria?.id_categoria || curso.categoria?.id;
              const card = (
                <div className="flex flex-col justify-center h-[300px]">
                  <figure className="rounded-3xl w-full h-30 relative overflow-hidden">
                    <Image
                      src="/tutoria16.jpg"
                      alt="Tutor enseñando en clase"
                      fill
                      className="object-cover h-full w-full static"
                    />
                  </figure>
                  <h3 className="font-bold">{curso.nombre}</h3>
                  <p>
                    <b>Precio: </b>
                    <FontAwesomeIcon icon={faDollarSign} className="mr-1 text-[#0b615b]" />
                    {formatCurrency(curso.precio)}
                  </p>
                  <p>
                    <b>Tutor:</b> {resolveTutorName(curso)}
                  </p>
                  <p>
                    <b>Modalidad:</b> {sentenceCase(curso.modalidad, "Sin modalidad")}
                  </p>
                  <p>
                    <b>Ciudad:</b> {sentenceCase(curso.ciudad, "Sin ciudad")}
                  </p>
                </div>
              );

              if (catId) {
                return (
                  <Link
                    key={curso.id_curso}
                    href={`/categoria/${catId}?curso=${curso.id_curso}`}
                    className="block text-current hover:no-underline focus:no-underline"
                  >
                    {card}
                  </Link>
                );
              }

              return React.cloneElement(card, { key: curso.id_curso });
            })
          )}
        </div>
      </article>

    </section>
  );
}
