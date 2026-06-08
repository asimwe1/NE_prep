import type { DictionaryEntry } from "@/types/dictionary";
import axios, { isAxiosError } from "axios";

const BASE_URL = "https://api.dictionaryapi.dev/api/v2/entries/en";

export class DictionaryApiError extends Error {
  constructor(public readonly status: number) {
    super(`Dictionary API request failed with status ${status}`);
    this.name = "DictionaryApiError";
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
      throw new DictionaryApiError(error.response.status);
    }

    if (isAxiosError(error) && !error.response) {
      throw new DictionaryNetworkError();
    }

    throw new DictionaryNetworkError();
  }
}
