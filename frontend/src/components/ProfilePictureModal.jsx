import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Crop, Upload, X, ZoomIn, ZoomOut } from "lucide-react";
import useModalScrollLock from "../hooks/useModalScrollLock";

export default function ProfilePictureModal({
  isOpen,
  onClose,
  currentImageUrl,
  onUpload,
  onRemove,
  isDarkMode = false,
}) {
  const [mode, setMode] = useState("view");
  const [cropSource, setCropSource] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const dragRef = useRef(null);

  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  const close = () => {
    setMode("view");
    setCropSource("");
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setError("");
    onClose?.();
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file for your profile picture.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("This image could not be opened. Try another file.");
        return;
      }
      setCropSource(reader.result);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setError("");
      setMode("crop");
    };
    reader.onerror = () => setError("This image could not be opened. Try another file.");
    reader.readAsDataURL(file);
  };

  const saveCrop = () => {
    const image = new Image();
    setIsUploading(true);
    image.onload = async () => {
      const size = 512;
      const scale = Math.max(size / image.width, size / image.height) * zoom;
      const width = image.width * scale;
      const height = image.height * scale;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) {
        setIsUploading(false);
        setError("This image could not be processed. Try another file.");
        return;
      }

      context.drawImage(
        image,
        (size - width) / 2 + offset.x * 2,
        (size - height) / 2 + offset.y * 2,
        width,
        height,
      );
      try {
        await onUpload?.(canvas.toDataURL("image/jpeg", 0.86));
        close();
      } catch (uploadError) {
        setError(uploadError.message || "The profile picture could not be saved.");
      } finally {
        setIsUploading(false);
      }
    };
    image.onerror = () => {
      setIsUploading(false);
      setError("This image could not be opened. Try another file.");
    };
    image.src = cropSource;
  };

  const surface = isDarkMode
    ? "border-[#51493B] bg-[#211F1B] text-[#F1E7C6]"
    : "border-[#E9E4D8] bg-[#FFFDF8] text-[#443523]";
  const secondaryButton = isDarkMode
    ? "border-[#51493B] hover:bg-white/5"
    : "border-[#E7DFD4] hover:bg-black/5";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-picture-modal-title"
        className={`max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border p-5 shadow-2xl sm:p-6 ${surface}`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="profile-picture-modal-title" className="text-xl">
              {mode === "view" ? "Profile Picture" : "Crop Profile Picture"}
            </h2>
            <p className="mt-1 text-xs text-[#8A8174]">
              {mode === "view"
                ? "Preview, update, re-crop, or remove your profile picture."
                : "Drag to reposition and use the slider to zoom your photo."}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className={`rounded-full p-2 ${isDarkMode ? "hover:bg-white/10" : "hover:bg-black/5"}`}
          >
            <X size={17} />
          </button>
        </div>

        {mode === "view" ? (
          <>
            <div className="mx-auto mb-6 flex h-56 w-56 items-center justify-center overflow-hidden rounded-full bg-[#F6F0E6] text-5xl font-bold text-[#C5A059]">
              {currentImageUrl ? (
                <img src={currentImageUrl} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                <Camera size={40} />
              )}
            </div>
            {error && <p role="alert" className="mb-4 text-xs text-red-600">{error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={!currentImageUrl}
                onClick={() => {
                  onRemove?.();
                  close();
                }}
                className="text-xs font-bold text-red-600 disabled:opacity-40"
              >
                Remove
              </button>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!currentImageUrl}
                  onClick={() => {
                    setCropSource(currentImageUrl);
                    setZoom(1);
                    setOffset({ x: 0, y: 0 });
                    setError("");
                    setMode("crop");
                  }}
                  className={`rounded-lg border px-4 py-2.5 text-xs font-bold disabled:opacity-40 ${secondaryButton}`}
                >
                  <Crop size={14} className="mr-1 inline" />
                  Crop
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-lg bg-[#4A3928] px-4 py-2.5 text-xs font-bold text-white"
                >
                  <Upload size={14} />
                  Upload New Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              className="mx-auto mb-5 h-64 w-64 max-w-full touch-none select-none overflow-hidden rounded-xl bg-[#F6F0E6]"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                dragRef.current = {
                  x: event.clientX,
                  y: event.clientY,
                  offset,
                };
              }}
              onPointerMove={(event) => {
                if (!dragRef.current) return;
                setOffset({
                  x: dragRef.current.offset.x + event.clientX - dragRef.current.x,
                  y: dragRef.current.offset.y + event.clientY - dragRef.current.y,
                });
              }}
              onPointerUp={() => {
                dragRef.current = null;
              }}
              onPointerCancel={() => {
                dragRef.current = null;
              }}
            >
              {cropSource && (
                <img
                  src={cropSource}
                  alt="Crop preview"
                  draggable="false"
                  className="pointer-events-none h-full w-full object-cover"
                  style={{ transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)` }}
                />
              )}
            </div>
            {error && <p role="alert" className="mb-4 text-xs text-red-600">{error}</p>}
            <div className="mb-6 flex items-center gap-3">
              <ZoomOut size={17} className="shrink-0" />
              <input
                aria-label="Zoom photo"
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-[#4A3928]"
              />
              <ZoomIn size={17} className="shrink-0" />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode("view");
                  setCropSource("");
                  setError("");
                }}
                className={`rounded-lg border px-4 py-2.5 text-xs font-bold ${secondaryButton}`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUploading}
                onClick={saveCrop}
                className="rounded-lg bg-[#4A3928] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {isUploading ? "Saving…" : "Done"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>,
    document.body,
  );
}
