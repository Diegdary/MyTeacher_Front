"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faDollarSign } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/auth";

interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion: string;
}

export default function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(""); // 🔍 texto del buscador

  // 🔹 Obtener categorías desde el backend
  const fetchCategorias = async (url = `${API_URL}/crud/categorias/?search=${search}`) => {
    try {
      setLoading(true);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al cargar categorías");
      const data = await res.json();
      setCategorias(data.results || data);
      setNextPage(data.next || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, [search]); // 🔹 cada vez que cambie la búsqueda

  const handleVerMas = () => {
    if (nextPage) {
      fetchCategorias(nextPage);
    } else {
      setVisibleCount((prev) => prev + 12);
    }
  };

  return (
    <section className="flex flex-col w-full mt-12 mb-16 text-center px-4 max-w-6xl mx-auto">
      <h2 className="text-3xl font-semibold text-[#0b615b] mb-8">
        Categorías populares
      </h2>

      {/* GRID DE CATEGORÍAS */}
      {loading ? (
        <p className="text-gray-500">Cargando categorías...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <AnimatePresence>
            {categorias.slice(0, visibleCount).map((cat) => (
              <motion.div
                key={cat.id_categoria}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="group bg-white border border-[#0b615b]/40 rounded-2xl shadow-sm hover:shadow-md transition hover:-translate-y-1 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="text-[#0b615b] text-4xl mb-3">📚</div>
                  <h3 className="text-lg font-semibold text-[#0b615b] mb-1">
                    {cat.nombre}
                  </h3>
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

      {/* BOTÓN “VER MÁS” */}
      {((nextPage && categorias.length > 0) || visibleCount < categorias.length) && (
        <div className="mt-10">
          <button
            onClick={handleVerMas}
            disabled={loading}
            className="bg-[#0b615b] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#0a7f77] transition disabled:opacity-60 shadow-md"
          >
            {loading ? "Cargando..." : "Ver más categorías"}
          </button>
        </div>
      )}

      <h2 className="text-3xl font-semibold text-[#0b615b] my-8">Cursos</h2>

      {/* 🔍 BUSCADOR */}
      <div className="flex justify-center mb-8">
        <div className="flex w-[90%] max-w-lg rounded-full overflow-hidden bg-gradient-to-r from-[#c7f4ff] to-[#e8ffff] shadow-sm border border-[#0b615b20]">
          <select className="text-[#0b615b]" name="" id="">
            <option value="">Categoría</option>
            <option value="example">Example 2</option>
            <option value="example">Example 3</option>
          </select>
          <input
            type="text"
            placeholder="Busca una categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-grow px-6 py-3 bg-transparent outline-none text-[#0b615b] placeholder-[#64a7b3]"
          />
          <button
            onClick={() => fetchCategorias()}
            className="bg-[#0b615b] text-white px-6 hover:bg-[#0a7f77] transition"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
        </div>
      </div>

      {/* Contenedor de cursos */}
      <article className="flex flex-col sm:flex-row justify-center w-[100%] sm:h-[620px] self-center">
        <div className=" flex flex-row sm:flex-col justify-around sm:justify-start items-start sm:w-[20%] sm:border-r-1 border-gray-300">
          <div className="flex flex-col items-start">
            <h3 className="font-bold">Ciudades:</h3>
            <div>
              <input type="checkbox" name="" id="" />
              <label className="ml-2.5" htmlFor="anything">Barranquilla</label>
            </div>
            <div>
              <input type="checkbox" name="" id="" />
              <label className="ml-2.5" htmlFor="anything">Cartagena</label>
            </div>
            <div>
              <input type="checkbox" name="" id="" />
              <label className="ml-2.5" htmlFor="anything">Medellín</label>
            </div>
            <br />
          </div>
          <div className="flex flex-col items-start">
            <h3 className="font-bold">Modalidad:</h3>
            <div>
              <input type="checkbox" name="" id="" />
              <label className="ml-2.5" htmlFor="anything">Presencial</label>
            </div>
            <div>
              <input type="checkbox" name="" id="" />
              <label className="ml-2.5" htmlFor="anything">Virtual</label>
            </div>
            <div>
              <input type="checkbox" name="" id="" />
              <label className="ml-2.5" htmlFor="anything">Ambas</label>
            </div>
          </div>

        </div>
        <div className="px-6 w-[80%] grid grid-rows-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <div className="flex flex-col justify-center h-[300px]">
            <figure className="rounded-3xl w-full h-30 relative overflow-hidden">
              <Image
                src="/tutoria16.jpg"
                alt="Tutor enseñando en clase"
                fill
                className="object-cover h-full w-full static"
                priority
              />
            </figure>
            <h3 className="font-bold">Curso de barberia</h3>
            <p><b>Precio: </b>$35.000</p>
            <p><b>Tutor:</b> Hernando Vargas</p>
            <p><b>Modalidad:</b> Presencial</p>
            <p><b>Ciudad:</b> Barranquilla</p>
          </div>

        </div>
      </article>

      

      

      {/* PAGINACIÓN */}
      {!nextPage && categorias.length >= visibleCount && !loading && (
        <p className="mt-4 text-gray-400 text-sm">
          No hay más categorías disponibles
        </p>
      )}
    </section>
  );
}
