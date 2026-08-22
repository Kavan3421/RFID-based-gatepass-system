import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabaseServer } from './supabase/server';
import dbConnect from './dbConnect';
import User from './models/User';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT || 'ssip@hacking_default_secret_key';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Multi-tenant Server-side Authorization Middleware
 * Validates JWT Token, Role, and Tenant (Organization ID)
 */
export async function verifyTenantAuth(req, allowedRoles = []) {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Check cookies if present
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/qrgp_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    throw { status: 401, message: 'Authentication required' };
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId || !decoded.organizationId) {
    throw { status: 403, message: 'Invalid or expired session token' };
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
    throw { status: 403, message: 'Forbidden: Insufficient privileges for this role' };
  }

  return {
    userId: decoded.userId,
    organizationId: decoded.organizationId,
    organizationCode: decoded.organizationCode,
    role: decoded.role,
    username: decoded.username,
  };
}

/**
 * Legacy Mongo / RFID Compatibility verification functions
 */
export async function verifyAuthToken(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw { status: 401, message: 'You are not authenticated!' };

  const token = authHeader.split(' ')[1];
  if (!token) throw { status: 401, message: 'You are not authenticated!' };

  let decoded = verifyToken(token);
  if (!decoded || !decoded.id) throw { status: 403, message: 'Invalid token!' };

  await dbConnect();
  const user = await User.findById(decoded.id);
  if (!user) throw { status: 404, message: 'User not found!' };

  return user.toObject();
}

export async function verifyAdminAuthToken(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw { status: 401, message: 'You are not authenticated!' };

  const token = authHeader.split(' ')[1];
  if (!token) throw { status: 401, message: 'You are not authenticated!' };

  let decoded = verifyToken(token);
  if (!decoded || !decoded.id) throw { status: 403, message: 'Invalid token!' };

  await dbConnect();
  const db = mongoose.connection.useDb('test');
  const adminCollection = db.collection('admin');

  const admin = await adminCollection.findOne({ _id: new mongoose.Types.ObjectId(decoded.id) });
  if (!admin) throw { status: 404, message: 'Admin not found!' };

  return admin;
}
