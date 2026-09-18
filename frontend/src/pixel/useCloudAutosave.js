import { useCallback, useEffect, useRef, useState } from "react";
import { accountKey, pixelRequest } from "./cloud";
import { readCloudRevision, saveCloudRevision } from "./storage";
import { renderFrame } from "./render";

export default function useCloudAutosave({
  project,
  frame,
  token,
  backendUrl,
  enabled,
}) {
  const [status, setStatus] = useState({ state: "idle" });
  const [attempt, setAttempt] = useState(0);
  const inFlight = useRef(Promise.resolve()),
    pending = useRef(null);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const flush = useCallback(() => pending.current?.() || inFlight.current, []);

  useEffect(() => {
    window.addEventListener("online", retry);
    const saveWhenHidden = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", saveWhenHidden);
    return () => {
      window.removeEventListener("online", retry);
      document.removeEventListener("visibilitychange", saveWhenHidden);
    };
  }, [retry, flush]);

  useEffect(() => {
    if (!enabled || !token || !project.id) return;
    let cancelled = false,
      running = false,
      forced = false,
      timer,
      retryTimer,
      task;
    const account = accountKey(backendUrl, token);
    const report = (value) => {
      if (!cancelled) setStatus({ ...value, project, frame, account });
    };
    async function perform(force = false) {
      forced ||= force;
      if (running) return task;
      if (cancelled && !forced) return;
      running = true;
      clearTimeout(timer);
      const previous = inFlight.current;
      task = (async () => {
        try {
          await previous;
          if (cancelled && !forced) return;
          report({ state: "saving" });
          const revision = await readCloudRevision(account, project.id);
          const preview_png = renderFrame(project, frame)
            .toDataURL("image/png")
            .split(",")[1];
          const saved = await pixelRequest(
            backendUrl,
            token,
            `/${project.id}`,
            {
              method: "PUT",
              body: { project, preview_png, frame, revision },
            },
          );
          await saveCloudRevision(account, project.id, saved.revision);
          report({ state: "saved", savedAt: saved.updated_at });
        } catch (error) {
          report({
            state: "error",
            message: error.message,
            code: error.status,
          });
          if (!cancelled && ![401, 409, 413, 422].includes(error.status))
            retryTimer = setTimeout(() => perform(), 10_000);
        } finally {
          running = false;
        }
      })();
      // Serialize writes, including a final snapshot when switching projects.
      inFlight.current = task.catch(() => {});
      return task;
    }
    const saveNow = () => perform(true);
    pending.current = saveNow;
    timer = setTimeout(() => perform(), 1500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearTimeout(retryTimer);
      if (pending.current === saveNow) pending.current = null;
    };
  }, [enabled, token, backendUrl, project, frame, attempt]);

  const current =
    status.project === project &&
    status.frame === frame &&
    status.account === accountKey(backendUrl, token || "")
      ? status
      : { state: "pending" };
  return { ...current, retry, flush };
}
