// Trích thông điệp lỗi từ response của axios theo định dạng API { error: { message } },
// trả về `fallback` nếu không có.
export function getApiErrorMessage(e: unknown, fallback: string): string {
  const message = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data
    ?.error?.message;
  return message ?? fallback;
}
