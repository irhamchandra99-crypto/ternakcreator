"use client";

import { useEffect, useRef } from "react";

interface CreatorReviewVideoProps {
  src: string;
  poster?: string;
}

// A single autoplaying review clip. Muted and control-free by design: it is
// one tile in a scrolling marquee, not something the visitor operates.
export default function CreatorReviewVideo({
  src,
  poster,
}: CreatorReviewVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Only decode while the tile is on screen. With a dozen-odd clips in the
  // track, letting them all run off-screen burns CPU for nothing.
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;
        if (entry.isIntersecting) {
          // Autoplay can still be refused (e.g. a battery-saver policy);
          // there are no controls to fall back to, so just leave the poster.
          video.play().catch(() => {});
        } else if (!video.paused) {
          video.pause();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      // Suppress the right-click menu so "Save video as…" and download-manager
      // context entries never appear over the tile. See the note below: this
      // is a nuisance filter, not real protection.
      onContextMenu={(e) => e.preventDefault()}
      className="group relative w-44 sm:w-56 shrink-0 aspect-[9/16] rounded-3xl overflow-hidden bg-[#1B198F] shadow-[0_20px_50px_rgba(27,25,143,0.15)] transition-all duration-500"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        tabIndex={-1}
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        // pointer-events-none keeps every mouse event on the wrapper, so the
        // browser never treats this as a right-clicked media element.
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
      />

      {/* Subtle vignette so the tiles read as a set against the light section */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1B198F]/40 via-transparent to-black/20 pointer-events-none" />
    </div>
  );
}
