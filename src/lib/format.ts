const frenchDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
});

export function formatDateRange(startDate: string, endDate: string) {
  if (startDate === endDate) {
    return frenchDateFormatter.format(new Date(`${startDate}T00:00:00`));
  }

  return `${frenchDateFormatter.format(new Date(`${startDate}T00:00:00`))} - ${frenchDateFormatter.format(
    new Date(`${endDate}T00:00:00`),
  )}`;
}

export function priorityLabel(priority: string) {
  const labels: Record<string, string> = {
    high: "Haute",
    medium: "Moyenne",
    low: "Basse",
  };

  return labels[priority] ?? priority;
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    todo: "A faire",
    booked: "Reserve",
    skipped: "Ignore",
  };

  return labels[status] ?? status;
}
