import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AuthenticationError, AuthorizationError } from './errorHandler.js';
import { config } from '../config/index.js';

export async function requireAuth(req, _res, next) {
  try {
    const token = req.cookies?.oc_session;
    if (!token) throw new AuthenticationError();
    const claims = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(claims.sub);
    if (!user || user.status !== 'active') throw new AuthenticationError('This account is unavailable');
    if ((claims.ver ?? 0) !== (user.sessionVersion || 0)) throw new AuthenticationError('Your session has expired. Please sign in again.');
    req.user = user;
    next();
  } catch (error) { next(error); }
}

export function requireRole(...roles) {
  return (req, _res, next) => roles.includes(req.user?.role) ? next() : next(new AuthorizationError());
}
