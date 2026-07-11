import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'assessments.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initDatabase(db);
  }
  return db;
}

function initDatabase(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      -- Location & Climate
      city TEXT NOT NULL,
      climate_zone TEXT NOT NULL,
      
      -- Building Type
      building_type TEXT NOT NULL,
      
      -- Wall Construction
      wall_base_material TEXT,
      wall_base_thickness REAL,
      wall_insulation_material TEXT,
      wall_insulation_thickness REAL,
      wall_k_value REAL,
      wall_standard_limit REAL,
      wall_compliant INTEGER,
      
      -- Roof Construction
      roof_base_material TEXT,
      roof_base_thickness REAL,
      roof_insulation_material TEXT,
      roof_insulation_thickness REAL,
      roof_k_value REAL,
      roof_standard_limit REAL,
      roof_compliant INTEGER,
      
      -- Window
      window_type TEXT,
      window_k_value REAL,
      window_standard_limit REAL,
      window_compliant INTEGER,
      
      -- Rating
      overall_rating TEXT,
      overall_score REAL,
      
      -- User Info
      phone TEXT,
      registered_at DATETIME,
      
      -- Heat Loss Distribution
      heat_loss_wall REAL,
      heat_loss_roof REAL,
      heat_loss_window REAL,
      heat_loss_ventilation REAL
    );

    CREATE INDEX IF NOT EXISTS idx_assessments_session_id ON assessments(session_id);
    CREATE INDEX IF NOT EXISTS idx_assessments_phone ON assessments(phone);
    CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at);
    CREATE INDEX IF NOT EXISTS idx_assessments_rating ON assessments(overall_rating);

    CREATE TABLE IF NOT EXISTS sms_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      verified INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON sms_codes(phone);
  `);
}

export interface AssessmentRecord {
  id?: number;
  session_id: string;
  created_at?: string;
  updated_at?: string;
  city: string;
  climate_zone: string;
  building_type: string;
  wall_base_material?: string;
  wall_base_thickness?: number;
  wall_insulation_material?: string;
  wall_insulation_thickness?: number;
  wall_k_value?: number;
  wall_standard_limit?: number;
  wall_compliant?: boolean;
  roof_base_material?: string;
  roof_base_thickness?: number;
  roof_insulation_material?: string;
  roof_insulation_thickness?: number;
  roof_k_value?: number;
  roof_standard_limit?: number;
  roof_compliant?: boolean;
  window_type?: string;
  window_k_value?: number;
  window_standard_limit?: number;
  window_compliant?: boolean;
  overall_rating?: string;
  overall_score?: number;
  phone?: string;
  registered_at?: string;
  heat_loss_wall?: number;
  heat_loss_roof?: number;
  heat_loss_window?: number;
  heat_loss_ventilation?: number;
}

export function createAssessment(record: AssessmentRecord): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO assessments (
      session_id, city, climate_zone, building_type,
      wall_base_material, wall_base_thickness, wall_insulation_material, wall_insulation_thickness,
      wall_k_value, wall_standard_limit, wall_compliant,
      roof_base_material, roof_base_thickness, roof_insulation_material, roof_insulation_thickness,
      roof_k_value, roof_standard_limit, roof_compliant,
      window_type, window_k_value, window_standard_limit, window_compliant,
      overall_rating, overall_score, phone,
      heat_loss_wall, heat_loss_roof, heat_loss_window, heat_loss_ventilation
    ) VALUES (
      @session_id, @city, @climate_zone, @building_type,
      @wall_base_material, @wall_base_thickness, @wall_insulation_material, @wall_insulation_thickness,
      @wall_k_value, @wall_standard_limit, @wall_compliant,
      @roof_base_material, @roof_base_thickness, @roof_insulation_material, @roof_insulation_thickness,
      @roof_k_value, @roof_standard_limit, @roof_compliant,
      @window_type, @window_k_value, @window_standard_limit, @window_compliant,
      @overall_rating, @overall_score, @phone,
      @heat_loss_wall, @heat_loss_roof, @heat_loss_window, @heat_loss_ventilation
    )
  `);
  
  const result = stmt.run({
    ...record,
    wall_compliant: record.wall_compliant ? 1 : 0,
    roof_compliant: record.roof_compliant ? 1 : 0,
    window_compliant: record.window_compliant ? 1 : 0,
  });
  
  return result.lastInsertRowid as number;
}

