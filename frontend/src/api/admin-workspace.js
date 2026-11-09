import { readJsonResponse } from "./client";
export async function adminWorkspaceRequest(token, path, options = {}) {
  if (!token) throw new Error("Sign in as an Admin to continue.");
  const response = await fetch("/api/admin/workspace/" + path, {
    method: options.method || "GET",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...(options.pin ? { "x-management-pin": options.pin } : {}),
    },
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  });
  const result = await readJsonResponse(response);
  if (!response.ok)
    throw new Error(
      Array.isArray(result.message)
        ? result.message.join(" ")
        : result.message || "Unable to load the salon workspace.",
    );
  return result;
}
