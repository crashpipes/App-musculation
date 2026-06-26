"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { apiSend } from "@/lib/fetcher";
import type { EstimateResult, FoodItem } from "@/lib/ai";

type Mode = "photo" | "foods";

interface SelectedImage {
  base64: string;
  mime: string;
  preview: string;
}

export function AIEstimator({
  day,
  onAdded
}: {
  day: string;
  onAdded: () => void;
}) {
  const [mode, setMode] = useState<Mode>("photo");
  const [image, setImage] = useState<SelectedImage | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([{ name: "", grams: 100 }]);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  // Arrête la caméra si le composant est démonté.
  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    setError(null);
    setResult(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Caméra non disponible sur cet appareil.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      streamRef.current = stream;
      setCameraOn(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch {
      setError(
        "Impossible d'accéder à la caméra. Autorise l'accès ou utilise l'ajout de fichier."
      );
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setImage({ base64: dataUrl.split(",")[1] ?? "", mime: "image/jpeg", preview: dataUrl });
    stopCamera();
  }

  function onFile(file: File | null) {
    setResult(null);
    if (!file) return setImage(null);
    if (file.size > 5 * 1024 * 1024) {
      setError("Image trop lourde (max 5 Mo).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setImage({
        base64: url.split(",")[1] ?? "",
        mime: file.type || "image/jpeg",
        preview: url
      });
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  function updateFood(i: number, patch: Partial<FoodItem>) {
    setFoods((arr) => arr.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }

  async function estimate() {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const body =
        mode === "photo"
          ? { mode, imageBase64: image?.base64, mimeType: image?.mime }
          : { mode, foods: foods.filter((f) => f.name.trim() && f.grams > 0) };
      const res = await apiSend<{ result: EstimateResult }>(
        "/api/ai/estimate",
        "POST",
        body
      );
      setResult(res.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function addToDay() {
    if (!result) return;
    await apiSend("/api/meals", "POST", {
      day,
      label: result.label,
      calories: result.calories,
      proteinG: result.proteinG
    });
    setResult(null);
    setImage(null);
    setFoods([{ name: "", grams: 100 }]);
    onAdded();
  }

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">🤖 Estimer avec l&apos;IA</h2>
        <Link href="/settings" className="text-xs text-brand-600 hover:underline">
          Configurer l&apos;IA
        </Link>
      </div>

      <div className="flex gap-2">
        {(["photo", "foods"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setResult(null);
              setError(null);
              stopCamera();
            }}
            className={mode === m ? "btn-primary !py-1.5 text-xs" : "btn-ghost !py-1.5 text-xs"}
          >
            {m === "photo" ? "📷 Photo du plat" : "⚖️ Aliments (grammes)"}
          </button>
        ))}
      </div>

      {mode === "photo" ? (
        <div className="space-y-3">
          {cameraOn ? (
            <div className="space-y-2">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full max-w-sm rounded-xl bg-black"
              />
              <div className="flex gap-2">
                <button type="button" onClick={capturePhoto} className="btn-primary">
                  Capturer
                </button>
                <button type="button" onClick={stopCamera} className="btn-ghost">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={startCamera} className="btn-ghost text-sm">
                  📸 Prendre une photo
                </button>
                <label className="btn-ghost cursor-pointer text-sm">
                  📁 Choisir un fichier
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              {image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.preview}
                  alt="Aperçu du plat"
                  className="max-h-48 rounded-xl object-cover"
                />
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {foods.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="input flex-1"
                placeholder="Aliment (ex. poulet)"
                value={f.name}
                onChange={(e) => updateFood(i, { name: e.target.value })}
              />
              <input
                type="number"
                min={1}
                className="input w-24"
                value={f.grams}
                onChange={(e) => updateFood(i, { grams: Number(e.target.value) })}
              />
              <span className="text-sm text-[rgb(var(--muted))]">g</span>
              {foods.length > 1 && (
                <button
                  type="button"
                  onClick={() => setFoods((arr) => arr.filter((_, idx) => idx !== i))}
                  className="btn-ghost !px-3 text-red-500"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFoods((arr) => [...arr, { name: "", grams: 100 }])}
            className="text-sm text-brand-600 hover:underline"
          >
            + Ajouter un aliment
          </button>
        </div>
      )}

      {!cameraOn && (
        <button
          type="button"
          onClick={estimate}
          disabled={loading || (mode === "photo" && !image)}
          className="btn-primary"
        >
          {loading ? "Estimation en cours…" : "Estimer"}
        </button>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {result && (
        <div className="rounded-xl border border-[rgb(var(--border))] p-4">
          <p className="font-semibold">{result.label}</p>
          <p className="mt-1 text-sm">
            <span className="font-bold">{result.calories}</span> kcal ·{" "}
            <span className="font-bold">{result.proteinG}</span> g de protéines
          </p>
          {result.note && (
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">{result.note}</p>
          )}
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
            Estimation approximative.
          </p>
          <button onClick={addToDay} className="btn-primary mt-3">
            Ajouter à ma journée
          </button>
        </div>
      )}
    </div>
  );
}
