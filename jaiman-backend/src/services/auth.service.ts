import jwt from 'jsonwebtoken';
import User from '../models/User';

export const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};
