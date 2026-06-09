import type { DictionaryEntry } from "@/types/dictionary";
import axios, { isAxiosError } from "axios";

const BASE_URL = "https://api.dictionaryapi.dev/api/v2/entries/en";

type DictionaryApiErrorBody = {
  title?: string;
  message?: string;
  resolution?: string;
};

function readApiErrorBody(data: unknown): DictionaryApiErrorBody | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const body = data as Record<string, unknown>;

  return {
    title: typeof body.title === "string" ? body.title : undefined,
    message: typeof body.message === "string" ? body.message : undefined,
    resolution:
      typeof body.resolution === "string" ? body.resolution : undefined,
  };
}

export class DictionaryApiError extends Error {
  readonly apiTitle?: string;
  readonly apiMessage?: string;
  readonly apiResolution?: string;

  constructor(
    public readonly status: number,
    apiBody?: DictionaryApiErrorBody | null,
  ) {
    super(`Dictionary API request failed with status ${status}`);
    this.name = "DictionaryApiError";
    this.apiTitle = apiBody?.title;
    this.apiMessage = apiBody?.message;
    this.apiResolution = apiBody?.resolution;
  }
}

export class DictionaryNetworkError extends Error {
  constructor() {
    super("Dictionary API network request failed");
    this.name = "DictionaryNetworkError";
  }
}

export class DictionaryMalformedResponseError extends Error {
  constructor() {
    super("Dictionary API returned an unexpected response shape");
    this.name = "DictionaryMalformedResponseError";
  }
}

export async function searchWord(word: string): Promise<DictionaryEntry[]> {
  try {
    const response = await axios.get<unknown>(
      `${BASE_URL}/${encodeURIComponent(word)}`,
    );

    if (!Array.isArray(response.data)) {
      throw new DictionaryMalformedResponseError();
    }

    return response.data as DictionaryEntry[];
  } catch (error) {
    if (error instanceof DictionaryMalformedResponseError) {
      throw error;
    }

    if (isAxiosError(error) && error.response?.status) {
      const apiBody = readApiErrorBody(error.response.data);
      throw new DictionaryApiError(error.response.status, apiBody);
    }

    if (isAxiosError(error) && !error.response) {
      throw new DictionaryNetworkError();
    }

    throw new DictionaryNetworkError();
  }
}
