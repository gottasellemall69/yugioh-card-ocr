export function logProgress(message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`);

  // If there's a log element, update it
  if (typeof document !== 'undefined') {
    const log = document.getElementById('progressLog');
    if (log) {
      log.innerHTML += `<div>[${timestamp}] ${message}</div>`;
      log.scrollTop = log.scrollHeight;
    }
  }
}

export function calculateSimilarity(text1, text2) {
  const words1 = text1.split(' ').filter(w => w.length > 2);
  const words2 = text2.split(' ').filter(w => w.length > 2);

  let matches = 0;
  for (const word of words1) {
    if (words2.includes(word) || words2.some(w => w.includes(word) && word.length > 3)) {
      matches++;
    }
  }

  return matches / Math.max(words1.length, 1);
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDuration(milliseconds) {
  const seconds = milliseconds / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

export function generateUniqueId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9\.\-_]/gi, '_').toLowerCase();
}

export function validateImageFile(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}`);
  }

  if (file.size > maxSize) {
    throw new Error(`File too large: ${formatFileSize(file.size)}`);
  }

  return true;
}