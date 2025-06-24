import { asyncHandler } from "@utils/api/asyncHandler";
import { NextFunction, Request, Response } from "express";
import * as service from "@services/announcements/index";
import SearchEntity, { ISearchEntity } from "@models/search_entity.model";
import { SearchEntityInterface, SearchEntityType } from "src/@types/search";
import { BadRequestError } from "@errors/BadRequestError";

export const create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const data = {
    ...req.body,
    createdBy: req.user._id, // injected by auth middleware
  };

  const announcement = await service.createAnnouncement(data);
  const searchEntity:SearchEntityInterface = {
    type:"announcement",
    refId:announcement._id,
    label:announcement.title,
    tags:announcement.tags||[],

  } 
  await SearchEntity.create(searchEntity);
  res.status(201).json({ success: true, announcement });
});

export const getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const {
    page = "1",
    limit = "10",
    from,
    tags,
    isActive,
    search,
  } = req.query;

  const announcements = await service.getAllAnnouncements({
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    from: from as string,
    tags: typeof tags === "string" ? (tags as string).split(",") : undefined,
    isActive: isActive !== undefined ? isActive === "true" : undefined,
    search: search as string,
  });

  res.status(200).json({ success: true, ...announcements });
});

export const getById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const announcement = await service.getAnnouncementById(req.params.id);

  if (!announcement) return res.status(404).json({ success: false, message: "Announcement not found" });

  res.json({ success: true, announcement });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  
  const updated = await service.updateAnnouncement(req.params.id, req.body);
  if(!updated)
  {
    throw new BadRequestError("Annoucement not found");
  }
   await SearchEntity.findOneAndUpdate({refId:updated._id},{label:updated.title});
  if (!updated) return res.status(404).json({ success: false, message: "Announcement not found" });

  res.json({ success: true, updated });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await service.deleteAnnouncement(req.params.id);

  if (!deleted) return res.status(404).json({ success: false, message: "Announcement not found" });
  await SearchEntity.findOneAndDelete({refId:deleted._id});
  res.json({ success: true, message: "Deleted successfully" });
});
