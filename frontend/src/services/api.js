const BASE_URL = "https://gard-attendence.onrender.com/api";
// const BASE_URL = "http://localhost:3000/api";


export async function apiRequest(path, options = {}) {
  const { headers: customHeaders = {}, ...restOptions } = options;
  const response = await fetch(`${BASE_URL}${path}`, {
    cache: "no-store",
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...customHeaders
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}
