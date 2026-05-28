import { format, formatDistanceToNow } from 'date-fns';

export const formatDateTime = (iso: string) =>
  format(new Date(iso), 'MMM d, HH:mm');
export const formatDate = (iso: string) => format(new Date(iso), 'MMM d');
export const fromNow = (iso: string) =>
  formatDistanceToNow(new Date(iso), { addSuffix: true });
export const minutesToHM = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h ? `${h}h ${mm}m` : `${mm}m`;
};
