export const PRIORITY_RANK = { Low: 1, Medium: 2, High: 3 };
export const rankOf = (priority) => PRIORITY_RANK[priority] ?? 0;