export function updateAssessmentPhone(sessionId: string, phone: string): boolean {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE assessments 
    SET phone = @phone, registered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE session_id = @session_id
  `);
  const result = stmt.run({ session_id: sessionId, phone });
  return result.changes > 0;
}

export function getAssessments(options: {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  rating?: string;
  phone?: string;
} = {}): { data: AssessmentRecord[]; total: number } {
  const db = getDb();
  const { page = 1, pageSize = 20, startDate, endDate, rating, phone } = options;
  const offset = (page - 1) * pageSize;
  
  let whereClause = 'WHERE 1=1';
  const params: Record<string, unknown> = {};
  
  if (startDate) {
    whereClause += ' AND created_at >= @startDate';
    params.startDate = startDate;
  }
  if (endDate) {
    whereClause += ' AND created_at <= @endDate';
    params.endDate = endDate;
  }
  if (rating) {
    whereClause += ' AND overall_rating = @rating';
    params.rating = rating;
  }
  if (phone) {
    whereClause += ' AND phone = @phone';
    params.phone = phone;
  }
  
  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM assessments ${whereClause}`);
  const { count } = countStmt.get(params) as { count: number };
  
  const dataStmt = db.prepare(`
    SELECT * FROM assessments ${whereClause}
    ORDER BY created_at DESC
    LIMIT @limit OFFSET @offset
  `);
  
  const data = dataStmt.all({ ...params, limit: pageSize, offset }) as AssessmentRecord[];
  
  return { data, total: count };
}

export function getRegisteredUsers(): {
  phone: string;
  registered_at: string;
  last_assessment_at: string;
  assessment_count: number;
  latest_rating: string;
}[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT 
      phone,
      MIN(registered_at) as registered_at,
      MAX(created_at) as last_assessment_at,
      COUNT(*) as assessment_count,
      (SELECT overall_rating FROM assessments a2 
       WHERE a2.phone = assessments.phone 
       ORDER BY a2.created_at DESC LIMIT 1) as latest_rating
    FROM assessments
    WHERE phone IS NOT NULL AND phone != ''
    GROUP BY phone
    ORDER BY registered_at DESC
  `);
  return stmt.all() as {
    phone: string;
    registered_at: string;
    last_assessment_at: string;
    assessment_count: number;
    latest_rating: string;
  }[];
}

export function getStats(): {
  totalAssessments: number;
  registeredUsers: number;
  todayAssessments: number;
  ratingDistribution: { rating: string; count: number }[];
  averageScore: number;
  overproofRates: {
    wall: number;
    roof: number;
    window: number;
  };
} {
  const db = getDb();
  
  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM assessments');
  const { count: totalAssessments } = totalStmt.get() as { count: number };
  
  const usersStmt = db.prepare("SELECT COUNT(DISTINCT phone) as count FROM assessments WHERE phone IS NOT NULL AND phone != ''");
  const { count: registeredUsers } = usersStmt.get() as { count: number };
  
  const todayStmt = db.prepare("SELECT COUNT(*) as count FROM assessments WHERE date(created_at) = date('now')");
  const { count: todayAssessments } = todayStmt.get() as { count: number };
  
  const ratingStmt = db.prepare(`
    SELECT overall_rating as rating, COUNT(*) as count 
    FROM assessments 
    WHERE overall_rating IS NOT NULL
    GROUP BY overall_rating
    ORDER BY overall_rating
  `);
  const ratingDistribution = ratingStmt.all() as { rating: string; count: number }[];
  
  const avgStmt = db.prepare('SELECT AVG(overall_score) as avg FROM assessments WHERE overall_score IS NOT NULL');
  const { avg: averageScore } = avgStmt.get() as { avg: number };
  
  const wallOverproofStmt = db.prepare('SELECT COUNT(*) as overproof FROM assessments WHERE wall_compliant = 0');
  const { overproof: wallOverproof } = wallOverproofStmt.get() as { overproof: number };
  
  const roofOverproofStmt = db.prepare('SELECT COUNT(*) as overproof FROM assessments WHERE roof_compliant = 0');
  const { overproof: roofOverproof } = roofOverproofStmt.get() as { overproof: number };
  
  const windowOverproofStmt = db.prepare('SELECT COUNT(*) as overproof FROM assessments WHERE window_compliant = 0');
  const { overproof: windowOverproof } = windowOverproofStmt.get() as { overproof: number };
  
  return {
    totalAssessments,
    registeredUsers,
    todayAssessments,
    ratingDistribution,
    averageScore: averageScore || 0,
    overproofRates: {
      wall: totalAssessments > 0 ? (wallOverproof / totalAssessments) * 100 : 0,
      roof: totalAssessments > 0 ? (roofOverproof / totalAssessments) * 100 : 0,
      window: totalAssessments > 0 ? (windowOverproof / totalAssessments) * 100 : 0,
    },
  };
}

export function saveSmsCode(phone: string, code: string): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO sms_codes (phone, code, expires_at) 
    VALUES (@phone, @code, datetime('now', '+5 minutes'))
  `);
  stmt.run({ phone, code });
}

export function verifySmsCode(phone: string, code: string): boolean {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT id FROM sms_codes 
    WHERE phone = @phone AND code = @code AND verified = 0 AND expires_at > datetime('now')
    ORDER BY created_at DESC LIMIT 1
  `);
  const result = stmt.get({ phone, code }) as { id: number } | undefined;
  
  if (result) {
    db.prepare('UPDATE sms_codes SET verified = 1 WHERE id = @id').run({ id: result.id });
    return true;
  }
  return false;
}
