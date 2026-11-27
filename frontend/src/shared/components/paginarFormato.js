// Reparte el contenido del formato en hojas A4, cada una con su encabezado y
// su "Página X de Y". El navegador no permite numerar dentro de un encabezado
// repetido, por eso las páginas se arman aquí.

const esDivisible = (nodo) =>
  !nodo.classList.contains('fo-cierre') &&
  (['DIV', 'UL', 'OL', 'TABLE', 'TBODY'].includes(nodo.tagName) ||
    nodo.matches('.fo-preguntas > li'));

const crear = (clase) => {
  const div = document.createElement('div');
  div.className = clase;
  return div;
};

export const paginarFormato = (origen, destino) => {
  const encabezado = origen.querySelector('.fo-encabezado');
  const contenido = origen.querySelector('.fo-cuerpo');

  // Las medidas se toman fuera de pantalla: un contenedor oculto mediría cero.
  const taller = crear('formato-ours fo-taller');
  document.body.appendChild(taller);

  let cuerpo;
  let flujo;

  const nuevaPagina = () => {
    const pagina = crear('fo-pagina');
    cuerpo = crear('fo-area');
    flujo = crear('fo-cuerpo');
    cuerpo.appendChild(flujo);
    pagina.append(encabezado.cloneNode(true), cuerpo);
    taller.appendChild(pagina);
  };

  const cabe = () =>
    flujo.getBoundingClientRect().height <= cuerpo.getBoundingClientRect().height + 0.5;

  // Pasa a otra página y reconstruye en ella los contenedores abiertos.
  const saltar = (ruta) => {
    const anterior = flujo;

    // Un título no debe quedar solo al final de la página.
    let ultimo = anterior.lastElementChild;
    if (ultimo && ultimo === ruta[0]?.copia && !ultimo.textContent.trim()) {
      ultimo = ultimo.previousElementSibling;
    }
    const titulo = ultimo?.matches('.fo-titulo') ? ultimo : null;

    nuevaPagina();
    if (titulo) flujo.appendChild(titulo);

    let padre = flujo;
    ruta.forEach((nivel) => {
      const copia = nivel.original.cloneNode(false);
      const columnas = nivel.original.querySelector(':scope > colgroup');
      if (columnas) copia.appendChild(columnas.cloneNode(true));
      // La viñeta solo se oculta si el punto ya empezó en la página anterior.
      if (copia.tagName === 'LI' && nivel.copia.textContent.trim()) {
        copia.classList.add('fo-continua');
      }
      if (copia.tagName === 'OL') copia.start = nivel.indice + 1;
      padre.appendChild(copia);

      // Si en la página anterior no llegó a entrar nada, se elimina el cascarón.
      if (!nivel.copia.querySelector(':scope > :not(colgroup)')) nivel.copia.remove();
      nivel.copia = copia;
      padre = copia;
    });
  };

  const hayContenido = () =>
    Boolean(flujo.querySelector('tr, p, li, h3, img, .fo-centro, .fo-cierre'));

  // Corta un párrafo largo por palabras y devuelve el texto que no entró.
  const cortarTexto = (parrafo) => {
    const palabras = parrafo.textContent.split(/(\s+)/);
    let min = 0;
    let max = palabras.length;
    while (min < max) {
      const medio = Math.ceil((min + max) / 2);
      parrafo.textContent = palabras.slice(0, medio).join('');
      if (cabe()) min = medio;
      else max = medio - 1;
    }
    parrafo.textContent = palabras.slice(0, min).join('');
    return palabras.slice(min).join('').trimStart();
  };

  const colocar = (nodo, ruta) => {
    const padre = () => (ruta.length ? ruta[ruta.length - 1].copia : flujo);
    const copia = nodo.cloneNode(true);
    padre().appendChild(copia);
    if (cabe()) return;

    if (copia.matches('p.fo-respuesta')) {
      const resto = cortarTexto(copia);
      if (!copia.textContent) copia.remove();
      else if (!resto) return;
      if (!copia.textContent && !hayContenido()) {
        padre().appendChild(nodo.cloneNode(true));
        return;
      }
      saltar(ruta);
      const sobrante = nodo.cloneNode(false);
      sobrante.textContent = resto;
      colocar(sobrante, ruta);
      return;
    }

    copia.remove();

    if (esDivisible(nodo)) {
      const cascaron = nodo.cloneNode(false);
      const columnas = nodo.querySelector(':scope > colgroup');
      if (columnas) cascaron.appendChild(columnas.cloneNode(true));
      padre().appendChild(cascaron);

      const nivel = { original: nodo, copia: cascaron, indice: 0 };
      Array.from(nodo.children)
        .filter((hijo) => hijo.tagName !== 'COLGROUP')
        .forEach((hijo, indice) => {
          nivel.indice = indice;
          colocar(hijo, [...ruta, nivel]);
        });
      return;
    }

    // Bloque indivisible: va a la página siguiente.
    if (hayContenido()) {
      saltar(ruta);
      padre().appendChild(copia);
    } else {
      padre().appendChild(copia);
    }
  };

  nuevaPagina();
  Array.from(contenido.children).forEach((nodo) => colocar(nodo, []));

  const paginas = Array.from(taller.children);
  paginas.forEach((pagina, i) => {
    pagina.querySelector('.fo-numero').textContent = `Página ${i + 1} de ${paginas.length}`;
  });

  destino.replaceChildren(...paginas);
  taller.remove();
};
