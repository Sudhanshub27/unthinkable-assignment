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

export function getPhotoUrl(photoUrl) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) return photoUrl;

  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const baseUrl = rawApiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
  const cleanPath = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`;
  return `${baseUrl}${cleanPath}`;
}

export function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateString);
}
