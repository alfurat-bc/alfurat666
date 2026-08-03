import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import database from '../db.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'murdoch-survey-secret-key';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    name: string;
  };
}

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
  name: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// Middleware: Authenticate any logged-in user
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  const user = database.users.findById(payload.id);

  if (!user || !user.is_active) {
    res.status(401).json({ error: 'User not found or inactive' });
    return;
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name || '',
  };

  next();
}

// Middleware: Authenticate super admin only
export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'super_admin') {
    res.status(403).json({ error: 'Super admin access required' });
    return;
  }
  next();
}

// Middleware: Authenticate admin or super admin
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || !['super_admin', 'admin'].includes(req.user.role)) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

// Middleware: Authenticate regular user (can also be admin/super_admin)
export function requireUser(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}

import dotenv from 'dotenv';
