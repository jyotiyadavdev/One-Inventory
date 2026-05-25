import { useEffect, useState } from "react";
import { subscribeMockStore } from "./mockApi";
import { getMockState } from "./mockStore";

export function useMockStoreSnapshot(selector) {
  const [snap, setSnap] = useState(() => selector(getMockState()));

  useEffect(() => {
    return subscribeMockStore(() => {
      setSnap(selector(getMockState()));
    });
  }, [selector]);

  return snap;
}
