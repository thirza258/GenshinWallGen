export function accountKey(backendUrl, token) {
  try {
    const encoded = token
      .split(".")[1]
      .replaceAll("-", "+")
      .replaceAll("_", "/");
    const data = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)),
      ),
    );
    return `${backendUrl}:${data.sub}`;
  } catch {
    return `${backendUrl}:unknown`;
  }
}

export async function pixelRequest(
  backendUrl,
  token,
  path = "",
  { method = "GET", body, image = false } = {},
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(
      `${backendUrl.replace(/\/$/, "")}/pixel/projects${path}`,
      {
        method,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
    );
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const error = new Error(
        response.status === 401
          ? "Sign in again to save to your account."
          : typeof data.detail === "string"
            ? data.detail
            : "The account save could not complete.",
      );
      error.status = response.status;
      throw error;
    }
    return response.status === 204
      ? null
      : await (image ? response.blob() : response.json());
  } catch (error) {
    if (error.name === "AbortError")
      throw new Error(
        "The server took too long. Account autosave will retry.",
        { cause: error },
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
