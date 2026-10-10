import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/userRepository.js';
import { hashPassword, comparePassword } from '../utils/crypto.js';
import { config } from '../config/env.js';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors.js';

export class AuthService {
  static async register({ email, password, fullName, studentId, role = 'STUDENT' }) {
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('An account with this email address already exists.');
    }

    if (studentId) {
      const existingStudent = await UserRepository.findByStudentId(studentId);
      if (existingStudent) {
        throw new ConflictError('A user with this Student ID is already registered.');
      }
    }

    const passwordHash = await hashPassword(password);
    const user = await UserRepository.createUser({
      email,
      passwordHash,
      fullName,
      studentId,
      role,
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    return { user, token };
  }

  static async login({ email, password }) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    delete user.password_hash;
    return { user, token };
  }
}
