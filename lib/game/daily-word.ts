/**
 * Daily Word Generator
 * Generates a consistent word for each day
 * Requirements: 4.2, 4.6
 */

// Word list for the puzzle game (5-letter words)
const WORD_LIST = [
  'REACT', 'CODES', 'DEBUG', 'STACK', 'QUERY',
  'ARRAY', 'LOGIC', 'BYTES', 'CACHE', 'ASYNC',
  'PROPS', 'STATE', 'HOOKS', 'ROUTE', 'BUILD',
  'TESTS', 'MERGE', 'CLONE', 'FETCH', 'PARSE',
  'TOKEN', 'ADMIN', 'LOGIN', 'USERS', 'POSTS',
  'FORUM', 'HIVES', 'VOTES', 'SHARE', 'LINKS',
  'GRAPH', 'NODES', 'EDGES', 'TREES', 'LISTS',
  'QUEUE', 'HEAPS', 'SORTS', 'FINDS', 'JOINS',
  'VIEWS', 'FORMS', 'INPUT', 'MODAL', 'TOAST',
  'BADGE', 'CARDS', 'GRIDS', 'ICONS', 'THEME',
];

/**
 * Get the word for a specific date
 * Uses a deterministic algorithm to ensure the same word for the same date
 */
export function getDailyWord(date: Date = new Date()): string {
  // Get date string in YYYY-MM-DD format
  const dateStr = date.toISOString().split('T')[0];
  
  // Simple hash function to convert date to index
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Get positive index
  const index = Math.abs(hash) % WORD_LIST.length;
  
  return WORD_LIST[index];
}

/**
 * Get today's word
 */
export function getTodaysWord(): string {
  return getDailyWord(new Date());
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatGameDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}
