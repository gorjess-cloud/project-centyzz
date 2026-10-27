import { useEffect } from "react";

export default function useModalScrollLock(isOpen) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const bodyOverflow = document.body.style.overflow;
    const scrollContainers = document.querySelectorAll("[data-modal-scroll-container]");
    const previousOverflows = Array.from(scrollContainers, (container) => container.style.overflow);

    document.body.style.overflow = "hidden";
    scrollContainers.forEach((container) => {
      container.style.overflow = "hidden";
    });

    return () => {
      document.body.style.overflow = bodyOverflow;
      scrollContainers.forEach((container, index) => {
        container.style.overflow = previousOverflows[index];
      });
    };
  }, [isOpen]);
}
