export function getPageNumbers(page, totalPages) {
  const last = Math.max(1, totalPages);
  const current = Math.max(1, Math.min(page, last));
  if (last <= 7) return Array.from({ length: last }, (_, index) => index + 1);
  const start = Math.max(2, Math.min(current - 1, last - 4));
  const end = Math.min(last - 1, Math.max(current + 1, 5));
  return [1, ...(start > 2 ? ["start-gap"] : []),
    ...Array.from({ length: end - start + 1 }, (_, index) => start + index),
    ...(end < last - 1 ? ["end-gap"] : []), last];
}
