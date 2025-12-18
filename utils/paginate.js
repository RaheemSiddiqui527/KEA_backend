export const paginate = (query, { page = 1, limit = 20 } = {}) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  return query.skip((p - 1) * l).limit(l);
};
