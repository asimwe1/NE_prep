import type { DictionaryEntry } from "@/types/dictionary";
import axios from "axios";

const BASE_URL = "https://api.dictionaryapi.dev/api/v2/entries/en";

export class DictionaryApiError extends Error {
  constructor(public readonly status: number) {
    super(`Dictionary API request failed with status ${status}`);
    this.name = "DictionaryApiError";
  }
}

export async function searchWord(word: string): Promise<DictionaryEntry[]> {
  try {
    const response = await axios.get<DictionaryEntry[]>(
      `${BASE_URL}/${encodeURIComponent(word)}`,
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status) {
      throw new DictionaryApiError(error.response.status);
    }

    throw error;
  }
}
