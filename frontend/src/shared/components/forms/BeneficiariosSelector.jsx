// Selector de tipos de beneficiario del Paso I.

// Punto 1.9 del formato: tipos de beneficiario del catálogo
// GET /api/v1/tipos-beneficiario/ -> [{ id, codigo, label, orden }]
// Se marcan con casillas y se guardan los `id` en `beneficiarios`.
// El texto libre va en `benef_otro_detalle` (obligatorio si se marca "Otro").

const CODIGO_OTRO = 'otro';

const normalizarIds = (value) =>
  (Array.isArray(value) ? value : [])
    .map((item) =>
      typeof item === 'object' && item !== null ? Number(item.id) : Number(item)
    )
    .filter((id) => Number.isInteger(id) && id > 0);

export default function BeneficiariosSelector({
  tipos = [],
  cargando = false,
  value = [],
  onToggle,
  detalleOtro = '',
  onChangeDetalleOtro,
  onReintentar,
}) {
  const seleccionados = normalizarIds(value);

  const tipoOtro = tipos.find((tipo) => tipo.codigo === CODIGO_OTRO);
  const otroMarcado = tipoOtro ? seleccionados.includes(Number(tipoOtro.id)) : false;

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-xs font-semibold text-slate-600">
        Beneficiario / Destinatario Principal <span className="text-red-500">*</span>
      </label>
      <p className="text-xs text-slate-500">
        Marque uno o más tipos de beneficiario.
      </p>

      {cargando && (
        <p className="text-sm text-slate-500">Cargando tipos de beneficiario...</p>
      )}

      {!cargando && tipos.length === 0 && (
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>No se pudo cargar el catálogo de beneficiarios.</span>
          {onReintentar && (
            <button
              type="button"
              onClick={onReintentar}
              className="text-[#b1122b] font-semibold hover:underline"
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {!cargando && tipos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          {tipos.map((tipo) => {
            const id = Number(tipo.id);
            const marcado = seleccionados.includes(id);
            const inputId = `beneficiario-${id}`;

            return (
              <label
                key={id}
                htmlFor={inputId}
                className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer"
              >
                <input
                  id={inputId}
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#b1122b] cursor-pointer"
                  checked={marcado}
                  onChange={(e) => onToggle?.(id, e.target.checked)}
                />
                <span>{tipo.label}</span>
              </label>
            );
          })}
        </div>
      )}

      <div className="mt-2 flex flex-col gap-1 md:w-1/2">
        <label className="text-xs font-semibold text-slate-600" htmlFor="benef-otro-detalle">
          {otroMarcado ? (
            <>
              Especifique el beneficiario "Otro" <span className="text-red-500">*</span>
            </>
          ) : (
            'Detalle de los beneficiarios (opcional)'
          )}
        </label>
        <input
          id="benef-otro-detalle"
          type="text"
          className={`h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#b1122b]/10 focus:border-[#b1122b] transition-all placeholder:text-slate-400 ${
            otroMarcado && !detalleOtro.trim() ? 'border-red-400' : 'border-slate-300'
          }`}
          placeholder={
            otroMarcado
              ? 'Especifique el beneficiario aquí...'
              : 'Ej. Estudiantes de 3.er año de secundaria'
          }
          value={detalleOtro}
          onChange={(e) => onChangeDetalleOtro?.(e.target.value)}
        />
      </div>
    </div>
  );
}
