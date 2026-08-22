export function formatFlatNumber(flatNumber) {
  if (!flatNumber) return 'Flat not specified';
  return `Flat ${flatNumber}`;
}

export function getCategoryIconName(category) {
  switch (category) {
    case 'Plumbing':
      return 'filter';
    case 'Electrical':
      return 'alert-triangle';
    case 'Cleaning':
      return 'trash';
    case 'Security':
      return 'user';
    case 'Lift':
      return 'chevron-down';
    case 'Parking':
      return 'file-text';
    default:
      return 'clipboard';
  }
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
