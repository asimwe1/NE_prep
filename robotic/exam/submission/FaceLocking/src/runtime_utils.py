from __future__ import annotations

from pathlib import Path
from typing import Iterable, Optional

import cv2


def require_file(path: str | Path, description: str) -> Path:
    file_path = Path(path)
    if not file_path.exists():
        raise RuntimeError(
            f"Missing {description}: {file_path}\n"
            "Add the required file and try again."
        )
    return file_path


def open_camera(
    preferred_index: Optional[int] = None,
    fallback_indices: Iterable[int] = (0, 1, 2, 3),
) -> tuple[cv2.VideoCapture, int]:
    tried: list[int] = []
    candidates: list[int] = []

    if preferred_index is not None:
        candidates.append(int(preferred_index))

    for index in fallback_indices:
        idx = int(index)
        if idx not in candidates:
            candidates.append(idx)

    for index in candidates:
        tried.append(index)
        cap = cv2.VideoCapture(index)
        if cap.isOpened():
            return cap, index
        cap.release()

    raise RuntimeError(
        "Failed to open a camera. Tried indexes: "
        + ", ".join(str(i) for i in tried)
        + "."
    )
