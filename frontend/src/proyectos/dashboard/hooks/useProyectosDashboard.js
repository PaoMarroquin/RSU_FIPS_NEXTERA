import { useEffect, useState } from "react";
import api from "../../../shared/api/axiosConfig";
import { fetchAllPages } from "../../../shared/api/fetchAllPages";

// Encapsula el fetch de proyectos para el dashboard: loading, error y
// normalización de la respuesta (array directo o paginada { results }).
export function useProyectosDashboard() {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchAllPages("/api/v1/proyectos/")
      .then((lista) => {
        if (cancelled) return;
        setProyectos(lista);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Error al cargar proyectos:", err);
          setError("No se pudieron cargar los proyectos. Intenta de nuevo.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { proyectos, loading, error };
}