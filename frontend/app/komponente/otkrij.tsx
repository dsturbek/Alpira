"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export function Otkrij({
  children,
  kasni = 0,
  kao: Element = "div",
  className,
  id,
}: {
  children: ReactNode;
  kasni?: number;
  kao?: "div" | "section" | "li";
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const promatrac = new IntersectionObserver(
      (unosi) => {
        for (const unos of unosi) {
          if (unos.isIntersecting) {
            unos.target.classList.add("vidljivo");
            promatrac.unobserve(unos.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );

    promatrac.observe(element);
    return () => promatrac.disconnect();
  }, []);

  return (
    <Element

      ref={ref as never}
      id={id}
      className={className ? `otkrij ${className}` : "otkrij"}
      style={{ "--kasni": kasni } as CSSProperties}
    >
      {children}
    </Element>
  );
}
