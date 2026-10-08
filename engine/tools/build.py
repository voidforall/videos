"""Build narration + timing for an episode's clips.

Usage: .venv/bin/python engine/tools/build.py <episode-slug> [clip-id ...]

For every scene's `say` line:
  - synthesizes a Kokoro WAV (skipped when the text is unchanged)
  - transcribes it with whisper-cli for word-level timings (cached by mtime)
Then per clip writes build/<clip>/timing.json and build/<clip>/narration.wav.
"""

import json
import re
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
MODELS = Path.home() / ".cache/hyperframes"
KOKORO_MODEL = MODELS / "tts/models/kokoro-v1.0.onnx"
KOKORO_VOICES = MODELS / "tts/voices/voices-v1.0.bin"
WHISPER_MODEL = MODELS / "whisper/models/ggml-small.en.bin"
RATE = 24000
LEAD_IN = 0.4
TAIL = 1.2
DEFAULTS = {"voice": "bf_emma", "lang": "en-gb", "speed": 1.0, "sentencePause": 0.28, "lineGap": 0.6}

_kokoro = None


def kokoro():
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        for path in (KOKORO_MODEL, KOKORO_VOICES):
            if not path.exists():
                sys.exit(f"missing Kokoro asset: {path}")
        _kokoro = Kokoro(str(KOKORO_MODEL), str(KOKORO_VOICES))
    return _kokoro


def synthesize(text: str, cfg: dict, out: Path) -> None:
    sentences = [s.strip() for s in re.split(r"(?<=[.?!])\s+", text) if s.strip()]
    pieces = []
    for sentence in sentences:
        audio, rate = kokoro().create(sentence, voice=cfg["voice"], speed=cfg["speed"], lang=cfg["lang"])
        if rate != RATE:
            sys.exit(f"unexpected sample rate {rate}")
        pieces += [audio, np.zeros(int(RATE * cfg["sentencePause"]), dtype=np.float32)]
    sf.write(out, np.concatenate(pieces[:-1]), RATE, subtype="PCM_16")
    out.with_suffix(".txt").write_text(text)


def transcribe(wav: Path) -> list[dict]:
    json_path = wav.with_suffix(".json")
    if not json_path.exists() or json_path.stat().st_mtime < wav.stat().st_mtime:
        subprocess.run(["whisper-cli", "-m", str(WHISPER_MODEL), "-f", str(wav), "-ml", "1", "-sow",
                        "-oj", "-of", str(wav.with_suffix("")), "-np"], check=True, capture_output=True)
    words = []
    for seg in json.loads(json_path.read_text())["transcription"]:
        text = seg["text"].strip()
        if text:
            words.append({"text": text, "start": seg["offsets"]["from"] / 1000, "end": seg["offsets"]["to"] / 1000})
    return words


def apply_fixes(words: list[dict], fixes: list[dict]) -> list[dict]:
    """Each fix replaces a run of words. A display with at least as many words is applied word for
    word (timings kept; surplus words split the last word's time span); otherwise the run collapses into one. Matching ignores case
    and surrounding punctuation; the last matched word's trailing punctuation is kept."""
    def core(text: str) -> str:
        return re.sub(r"^[^\w+]+|[^\w+]+$", "", text).lower()

    result, i = [], 0
    while i < len(words):
        for fix in fixes:
            n = len(fix["match"])
            run = words[i:i + n]
            if len(run) == n and [core(w["text"]) for w in run] == [core(m) for m in fix["match"]]:
                tail = re.search(r"[^\w+)]*$", run[-1]["text"]).group(0)
                shown = fix["display"].split(" ")
                if len(shown) >= n:  # keep per-word timing; surplus words split the last word's span
                    result += [{**w, "text": t} for w, t in zip(run[:-1], shown[:n - 1])]
                    last, extra = run[-1], shown[n - 1:]
                    span = (last["end"] - last["start"]) / len(extra)
                    result += [{"text": t, "start": round(last["start"] + k * span, 3), "end": round(last["start"] + (k + 1) * span, 3)}
                               for k, t in enumerate(extra)]
                    result[-1]["text"] += tail
                else:
                    result.append({"text": fix["display"] + tail, "start": run[0]["start"], "end": run[-1]["end"]})
                i += n
                break
        else:
            result.append(dict(words[i]))
            i += 1
    return result


def read_pcm(path: Path) -> bytes:
    with wave.open(str(path)) as w:
        if (w.getsampwidth(), w.getnchannels(), w.getframerate()) != (2, 1, RATE):
            sys.exit(f"{path}: expected 16-bit mono {RATE} Hz")
        return w.readframes(w.getnframes())


def build_clip(clip: dict, cfg: dict, fixes: list[dict], out_dir: Path) -> None:
    voice_dir = out_dir / "voice"
    voice_dir.mkdir(parents=True, exist_ok=True)
    lines, cursor, pcm = [], LEAD_IN, []
    for i, scene in enumerate(clip["scenes"]):
        if not scene.get("say"):
            sys.exit(f"clip {clip['id']} scene {i + 1}: missing 'say'")
        wav = voice_dir / f"{i + 1:02d}.wav"
        txt = wav.with_suffix(".txt")
        if not wav.exists() or not txt.exists() or txt.read_text() != scene["say"]:
            print(f"  tts {clip['id']}/{wav.name}")
            synthesize(scene["say"], cfg, wav)
        data = read_pcm(wav)
        duration = len(data) / 2 / RATE
        words = apply_fixes(transcribe(wav), fixes)
        lines.append({"start": round(cursor, 3), "duration": round(duration, 3), "words": words})
        pcm.append((cursor, data))
        cursor += duration + scene.get("pauseAfter", cfg["lineGap"])
    total = round(cursor - clip["scenes"][-1].get("pauseAfter", cfg["lineGap"]) + TAIL, 3)

    mix = bytearray(int(total * RATE) * 2)
    for start, data in pcm:
        offset = int(start * RATE) * 2
        mix[offset:offset + len(data)] = data
    with wave.open(str(out_dir / "narration.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(bytes(mix))
    timing = {"duration": total, "fps": 30, "lines": lines}
    (out_dir / "timing.json").write_text(json.dumps(timing, indent=1))
    print(f"clip {clip['id']}: {total:.2f}s")
    for i, line in enumerate(lines):
        print(f"  {i + 1:02d} @{line['start']:6.2f}s  " + " ".join(f"{w['text']}" for w in line["words"]))


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("usage: build.py <episode-slug> [clip-id ...]")
    ep_dir = ROOT / "episodes" / sys.argv[1]
    episode = json.loads((ep_dir / "episode.json").read_text())
    cfg = {**DEFAULTS, **episode.get("voice", {})}
    global_fixes = json.loads((ROOT / "engine/caption-fixes.json").read_text())
    fixes = episode.get("captionFixes", []) + global_fixes
    wanted = set(sys.argv[2:])
    for clip in episode["clips"]:
        if not wanted or clip["id"] in wanted:
            build_clip(clip, cfg, fixes, ep_dir / "build" / clip["id"])


if __name__ == "__main__":
    main()
