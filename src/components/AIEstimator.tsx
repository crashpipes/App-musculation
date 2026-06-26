"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { apiSend } from "@/lib/fetcher";
import { haptic } from "@/lib/haptics";
import { useI18n } from "@/lib/i18n";
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
  const { t } = useI18n();
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
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    setError(null);
    setResult(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t("Caméra non disponible sur cet appareil.", "Camera not available on this device."));
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
        t(
          "Impossible d'accéder à la caméra. Autorise l'accès ou utilise l'ajout de fichier.",
          "Cannot access the camera. Allow access or use file upload."
        )
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
      setError(t("Image trop lourde (max 5 Mo).", "Image too large (max 5 MB)."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setImage({ base64: url.split(",")[1] ?? "", mime: file.type || "image/jpeg", preview: url });
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
      const res = await apiSend<{ result: EstimateResult }>("/api/ai/estimate", "POST", body);
      setResult(res.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Erreur", "Error"));
    } finally {
      setLoading(false);
    }
  }

  async function addToDay() {
    if (!result) return;
    haptic();
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
        <h2 className="font-semibold">{t("🤖 Estimer avec l'IA", "🤖 Estimate with AI")}</h2>
        <Link href="/settings" className="text-xs text-brand-600 hover:underline">
          {t("Configurer l'IA", "Configure AI")}
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
            {m === "photo" ? t("📷 Photo du plat", "📷 Meal photo") : t("⚖️ Aliments (grammes)", "⚖️ Foods (grams)")}
          </button>
        ))}
      </div>

      {mode === "photo" ? (
        <div className="space-y-3">
          {cameraOn ? (
            <div className="space-y-2">
              <video ref={videoRef} playsInline muted className="w-full max-w-sm rounded-xl bg-black" />
              <div className="flex gap-2">
                <button type="button" onClick={capturePhoto} className="btn-primary">{t("Capturer", "Capture")}</button>
                <button type="button" onClick={stopCamera} className="btn-ghost">{t("Annuler", "Cancel")}</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={startCamera} className="btn-ghost text-sm">
                  {t("📸 Prendre une photo", "📸 Take a photo")}
                </button>
                <label className="btn-ghost cursor-pointer text-sm">
                  {t("📁 Choisir un fichier", "📁 Choose a file")}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              {image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image.preview} alt={t("Aperçu du plat", "Meal preview")} className="max-h-48 rounded-xl object-cover" />
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
                placeholder={t("Aliment (ex. poulet)", "Food (e.g. chicken)")}
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
            {t("+ Ajouter un aliment", "+ Add a food")}
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
          {loading ? t("Estimation en cours…", "Estimating…") : t("Estimer", "Estimate")}
        </button>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {result && (
        <div className="rounded-xl border border-[rgb(var(--border))] p-4">
          <p className="font-semibold">{result.label}</p>
          <p className="mt-1 text-sm">
            <span className="font-bold">{result.calories}</span> kcal ·{" "}
            <span className="font-bold">{result.proteinG}</span> {t("g de protéines", "g protein")}
          </p>
          {result.note && <p className="mt-1 text-xs text-[rgb(var(--muted))]">{result.note}</p>}
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">{t("Estimation approximative.", "Approximate estimate.")}</p>
          <button onClick={addToDay} className="btn-primary mt-3">{t("Ajouter à ma journée", "Add to my day")}</button>
        </div>
      )}
    </div>
  );
}
