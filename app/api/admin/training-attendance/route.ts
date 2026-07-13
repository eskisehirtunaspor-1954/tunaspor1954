import { NextResponse } from "next/server";

// Bu modül izolasyon gereği kaldırıldı: yoklama artık yalnızca /api/coach/*
// üzerinden, antrenörün kendi oturumuyla ve yalnızca kendi atandığı takımlar için
// yönetiliyor. Süper Admin dahil hiçbir admin-session bu veriye buradan erişemez.
function gone() {
  return NextResponse.json({ error: "Bu modül Antrenör Paneli'ne taşındı." }, { status: 410 });
}

export const GET = gone;
export const POST = gone;
export const PATCH = gone;
export const DELETE = gone;
