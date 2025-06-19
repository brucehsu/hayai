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
  llm_model_version: string;
  public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  type: string; // "user" or model name like "gpt-4o-2024-08-06", "gemini-2.5-flash"
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
      llm_model_version TEXT NOT NULL DEFAULT '',
      public BOOLEAN DEFAULT FALSE,
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

  // Add public column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE threads ADD COLUMN public BOOLEAN DEFAULT FALSE`);
  } catch {
    // Column already exists or other error, ignore
  }

  // Add llm_model_version column if it doesn't exist (for existing databases)
  try {
    db.exec(
      `ALTER TABLE threads ADD COLUMN llm_model_version TEXT NOT NULL DEFAULT ''`,
    );
  } catch {
    // Column already exists or other error, ignore
  }

  // Update existing threads that don't have UUIDs
  const threadsWithoutUuid = db.prepare(
    "SELECT id FROM threads WHERE uuid IS NULL",
  ).all();
  for (const thread of threadsWithoutUuid) {
    const uuid = crypto.randomUUID();
    db.prepare("UPDATE threads SET uuid = ? WHERE id = ?").run(uuid, thread.id);
  }

  // Migration: Update llm_model_version for existing threads with empty values
  const threadsWithEmptyModelVersion = db.prepare(
    "SELECT COUNT(*) as count FROM threads WHERE llm_model_version = '' OR llm_model_version IS NULL",
  ).get() as { count: number };

  if (threadsWithEmptyModelVersion.count > 0) {
    // Update OpenAI threads
    db.prepare(
      "UPDATE threads SET llm_model_version = 'gpt-4o-2024-08-06' WHERE llm_provider = 'openai' AND (llm_model_version = '' OR llm_model_version IS NULL)",
    ).run();

    // Update Google/Gemini threads
    db.prepare(
      "UPDATE threads SET llm_provider = 'google' WHERE llm_provider = 'gemini'",
    ).run();
    db.prepare(
      "UPDATE threads SET llm_model_version = 'gemini-2.5-flash' WHERE llm_provider = 'google' AND (llm_model_version = '' OR llm_model_version IS NULL)",
    ).run();

    console.log(
      `Migrated ${threadsWithEmptyModelVersion.count} threads with llm_model_version`,
    );
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
export function createUser(
  user: Omit<User, "id" | "created_at" | "updated_at">,
): User {
  const stmt = getDB().prepare(
    "INSERT INTO users (email, name, avatar_url, oauth_id, oauth_type) VALUES (?, ?, ?, ?, ?) RETURNING *",
  );
  const result = stmt.get(
    user.email,
    user.name,
    user.avatar_url || null,
    user.oauth_id,
    user.oauth_type,
  ) as unknown;
  return result as User;
}

export function getUserByOAuthId(oauthId: string): User | null {
  const stmt = getDB().prepare("SELECT * FROM users WHERE oauth_id = ?");
  const result = stmt.get(oauthId) as unknown;
  return (result as User) || null;
}

export function getUserByGoogleId(googleId: string): User | null {
  const stmt = getDB().prepare(
    "SELECT * FROM users WHERE oauth_id = ? AND oauth_type = 'google'",
  );
  const result = stmt.get(googleId) as unknown;
  return (result as User) || null;
}

export function getUserByGuestId(guestId: string): User | null {
  const stmt = getDB().prepare(
    "SELECT * FROM users WHERE oauth_id = ? AND oauth_type = 'guest'",
  );
  const result = stmt.get(guestId) as unknown;
  return (result as User) || null;
}

export function getUserById(id: number): User | null {
  const stmt = getDB().prepare("SELECT * FROM users WHERE id = ?");
  const result = stmt.get(id) as unknown;
  return (result as User) || null;
}

// Thread operations
export function createThread(
  thread: Omit<Thread, "id" | "uuid" | "created_at" | "updated_at">,
): Thread {
  const uuid = crypto.randomUUID();
  const stmt = getDB().prepare(
    "INSERT INTO threads (uuid, user_id, title, messages, llm_provider, llm_model_version, public) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *",
  );
  const result = stmt.get(
    uuid,
    thread.user_id,
    thread.title,
    thread.messages,
    thread.llm_provider,
    thread.llm_model_version,
    thread.public || false,
  ) as unknown;
  return result as Thread;
}

export function getThreadsByUserId(userId: number): Thread[] {
  const stmt = getDB().prepare(
    "SELECT * FROM threads WHERE user_id = ? ORDER BY updated_at DESC",
  );
  const result = stmt.all(userId) as unknown;
  return result as Thread[];
}

export function getThreadById(id: number): Thread | null {
  const stmt = getDB().prepare("SELECT * FROM threads WHERE id = ?");
  const result = stmt.get(id) as unknown;
  return (result as Thread) || null;
}

export function getThreadByUuid(uuid: string): Thread | null {
  const stmt = getDB().prepare("SELECT * FROM threads WHERE uuid = ?");
  const result = stmt.get(uuid) as unknown;
  return (result as Thread) || null;
}

export function updateThread(
  id: number,
  updates: Partial<
    Pick<Thread, "title" | "messages" | "llm_provider" | "llm_model_version">
  >,
): void {
  const setClause = Object.keys(updates).map((key) => `${key} = ?`).join(", ");
  const values = Object.values(updates);

  const stmt = getDB().prepare(`UPDATE threads SET ${setClause} WHERE id = ?`);
  stmt.run(...values, id);
}

export function updateThreadByUuid(
  uuid: string,
  updates: Partial<
    Pick<Thread, "title" | "messages" | "llm_provider" | "llm_model_version">
  >,
): void {
  const setClause = Object.keys(updates).map((key) => `${key} = ?`).join(", ");
  const values = Object.values(updates);

  const stmt = getDB().prepare(
    `UPDATE threads SET ${setClause} WHERE uuid = ?`,
  );
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

export function makeThreadPublic(uuid: string): void {
  const stmt = getDB().prepare(
    "UPDATE threads SET public = TRUE WHERE uuid = ?",
  );
  stmt.run(uuid);
}

// Rate limiting functions for guest users
export function countUserMessagesForUser(userId: number): number {
  const stmt = getDB().prepare(
    "SELECT messages FROM threads WHERE user_id = ?",
  );
  const threads = stmt.all(userId) as unknown as Thread[];

  let totalUserMessages = 0;

  for (const thread of threads) {
    const messages = JSON.parse(thread.messages || "[]") as Message[];
    const userMessages = messages.filter((msg) => msg.type === "user");
    totalUserMessages += userMessages.length;
  }

  return totalUserMessages;
}
