// Postgres/PostgREST hataları (örn. "invalid input syntax for type uuid") admin
// kullanıcısına asla ham haliyle gösterilmemeli — burada anlaşılır Türkçe
// mesajlara çevriliyor. Bilinmeyen kodlarda bile genel/güvenli bir mesaj döner.
const FRIENDLY_ERROR_BY_CODE: Record<string, string> = {
  "22P02": "Girilen değerlerden biri geçersiz görünüyor. Lütfen alanları kontrol edip tekrar deneyin.",
  "23503": "Bu kayıt başka bir kayda bağlı olduğu ya da o kayıt silindiği için işlem tamamlanamadı.",
  "23505": "Bu kayıt zaten mevcut.",
  "23502": "Zorunlu bir alan boş bırakılmış. Lütfen tüm gerekli alanları doldurun.",
  "42501": "Bu işlemi yapmaya yetkiniz yok.",
};

export function friendlyError(error: { code?: string; message?: string }): string {
  if (error.code && FRIENDLY_ERROR_BY_CODE[error.code]) return FRIENDLY_ERROR_BY_CODE[error.code];
  return "İşlem gerçekleştirilemedi. Lütfen bilgileri kontrol edip tekrar deneyin.";
}
