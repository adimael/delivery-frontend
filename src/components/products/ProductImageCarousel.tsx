import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface ProductImageCarouselProps {
  images?: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
  controls?: boolean;
  loading?: "eager" | "lazy";
}

export const ProductImageCarousel = ({
  images = [],
  alt,
  className = "",
  imageClassName = "",
  controls = true,
  loading = "lazy",
}: ProductImageCarouselProps) => {
  const gallery = useMemo(
    () => Array.from(new Set(images.map(item => item.trim()).filter(Boolean))),
    [images],
  );
  const safeGallery = gallery.length > 0 ? gallery : ["/placeholder.svg"];
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => setCurrent(0), [safeGallery.join("|")]);

  useEffect(() => {
    if (safeGallery.length < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(
      () => setCurrent(index => (index + 1) % safeGallery.length),
      4_000,
    );
    return () => window.clearInterval(timer);
  }, [paused, safeGallery.length]);

  const goTo = (index: number) => {
    setCurrent((index + safeGallery.length) % safeGallery.length);
  };

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrossel"
      aria-label={`Fotos de ${alt}`}
    >
      {safeGallery.map((url, index) => (
        <img
          key={`${url}-${index}`}
          src={url}
          alt={index === 0 ? alt : `${alt}, foto ${index + 1}`}
          loading={index === 0 ? loading : "lazy"}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${imageClassName} ${
            index === current ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onError={(event) => {
            event.currentTarget.src = "/placeholder.svg";
          }}
        />
      ))}

      {safeGallery.length > 1 && (
        <>
          {controls && (
            <>
              <button
                type="button"
                className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm"
                onClick={() => goTo(current - 1)}
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm"
                onClick={() => goTo(current + 1)}
                aria-label="Próxima foto"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/45 px-2.5 py-1.5 backdrop-blur-sm">
            {safeGallery.map((_, index) => controls ? (
              <button
                key={index}
                type="button"
                onClick={() => goTo(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === current ? "w-6 bg-white" : "w-2.5 bg-white/55"
                }`}
                aria-label={`Mostrar foto ${index + 1}`}
                aria-current={index === current}
              />
            ) : (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === current ? "w-4 bg-white" : "w-1.5 bg-white/55"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
