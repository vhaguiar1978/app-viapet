const BASE_URL = "https://v3.football.api-sports.io";

export type ApiFootballResponse<T> = {
  errors: unknown;
  results: number;
  response: T;
};

export class ApiFootballError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export function isConfigured(): boolean {
  return Boolean(process.env.API_FOOTBALL_KEY);
}

export async function apiFootball<T>(
  path: string,
  revalidateSeconds = 86400
): Promise<T | null> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return null;

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": "v3.football.api-sports.io"
      },
      next: { revalidate: revalidateSeconds }
    });

    if (!response.ok) {
      throw new ApiFootballError(
        `API-Football respondeu ${response.status} para ${path}`,
        response.status
      );
    }

    const data = (await response.json()) as ApiFootballResponse<T>;
    const errors = data.errors;
    if (errors && typeof errors === "object" && !Array.isArray(errors) && Object.keys(errors).length > 0) {
      throw new ApiFootballError(
        `API-Football erro: ${JSON.stringify(errors)}`,
        response.status
      );
    }
    return data.response;
  } catch (error) {
    if (error instanceof ApiFootballError) throw error;
    return null;
  }
}
