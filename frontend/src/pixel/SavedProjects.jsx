import { useEffect, useState } from "react";
import { Modal } from "./Dialogs";
import { accountKey, pixelRequest } from "./cloud";
import { saveCloudRevision } from "./storage";
import { validateProject } from "./model";
import { download, fileName } from "./export";

export default function SavedProjects({
  backendUrl,
  token,
  currentId,
  onOpen,
  onBeforeOpen,
  onClose,
  onLogin,
}) {
  const [rows, setRows] = useState([]),
    [next, setNext] = useState(null);
  const [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0),
    [deleting, setDeleting] = useState(null);
  useEffect(() => {
    let cancelled = false;
    pixelRequest(backendUrl, token)
      .then((data) => {
        if (!cancelled) {
          setRows(data.projects);
          setNext(data.next_offset);
          setBusy(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
          setBusy(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [backendUrl, token, refresh]);
  async function action(run) {
    setBusy(true);
    setError("");
    try {
      await run();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function open(row) {
    action(async () => {
      await onBeforeOpen();
      const result = await pixelRequest(backendUrl, token, `/${row.id}`);
      const project = validateProject(result.project);
      await saveCloudRevision(
        accountKey(backendUrl, token),
        row.id,
        result.revision,
      );
      onOpen(project, result.preview_frame);
      onClose();
    });
  }
  return (
    <Modal
      title="Your saved projects"
      onClose={onClose}
      className="ps-saved-dialog"
    >
      <p className="ps-muted">
        Your account keeps the latest editable project and PNG result. Open a
        project to keep creating on this device.
      </p>
      <div className="ps-inline-actions">
        <button
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setError("");
            setRefresh((n) => n + 1);
          }}
        >
          Refresh
        </button>
        <button onClick={onLogin}>Switch account</button>
      </div>
      {error && (
        <p className="ps-error" role="alert">
          {error}
        </p>
      )}
      {busy && <p role="status">Loading saved work…</p>}
      {!busy && !error && !rows.length && (
        <p className="ps-dialog-note">
          No saved projects yet. Your current project will appear after account
          autosave finishes.
        </p>
      )}
      <div className="ps-saved-grid">
        {rows.map((row) => (
          <article className="ps-saved-card" key={row.id}>
            <img
              src={`data:image/png;base64,${row.thumbnail}`}
              alt={`Preview of ${row.name}`}
              width={128}
              height={128}
            />
            <h3>{row.name}</h3>
            <p>
              {row.width} × {row.height} · {row.frame_count}{" "}
              {row.frame_count === 1 ? "frame" : "frames"}
            </p>
            <time dateTime={row.updated_at}>
              {new Date(row.updated_at).toLocaleString()}
            </time>
            <div className="ps-inline-actions">
              <button
                className="ps-primary"
                disabled={busy}
                onClick={() => open(row)}
              >
                Open project
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  action(async () =>
                    download(
                      await pixelRequest(
                        backendUrl,
                        token,
                        `/${row.id}/image`,
                        { image: true },
                      ),
                      `${fileName(row.name)}.png`,
                    ),
                  )
                }
              >
                ↓ PNG
              </button>
            </div>
            {deleting === row.id ? (
              <div className="ps-saved-delete">
                <p>Delete this saved copy from your account?</p>
                <button
                  disabled={busy}
                  onClick={() =>
                    action(async () => {
                      await pixelRequest(
                        backendUrl,
                        token,
                        `/${row.id}?revision=${row.revision}`,
                        { method: "DELETE" },
                      );
                      setRows((items) =>
                        items.filter((item) => item.id !== row.id),
                      );
                      setDeleting(null);
                    })
                  }
                >
                  Confirm delete
                </button>
                <button onClick={() => setDeleting(null)}>Cancel</button>
              </div>
            ) : (
              <button
                className="ps-saved-remove"
                disabled={busy || row.id === currentId}
                title={
                  row.id === currentId
                    ? "Open another project before deleting this account copy."
                    : "Delete saved copy"
                }
                onClick={() => setDeleting(row.id)}
              >
                {row.id === currentId ? "Current project" : "Delete saved copy"}
              </button>
            )}
          </article>
        ))}
      </div>
      {next !== null && (
        <button
          className="ps-wide"
          disabled={busy}
          onClick={() =>
            action(async () => {
              const result = await pixelRequest(
                backendUrl,
                token,
                `?offset=${next}`,
              );
              setRows((items) => [...items, ...result.projects]);
              setNext(result.next_offset);
            })
          }
        >
          Load more projects
        </button>
      )}
    </Modal>
  );
}
