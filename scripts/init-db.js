import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../data/survey.db');
const dataDir = path.dirname(DB_PATH);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log('Initializing database at:', DB_PATH);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('Creating tables...');

// Users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user' CHECK(role IN ('super_admin', 'admin', 'user')),
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Surveys table
db.exec(`
  CREATE TABLE IF NOT EXISTS surveys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    questions TEXT NOT NULL DEFAULT '[]',
    is_published INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Responses table
db.exec(`
  CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    survey_id INTEGER NOT NULL,
    answers TEXT NOT NULL DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
  )
`);

// Create indexes
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_surveys_user_id ON surveys(user_id);
  CREATE INDEX IF NOT EXISTS idx_surveys_is_published ON surveys(is_published);
  CREATE INDEX IF NOT EXISTS idx_responses_survey_id ON responses(survey_id);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`);

console.log('Tables created successfully');

// Create default super admin
const adminEmail = 'admin@murdoch.edu.au';
const adminPassword = 'Admin@2024!';

const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);

if (!existingAdmin) {
  const hashedPassword = bcrypt.hashSync(adminPassword, 10);
  db.prepare(`
    INSERT INTO users (email, password_hash, name, role)
    VALUES (?, ?, ?, 'super_admin')
  `).run(adminEmail, hashedPassword, 'System Administrator');
  console.log('Super admin created:', adminEmail);
  console.log('Password:', adminPassword);
} else {
  console.log('Admin already exists');
}

// Create default survey template
const existingSurvey = db.prepare('SELECT id FROM surveys LIMIT 1').get();

if (!existingSurvey) {
  const defaultQuestions = [
    {
      id: "q1",
      type: "radio",
      text: "How often do you travel during your studies?",
      options: ["Every week", "2-3 times per month", "Once a month", "A few times per semester", "Rarely or never"],
      required: true
    },
    {
      id: "q2",
      type: "radio",
      text: "What is your primary mode of transportation?",
      options: ["Personal car", "Public bus", "Train", "Bicycle", "Walking", "Rideshare (Uber, etc.)"],
      required: true
    },
    {
      id: "q3",
      type: "checkbox",
      text: "Which countries or regions have you visited while studying in Australia?",
      options: ["New Zealand", "Singapore", "Indonesia (Bali)", "Malaysia", "Thailand", "Japan", "South Korea", "Other"],
      required: true
    },
    {
      id: "q4",
      type: "radio",
      text: "What is your average travel budget per trip (AUD)?",
      options: ["Under $500", "$500 - $1,000", "$1,000 - $2,000", "$2,000 - $5,000", "Over $5,000"],
      required: true
    },
    {
      id: "q5",
      type: "checkbox",
      text: "Who do you usually travel with?",
      options: ["Alone", "Friends from university", "Friends from home country", "Family members", "Organized tour group"],
      required: true
    },
    {
      id: "q6",
      type: "checkbox",
      text: "What factors influence your travel decisions?",
      options: ["Cost/Budget", "Time availability", "Weather/Season", "Destination popularity", "Cultural attractions", "Adventure opportunities", "Academic schedule"],
      required: true
    },
    {
      id: "q7",
      type: "radio",
      text: "How do you usually book your travel arrangements?",
      options: ["Online travel platforms (Booking.com, Expedia, etc.)", "Travel agency", "Airline/Transport company websites", "Social media recommendations", "Direct contact with hotels/providers"],
      required: true
    },
    {
      id: "q8",
      type: "radio",
      text: "What type of accommodation do you prefer when traveling?",
      options: ["Hotel", "Hostel", "Airbnb/ Vacation rental", "Student dormitory/Hostel", "Camping", "Staying with friends/family"],
      required: true
    },
    {
      id: "q9",
      type: "checkbox",
      text: "What activities do you enjoy most while traveling?",
      options: ["Sightseeing/Visiting landmarks", "Beach activities", "Hiking/Outdoor adventures", "Food and cuisine exploration", "Shopping", "Cultural experiences/Museums", "Nightlife/Entertainment"],
      required: true
    },
    {
      id: "q10",
      type: "textarea",
      text: "Please share any memorable travel experiences at or near Murdoch University.",
      placeholder: "Share your stories, favorite destinations, or travel tips for fellow international students...",
      required: false
    }
  ];

  const adminId = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail) as any;

  db.prepare(`
    INSERT INTO surveys (user_id, title, description, questions, is_published)
    VALUES (?, ?, ?, ?, 1)
  `).run(
    adminId.id,
    "Travel Habits of International Students at Murdoch University",
    "This survey investigates the travel habits and preferences of international students studying at Murdoch University.",
    JSON.stringify(defaultQuestions)
  );

  console.log('Default survey template created and published');
} else {
  console.log('Survey already exists');
}

console.log('Database initialization complete!');

db.close();
