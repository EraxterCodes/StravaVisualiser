"use client";

import { useEffect, useRef, useState } from "react";

export interface FetchJsonState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches JSON from `url` and re-fetches whenever it changes (e.g. the
 * shared time-range preset). Per the dataviz interaction guidance, a
 * refetch keeps the previous data in place (caller can dim it) rather than
 * flashing a skeleton or blanking the view.
 *
 * `loading` is derived from whether `url` matches the last URL a response
 * resolved for, rather than a separate flag flipped synchronously inside
 * the effect — every `setState` call here happens inside the fetch's async
 * callbacks, never synchronously in the effect body.
 */
export function useFetchJson<T>(url: string | null): FetchJsonState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (!url) return;

    const id = ++requestId.current;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`${url} → ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then((json) => {
        if (requestId.current !== id) return;
        setData(json);
        setError(null);
        setResolvedUrl(url);
      })
      .catch((err: unknown) => {
        if (requestId.current !== id) return;
        setError(err instanceof Error ? err.message : String(err));
        setResolvedUrl(url);
      });
  }, [url]);

  return { data, loading: url !== null && url !== resolvedUrl, error };
}
