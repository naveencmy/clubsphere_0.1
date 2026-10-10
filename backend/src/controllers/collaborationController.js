import { z } from 'zod';
import { CollaborationService } from '../services/collaborationService.js';
import { sendSuccess } from '../utils/response.js';

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  targetAudience: z.enum(['ALL_MEMBERS', 'OFFICERS_ONLY', 'PUBLIC', 'VOLUNTEERS']).default('ALL_MEMBERS'),
});

export const editAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
});

export const createFundraiserSchema = z.object({
  eventId: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  targetAmountCents: z.number().int().min(1, 'Target amount in paise is required'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const createTaskSchema = z.object({
  eventId: z.string().uuid().optional(),
  fundraiserId: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assigneeUserId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'DONE']),
});

export class CollaborationController {
  // Announcements
  static async getAnnouncements(req, res, next) {
    try {
      const audience = req.query.audience || null;
      const announcements = await CollaborationService.getAnnouncements(req.clubId, audience);
      return sendSuccess(res, announcements, 'Announcements retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async publishAnnouncement(req, res, next) {
    try {
      const announcement = await CollaborationService.publishAnnouncement({
        clubId: req.clubId,
        authorUserId: req.user.id,
        ...req.body,
      });
      return sendSuccess(res, announcement, 'Announcement published successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  static async editAnnouncement(req, res, next) {
    try {
      const result = await CollaborationService.editAnnouncement(req.params.id, {
        editorUserId: req.user.id,
        ...req.body,
      });
      return sendSuccess(res, result, 'Announcement updated and revision archived');
    } catch (err) {
      next(err);
    }
  }

  static async getAnnouncementHistory(req, res, next) {
    try {
      const history = await CollaborationService.getAnnouncementHistory(req.params.id);
      return sendSuccess(res, history, 'Announcement revision history retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async markAnnouncementRead(req, res, next) {
    try {
      await CollaborationService.markRead(req.params.id, req.user.id);
      return sendSuccess(res, null, 'Read receipt recorded');
    } catch (err) {
      next(err);
    }
  }

  // Fundraisers
  static async getFundraisers(req, res, next) {
    try {
      const fundraisers = await CollaborationService.getFundraisers(req.clubId);
      return sendSuccess(res, fundraisers, 'Fundraisers retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async createFundraiser(req, res, next) {
    try {
      const fundraiser = await CollaborationService.createFundraiser({
        clubId: req.clubId,
        ...req.body,
      });
      return sendSuccess(res, fundraiser, 'Fundraiser created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  // Tasks
  static async getTasks(req, res, next) {
    try {
      const tasks = await CollaborationService.getTasks({
        clubId: req.clubId,
        eventId: req.query.eventId || null,
        fundraiserId: req.query.fundraiserId || null,
        status: req.query.status || null,
      });
      return sendSuccess(res, tasks, 'Tasks retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async createTask(req, res, next) {
    try {
      const task = await CollaborationService.createTask({
        clubId: req.clubId,
        creatorId: req.user?.id,
        ...req.body,
      });
      return sendSuccess(res, task, 'Task created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateTaskStatus(req, res, next) {
    try {
      const task = await CollaborationService.updateTaskStatus(req.params.taskId, req.body.status);
      return sendSuccess(res, task, `Task status updated to ${req.body.status}`);
    } catch (err) {
      next(err);
    }
  }

  // Shifts
  static async getShifts(req, res, next) {
    try {
      const shifts = await CollaborationService.getShifts(req.clubId, req.query.fundraiserId || null);
      return sendSuccess(res, shifts, 'Volunteer shifts retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async claimShift(req, res, next) {
    try {
      const shift = await CollaborationService.claimShift(req.params.shiftId, req.user.id);
      return sendSuccess(res, shift, 'Shift claimed successfully');
    } catch (err) {
      next(err);
    }
  }
}
