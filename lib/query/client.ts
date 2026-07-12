import { QueryClient } from "@tanstack/react-query";

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

interface ApiErrorBody {
  error?: string;
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  fallbackMessage = "Não foi possível concluir o pedido.",
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiRequestError(fallbackMessage, 0);
  }
  const body = (await response.json().catch(() => null)) as (T & ApiErrorBody) | null;

  if (!response.ok) {
    throw new ApiRequestError(body?.error?.trim() || fallbackMessage, response.status);
  }

  return body as T;
}

export function getRequestErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error && error.message.trim() ? error.message : fallbackMessage;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          if (error instanceof ApiRequestError && [401, 403, 404].includes(error.status)) {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
