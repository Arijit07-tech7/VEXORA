import { useCallback, useEffect, useState } from "react";
import { get } from "../lib/api";

export function useApi(path) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });

  const reload = useCallback(async () => {
    setState({ data: null, loading: true, error: "" });
    try {
      const data = await get(path);
      setState({ data, loading: false, error: "" });
    } catch (error) {
      setState({ data: null, loading: false, error: error.message });
    }
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
