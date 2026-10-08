"""Synthesize one narration WAV per script line with local Kokoro (ONNX).

Usage: python tools/tts.py [line-id ...]   (default: all lines)
Writes assets/voice/<id>.wav. Sentences are synthesized separately and joined
with a fixed pause, which keeps each request under Kokoro's token limit.
"""

import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parent.parent
MODEL_DIR = Path.home() / ".cache/hyperframes/tts"
MODEL_PATH = MODEL_DIR / "models/kokoro-v1.0.onnx"
VOICES_PATH = MODEL_DIR / "voices/voices-v1.0.bin"
OUT_DIR = ROOT / "assets/voice"


def split_sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.?!])\s+", text) if s.strip()]


def synthesize(model: Kokoro, text: str, cfg: dict) -> tuple[np.ndarray, int]:
    pieces, rate = [], 24000
    for sentence in split_sentences(text):
        audio, rate = model.create(sentence, voice=cfg["voice"], speed=cfg["speed"], lang=cfg["lang"])
        pieces.append(audio)
        pieces.append(np.zeros(int(rate * cfg["sentencePause"]), dtype=np.float32))
    return np.concatenate(pieces[:-1]), rate


def main() -> None:
    for path in (MODEL_PATH, VOICES_PATH):
        if not path.exists():
            sys.exit(f"missing Kokoro asset: {path}")
    cfg = json.loads((ROOT / "script.json").read_text())
    wanted = set(sys.argv[1:])
    model = Kokoro(str(MODEL_PATH), str(VOICES_PATH))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for line in cfg["lines"]:
        if wanted and line["id"] not in wanted:
            continue
        audio, rate = synthesize(model, line["text"], cfg)
        out = OUT_DIR / f"{line['id']}.wav"
        sf.write(out, audio, rate)
        print(f"{out.name}: {len(audio) / rate:.2f}s")


if __name__ == "__main__":
    main()
