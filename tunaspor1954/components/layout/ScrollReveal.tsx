"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

type RevealVariant = "fadeUp" | "slide" | "scale";

const VARIANTS: Record<RevealVariant, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 32 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  },
  slide: {
    hidden: { opacity: 0, x: -32 },
    show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
  },
};

// Tek bir kart/öğe için scroll'a girince oynayan animasyon. Hero DIŞINDAKİ tüm
// sayfalarda kart/bölüm sarmalamak için kullanılır. `once: true` sayesinde
// yalnızca ilk görünüşte oynar — kullanıcı yukarı/aşağı kaydırdıkça tekrar
// tetiklenip performans/dikkat dağıtıcı bir tekrar yaratmaz.
export function ScrollReveal({
  children,
  variant = "fadeUp",
  className,
  delay = 0,
}: {
  children: ReactNode;
  variant?: RevealVariant;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={VARIANTS[variant]}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

// Kart grid'lerinde "sırayla gelme" (stagger) efekti için: StaggerGrid bir
// grid/flex konteynerdir, her doğrudan çocuk StaggerItem ile sarmalanmalıdır.
export function StaggerGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  variant = "fadeUp",
}: {
  children: ReactNode;
  className?: string;
  variant?: RevealVariant;
}) {
  return (
    <motion.div className={className} variants={VARIANTS[variant]}>
      {children}
    </motion.div>
  );
}
