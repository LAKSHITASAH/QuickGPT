// web/src/auth.js
const USERS_KEY = "quickgpt_users_v1";
const SESSION_KEY = "quickgpt_session_v1";

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function signupUser({ name, email, password }) {
  const users = loadUsers();
  const e = email.trim().toLowerCase();

  if (!name.trim()) throw new Error("Name is required.");
  if (!email.trim()) throw new Error("Email is required.");
  if (!password) throw new Error("Password is required.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");

  const exists = users.some((u) => u.email === e);
  if (exists) throw new Error("This email is already registered. Please login.");

  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: e,
    password, // demo only (not secure) — stored locally
    createdAt: Date.now(),
  };

  users.push(user);
  saveUsers(users);

  const session = { userId: user.id, name: user.name, email: user.email };
  setSession(session);
  return session;
}

export function loginUser({ email, password }) {
  const users = loadUsers();
  const e = email.trim().toLowerCase();

  if (!email.trim()) throw new Error("Email is required.");
  if (!password) throw new Error("Password is required.");

  const user = users.find((u) => u.email === e);
  if (!user) throw new Error("Account not found. Please sign up first.");
  if (user.password !== password) throw new Error("Wrong password.");

  const session = { userId: user.id, name: user.name, email: user.email };
  setSession(session);
  return session;
}