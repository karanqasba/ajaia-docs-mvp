export const USERS = [
  { id: 'u_karan', name: 'Karan Qasba', email: 'karan@example.com' },
  { id: 'u_reviewer', name: 'Ajaia Reviewer', email: 'reviewer@ajaia.ai' },
  { id: 'u_teammate', name: 'Teammate User', email: 'teammate@example.com' }
];

export function getUserByEmail(email) {
  return USERS.find((user) => user.email.toLowerCase() === String(email).toLowerCase());
}
