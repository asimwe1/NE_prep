import {
  DictionaryApiError,
  DictionaryMalformedResponseError,
  DictionaryNetworkError,
} from "@/services/dictionary-api";

export type SearchFeedbackKind = "validation" | "not-found" | "network" | "service";

export type SearchFeedback = {
  kind: SearchFeedbackKind;
  title: string;
  message: string;
  hint?: string;
};

export const EMPTY_SEARCH_FEEDBACK: SearchFeedback = {
  kind: "validation",
  title: "Enter a word",
  message: "Type an English word above to look it up.",
};

export function getSearchFeedback(
  error: unknown,
  searchedWord?: string,
): SearchFeedback {
  if (error instanceof DictionaryApiError && error.status === 404) {
    const wordLabel = searchedWord ? ` “${searchedWord}”` : " that word";

    return {
      kind: "not-found",
      title: error.apiTitle ?? "No definitions found",
      message:
        error.apiMessage ??
        `We couldn't find definitions for${wordLabel}.`,
      hint:
        error.apiResolution ??
        "Check the spelling or try searching for a similar word.",
    };
  }

  if (error instanceof DictionaryNetworkError) {
    return {
      kind: "network",
      title: "No connection",
      message: "We couldn't reach the dictionary right now.",
      hint: "Check your internet connection and try again.",
    };
  }

  if (error instanceof DictionaryMalformedResponseError) {
    return {
      kind: "service",
      title: "Unexpected response",
      message: "The dictionary sent back data we couldn't read.",
      hint: "Try another word or search again in a moment.",
    };
  }

  if (error instanceof DictionaryApiError) {
    return {
      kind: "service",
      title: "Dictionary unavailable",
      message: "The dictionary couldn't complete your search.",
      hint: "Please try again in a moment.",
    };
  }

  return {
    kind: "service",
    title: "Something went wrong",
    message: "Your search didn't go through.",
    hint: "Please try again.",
  };
}
