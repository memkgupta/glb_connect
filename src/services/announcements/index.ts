import Announcement from "@models/announcement.model";
import { Types } from "mongoose";

export const createAnnouncement = async (data: any) => {
  return await Announcement.create(data);
};

interface GetAnnouncementsOptions {
  page?: number;
  limit?: number;
  from?: string; // e.g. 'Admin', 'HOD', etc.
  tags?: string[];
  search?: string; // for title or description
  isActive?: boolean;
}

/**
 * Paginated and filtered fetch
 */
export const getAllAnnouncements = async ({
  page = 1,
  limit = 10,
  from,
  tags,
  search,
  isActive,
}: GetAnnouncementsOptions = {}) => {
  const query: any = {};

  if (from) query.from = from;
  if (isActive !== undefined) query.isActive = isActive;
  if (tags && tags.length > 0) query.tags = { $in: tags };
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [announcements, total] = await Promise.all([
    Announcement.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Announcement.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    announcements,
    page,
    limit,
    total,
    totalPages,
  };
};

export const getAnnouncementById = async (id: string) => {
  return await Announcement.findById(id);
};

export const updateAnnouncement = async (id: string, updates: any) => {
  return await Announcement.findByIdAndUpdate(id, updates, { new: true });
};

export const deleteAnnouncement = async (id: string) => {
  return await Announcement.findByIdAndDelete(id);
};
