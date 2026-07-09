"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LoadingScreen } from "./LoadingScreen";

const MIN_LOADER_MS = 500; // çok hızlı geçişlerde bile loader'ın "titremesini" önler

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [initialLoading, setInitialLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const loaderStartRef = useRef<number>(0);
  const prevPathRef = useRef(pathname);

  // İlk sayfa yüklemesi
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  // Site içi bağlantılara tıklanınca anında loader göster — App Router'da
  // "navigasyon başladı" olayı olmadığı için bunu global bir click listener
  // ile taklit ediyoruz. Yeni pathname geldiğinde (aşağıdaki effect) kapatılır.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      if (anchor.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (href === pathname) return;
      loaderStartRef.current = Date.now();
      setRouteLoading(true);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  // Pathname değiştiğinde (yeni sayfa geldiğinde) loader'ı minimum süre sonra kapat
  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;
    if (!routeLoading) return;
    const elapsed = Date.now() - loaderStartRef.current;
    const remaining = Math.max(MIN_LOADER_MS - elapsed, 0);
    const timer = setTimeout(() => setRouteLoading(false), remaining);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const showLoader = initialLoading || routeLoading;

  return (
    <>
      <LoadingScreen show={showLoader} />
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 16, scale: 0.99, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </>
  );
}
