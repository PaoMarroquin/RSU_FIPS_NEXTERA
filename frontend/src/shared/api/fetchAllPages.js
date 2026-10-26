import api from "./axiosConfig";

export async function fetchAllPages(source, params = {}) {
  let resultadosCompletos = [];
  let nextUrl = typeof source === "string" ? source : null;
  let isFirstRequest = true;

  while (isFirstRequest || nextUrl) {
    const res = isFirstRequest
      ? typeof source === "function"
        ? await source()
        : await api.get(source, { params: { page_size: 100, ...params } })
      : await api.get(nextUrl);

    isFirstRequest = false;

    const data =
      res && res.data !== undefined && !Array.isArray(res) && !Array.isArray(res.results)
        ? res.data
        : res;

    if (Array.isArray(data)) {
      resultadosCompletos = [...resultadosCompletos, ...data];
      break;
    }

    if (Array.isArray(data?.results)) {
      resultadosCompletos = [...resultadosCompletos, ...data.results];
    }

    nextUrl = data?.next
      ? data.next.replace(/^.*\/(api\/v1\/)/, "/$1")
      : null;
  }

  return resultadosCompletos;
}