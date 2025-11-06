export function formatDisplayDate(date?: Date): string {
  if (!date) return 'Today';
  const today = new Date();
  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    return 'Today';
  }
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${d}-${m}-${date.getFullYear()}`;
}

export function formatMonthYearShort(date: Date): string {
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${monthNames[date.getMonth()]}-${date.getFullYear().toString().slice(-2)}`;
}
