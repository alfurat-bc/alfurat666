import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = process.env.DATABASE_URL || path.join(DATA_DIR, 'survey.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface User {
  id: number;
  email: string;
  password_hash: string;
  name?: string;
  role: 'super_admin' | 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Survey {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  questions: any[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface Response {
  id: number;
  survey_id: number;
  answers: string;
  ip_address?: string;
  user_agent?: string;
  submitted_at: string;
}

interface Database {
  users: User[];
  surveys: Survey[];
  responses: Response[];
  nextIds: {
    users: number;
    surveys: number;
    responses: number;
  };
}

let db: Database = {
  users: [],
  surveys: [],
  responses: [],
  nextIds: { users: 1, surveys: 1, responses: 1 }
};

// Load database from file
function loadDatabase(): void {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(data);
      console.log('Database loaded from file');
    } else {
      saveDatabase();
      console.log('New database file created');
    }
  } catch (error) {
    console.error('Error loading database:', error);
    saveDatabase();
  }
}

// Save database to file
function saveDatabase(): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

// Initialize database with default data
export function initDatabase(): void {
  loadDatabase();

  // Create default super admin if not exists
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@murdoch.edu.au';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2024!';
  
  const existingAdmin = db.users.find(u => u.email === adminEmail);
  
  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);
    db.users.push({
      id: db.nextIds.users++,
      email: adminEmail,
      password_hash: hashedPassword,
      name: 'System Administrator',
      role: 'super_admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    console.log('Super admin created:', adminEmail);
    saveDatabase();
  }

  // Create default survey if none exists
  if (db.surveys.length === 0) {
    const admin = db.users.find(u => u.email === adminEmail);
    if (admin) {
      const defaultQuestions = [
        { id: "q1", type: "radio", text: "How often do you travel during your studies?", options: ["Every week", "2-3 times per month", "Once a month", "A few times per semester", "Rarely or never"], required: true },
        { id: "q2", type: "radio", text: "What is your primary mode of transportation?", options: ["Personal car", "Public bus", "Train", "Bicycle", "Walking", "Rideshare (Uber, etc.)"], required: true },
        { id: "q3", type: "checkbox", text: "Which countries or regions have you visited while studying in Australia?", options: ["New Zealand", "Singapore", "Indonesia (Bali)", "Malaysia", "Thailand", "Japan", "South Korea", "Other"], required: true },
        { id: "q4", type: "radio", text: "What is your average travel budget per trip (AUD)?", options: ["Under $500", "$500 - $1,000", "$1,000 - $2,000", "$2,000 - $5,000", "Over $5,000"], required: true },
        { id: "q5", type: "checkbox", text: "Who do you usually travel with?", options: ["Alone", "Friends from university", "Friends from home country", "Family members", "Organized tour group"], required: true },
        { id: "q6", type: "checkbox", text: "What factors influence your travel decisions?", options: ["Cost/Budget", "Time availability", "Weather/Season", "Destination popularity", "Cultural attractions", "Adventure opportunities", "Academic schedule"], required: true },
        { id: "q7", type: "radio", text: "How do you usually book your travel arrangements?", options: ["Online travel platforms (Booking.com, Expedia, etc.)", "Travel agency", "Airline/Transport company websites", "Social media recommendations", "Direct contact with hotels/providers"], required: true },
        { id: "q8", type: "radio", text: "What type of accommodation do you prefer when traveling?", options: ["Hotel", "Hostel", "Airbnb/Vacation rental", "Student dormitory/Hostel", "Camping", "Staying with friends/family"], required: true },
        { id: "q9", type: "checkbox", text: "What activities do you enjoy most while traveling?", options: ["Sightseeing/Visiting landmarks", "Beach activities", "Hiking/Outdoor adventures", "Food and cuisine exploration", "Shopping", "Cultural experiences/Museums", "Nightlife/Entertainment"], required: true },
        { id: "q10", type: "textarea", text: "Please share any memorable travel experiences at or near Murdoch University.", placeholder: "Share your stories, favorite destinations, or travel tips for fellow international students...", required: false }
      ];

      db.surveys.push({
        id: db.nextIds.surveys++,
        user_id: admin.id,
        title: "Travel Habits of International Students at Murdoch University",
        description: "This survey investigates the travel habits and preferences of international students studying at Murdoch University.",
        questions: defaultQuestions,
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      console.log('Default survey created and published');
      saveDatabase();
    }
  }

  console.log('Database initialized successfully');
}

// Database operations
export const database = {
  // Users
  users: {
    findByEmail: (email: string): User | undefined => {
      return db.users.find(u => u.email === email);
    },
    findById: (id: number): User | undefined => {
      return db.users.find(u => u.id === id);
    },
    findAll: (): User[] => {
      return db.users;
    },
    create: (user: Omit<User, 'id' | 'created_at' | 'updated_at'>): User => {
      const newUser: User = {
        ...user,
        id: db.nextIds.users++,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.users.push(newUser);
      saveDatabase();
      return newUser;
    },
    update: (id: number, updates: Partial<User>): User | undefined => {
      const index = db.users.findIndex(u => u.id === id);
      if (index === -1) return undefined;
      db.users[index] = { ...db.users[index], ...updates, updated_at: new Date().toISOString() };
      saveDatabase();
      return db.users[index];
    },
    delete: (id: number): boolean => {
      const index = db.users.findIndex(u => u.id === id);
      if (index === -1) return false;
      db.users.splice(index, 1);
      saveDatabase();
      return true;
    }
  },

  // Surveys
  surveys: {
    findById: (id: number): Survey | undefined => {
      return db.surveys.find(s => s.id === id);
    },
    findByUserId: (userId: number): Survey[] => {
      return db.surveys.filter(s => s.user_id === userId);
    },
    findAll: (): Survey[] => {
      return db.surveys;
    },
    findPublished: (): Survey[] => {
      return db.surveys.filter(s => s.is_published);
    },
    create: (survey: Omit<Survey, 'id' | 'created_at' | 'updated_at'>): Survey => {
      const newSurvey: Survey = {
        ...survey,
        id: db.nextIds.surveys++,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.surveys.push(newSurvey);
      saveDatabase();
      return newSurvey;
    },
    update: (id: number, updates: Partial<Survey>): Survey | undefined => {
      const index = db.surveys.findIndex(s => s.id === id);
      if (index === -1) return undefined;
      db.surveys[index] = { ...db.surveys[index], ...updates, updated_at: new Date().toISOString() };
      saveDatabase();
      return db.surveys[index];
    },
    delete: (id: number): boolean => {
      const index = db.surveys.findIndex(s => s.id === id);
      if (index === -1) return false;
      db.surveys.splice(index, 1);
      // Also delete associated responses
      db.responses = db.responses.filter(r => r.survey_id !== id);
      saveDatabase();
      return true;
    },
    countByUserId: (userId: number): number => {
      return db.surveys.filter(s => s.user_id === userId).length;
    }
  },

  // Responses
  responses: {
    findBySurveyId: (surveyId: number): Response[] => {
      return db.responses.filter(r => r.survey_id === surveyId);
    },
    countBySurveyId: (surveyId: number): number => {
      return db.responses.filter(r => r.survey_id === surveyId).length;
    },
    countAll: (): number => {
      return db.responses.length;
    },
    create: (response: Omit<Response, 'id' | 'submitted_at'>): Response => {
      const newResponse: Response = {
        ...response,
        id: db.nextIds.responses++,
        submitted_at: new Date().toISOString()
      };
      db.responses.push(newResponse);
      saveDatabase();
      return newResponse;
    }
  },

  // Stats
  stats: {
    totalUsers: () => db.users.length,
    totalSurveys: () => db.surveys.length,
    publishedSurveys: () => db.surveys.filter(s => s.is_published).length,
    totalResponses: () => db.responses.length,
    topSurveys: (limit = 10) => {
      return db.surveys
        .map(s => ({ id: s.id, title: s.title, response_count: db.responses.filter(r => r.survey_id === s.id).length }))
        .sort((a, b) => b.response_count - a.response_count)
        .slice(0, limit);
    },
    userRoles: () => {
      const roles: Record<string, number> = {};
      db.users.forEach(u => {
        roles[u.role] = (roles[u.role] || 0) + 1;
      });
      return Object.entries(roles).map(([role, count]) => ({ role, count }));
    }
  }
};

export default database;
