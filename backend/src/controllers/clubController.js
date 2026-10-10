import { ClubRepository } from '../repositories/clubRepository.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError } from '../utils/errors.js';

export class ClubController {
  static async listClubs(req, res, next) {
    try {
      const clubs = await ClubRepository.listActiveClubs();
      return sendSuccess(res, clubs, 'Active clubs retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getClubById(req, res, next) {
    try {
      const club = await ClubRepository.findById(req.params.id);
      if (!club) throw new NotFoundError(`Club '${req.params.id}' not found.`);
      return sendSuccess(res, club, 'Club details retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getClubBySlug(req, res, next) {
    try {
      const club = await ClubRepository.findBySlug(req.params.slug);
      if (!club) throw new NotFoundError(`Club with slug '${req.params.slug}' not found.`);
      return sendSuccess(res, club, 'Club details retrieved');
    } catch (err) {
      next(err);
    }
  }
}
