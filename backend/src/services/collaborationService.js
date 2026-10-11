import { CollaborationRepository } from '../repositories/collaborationRepository.js';
import { MembershipRepository } from '../repositories/membershipRepository.js';
import { withTransaction } from '../config/db.js';
import { sha256 } from '../utils/crypto.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export class CollaborationService {
  // --- Announcements & Broadcasts ---

  static async getAnnouncements(clubId, targetAudience = null) {
    return CollaborationRepository.findAnnouncementsByClub(clubId, targetAudience);
  }

  static async publishAnnouncement({ clubId, authorUserId, title, content, targetAudience = 'ALL_MEMBERS' }) {
    const contentHash = sha256(`${title}:${content}:${Date.now()}`);

    return withTransaction(async (client) => {
      const announcement = await CollaborationRepository.createAnnouncement({
        clubId,
        authorUserId,
        title,
        content,
        targetAudience,
        contentHash,
      }, client);

      // Create initial append-only revision record (Revision 1)
      await CollaborationRepository.createAnnouncementRevision({
        announcementId: announcement.id,
        editorUserId: authorUserId,
        title,
        content,
        contentHash,
        revisionNumber: 1,
      }, client);

      return announcement;
    }, clubId);
  }

  static async editAnnouncement(announcementId, { editorUserId, title, content }) {
    const announcement = await CollaborationRepository.findAnnouncementById(announcementId);
    if (!announcement) throw new NotFoundError(`Announcement '${announcementId}' not found.`);

    const newContentHash = sha256(`${title}:${content}:${Date.now()}`);

    return withTransaction(async (client) => {
      const revisions = await CollaborationRepository.findRevisions(announcementId, client);
      const nextRevisionNumber = revisions.length + 1;

      // Append revision to audit history
      await CollaborationRepository.createAnnouncementRevision({
        announcementId,
        editorUserId,
        title,
        content,
        contentHash: newContentHash,
        revisionNumber: nextRevisionNumber,
      }, client);

      // Update current announcement snapshot
      const updated = await CollaborationRepository.updateAnnouncement(announcementId, {
        title,
        content,
        contentHash: newContentHash,
      }, client);

      return { announcement: updated, revisionNumber: nextRevisionNumber };
    }, announcement.club_id);
  }

  static async getAnnouncementHistory(announcementId) {
    const announcement = await CollaborationRepository.findAnnouncementById(announcementId);
    if (!announcement) throw new NotFoundError(`Announcement '${announcementId}' not found.`);

    let revisions = await CollaborationRepository.findRevisions(announcementId);
    if (!revisions || revisions.length === 0) {
      revisions = [
        {
          id: `rev-1-${announcement.id}`,
          announcement_id: announcement.id,
          revision_number: 1,
          title: announcement.title,
          content: announcement.content_markdown || announcement.content,
          content_markdown: announcement.content_markdown || announcement.content,
          edited_by_user_id: announcement.author_id,
          edited_at: announcement.published_at || announcement.created_at,
          revision_hash: announcement.audit_hash,
          editor_name: announcement.author_name,
        },
      ];
    }
    return { announcement, revisions };
  }

  static async markRead(announcementId, userId) {
    return CollaborationRepository.markRead(announcementId, userId);
  }

  // --- Kanban Tasks & Fundraisers ---

  static async getFundraisers(clubId) {
    return CollaborationRepository.findFundraisersByClub(clubId);
  }

  static async createFundraiser({ clubId, eventId = null, title, description, targetAmountCents, startDate, endDate }) {
    return CollaborationRepository.createFundraiser({
      clubId,
      eventId,
      title,
      description,
      targetAmountCents,
      startDate,
      endDate,
    });
  }

  static async getTasks({ clubId, eventId, fundraiserId, status }) {
    return CollaborationRepository.findTasks({ clubId, eventId, fundraiserId, status });
  }

  static async createTask(taskData) {
    return CollaborationRepository.createTask(taskData);
  }

  static async updateTaskStatus(taskId, status) {
    const validStatuses = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'DONE'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError(`Invalid task status '${status}'. Must be one of: ${validStatuses.join(', ')}`);
    }

    const task = await CollaborationRepository.updateTaskStatus(taskId, status);
    if (!task) throw new NotFoundError(`Task '${taskId}' not found.`);
    return task;
  }

  // --- Shifts ---

  static async getShifts(clubId, fundraiserId = null) {
    return CollaborationRepository.findShifts(clubId, fundraiserId);
  }

  static async claimShift(shiftId, userId) {
    return withTransaction(async (client) => {
      const result = await CollaborationRepository.claimShift(shiftId, userId, client);
      if (!result.success) {
        throw new BadRequestError(result.reason);
      }
      return result.shift;
    });
  }
}
