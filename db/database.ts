import { Database } from "@db/sqlite";

export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  oauth_id: string;
  oauth_type: "google" | "guest";
  created_at: string;
  updated_at: string;
}

export interface Thread {
  id: number;
  uuid: string;
  user_id: number;
  title: string;
  messages: string; // JSON string
  llm_provider: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  type: string; // "user" or model name like "gpt-4o-2024-08-06", "gemini-2.5-flash-preview-05-20"
  content: string;
  timestamp: string;
}

let db: Database;

export function initDB() {
  const dbPath = Deno.env.get("DATABASE_PATH") || "./database.db";
  
  db = new Database(dbPath);
  
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      oauth_id TEXT UNIQUE NOT NULL,
      oauth_type TEXT NOT NULL DEFAULT 'google',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create threads table
  db.exec(`
    CREATE TABLE IF NOT EXISTS threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      messages TEXT DEFAULT '[]',
      llm_provider TEXT DEFAULT 'openai',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);
  
  // Add uuid column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE threads ADD COLUMN uuid TEXT UNIQUE`);
  } catch {
    // Column already exists or other error, ignore
  }
  
  // Update existing threads that don't have UUIDs
  const threadsWithoutUuid = db.prepare("SELECT id FROM threads WHERE uuid IS NULL").all();
  for (const thread of threadsWithoutUuid) {
    const uuid = crypto.randomUUID();
    db.prepare("UPDATE threads SET uuid = ? WHERE id = ?").run(uuid, thread.id);
  }
  
  // Create trigger to update updated_at timestamp
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON users
    BEGIN
      UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `);
  
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_threads_timestamp 
    AFTER UPDATE ON threads
    BEGIN
      UPDATE threads SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `);
}

export function getDB(): Database {
  if (!db) {
    initDB();
  }
  return db;
}

// User operations
export function createUser(user: Omit<User, "id" | "created_at" | "updated_at">): User {
  const stmt = getDB().prepare(
    "INSERT INTO users (email, name, avatar_url, oauth_id, oauth_type) VALUES (?, ?, ?, ?, ?) RETURNING *"
  );
  const result = stmt.get(user.email, user.name, user.avatar_url || null, user.oauth_id, user.oauth_type);
  return result as User;
}

export function getUserByOAuthId(oauthId: string): User | null {
  const stmt = getDB().prepare("SELECT * FROM users WHERE oauth_id = ?");
  const result = stmt.get(oauthId);
  return result as User || null;
}

export function getUserByGoogleId(googleId: string): User | null {
  const stmt = getDB().prepare("SELECT * FROM users WHERE oauth_id = ? AND oauth_type = 'google'");
  const result = stmt.get(googleId);
  return result as User || null;
}

export function getUserByGuestId(guestId: string): User | null {
  const stmt = getDB().prepare("SELECT * FROM users WHERE oauth_id = ? AND oauth_type = 'guest'");
  const result = stmt.get(guestId);
  return result as User || null;
}

export function getUserById(id: number): User | null {
  const stmt = getDB().prepare("SELECT * FROM users WHERE id = ?");
  const result = stmt.get(id);
  return result as User || null;
}

// Thread operations
export function createThread(thread: Omit<Thread, "id" | "uuid" | "created_at" | "updated_at">): Thread {
  const uuid = crypto.randomUUID();
  const stmt = getDB().prepare(
    "INSERT INTO threads (uuid, user_id, title, messages, llm_provider) VALUES (?, ?, ?, ?, ?) RETURNING *"
  );
  const result = stmt.get(uuid, thread.user_id, thread.title, thread.messages, thread.llm_provider);
  return result as Thread;
}

export function getThreadsByUserId(userId: number): Thread[] {
  const stmt = getDB().prepare("SELECT * FROM threads WHERE user_id = ? ORDER BY updated_at DESC");
  const result = stmt.all(userId);
  return result as Thread[];
}

export function getThreadById(id: number): Thread | null {
  const stmt = getDB().prepare("SELECT * FROM threads WHERE id = ?");
  const result = stmt.get(id);
  return result as Thread || null;
}

export function getThreadByUuid(uuid: string): Thread | null {
  const stmt = getDB().prepare("SELECT * FROM threads WHERE uuid = ?");
  const result = stmt.get(uuid);
  return result as Thread || null;
}

export function updateThread(id: number, updates: Partial<Pick<Thread, "title" | "messages" | "llm_provider">>): void {
  const setClause = Object.keys(updates).map(key => `${key} = ?`).join(", ");
  const values = Object.values(updates);
  
  const stmt = getDB().prepare(`UPDATE threads SET ${setClause} WHERE id = ?`);
  stmt.run(...values, id);
}

export function updateThreadByUuid(uuid: string, updates: Partial<Pick<Thread, "title" | "messages" | "llm_provider">>): void {
  const setClause = Object.keys(updates).map(key => `${key} = ?`).join(", ");
  const values = Object.values(updates);
  
  const stmt = getDB().prepare(`UPDATE threads SET ${setClause} WHERE uuid = ?`);
  stmt.run(...values, uuid);
}

export function deleteThread(id: number): void {
  const stmt = getDB().prepare("DELETE FROM threads WHERE id = ?");
  stmt.run(id);
}

export function deleteThreadByUuid(uuid: string): void {
  const stmt = getDB().prepare("DELETE FROM threads WHERE uuid = ?");
  stmt.run(uuid);
}
 