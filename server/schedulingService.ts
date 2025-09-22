import {
  format,
  addDays,
  addHours,
  addMinutes,
  isBefore,
  isAfter,
  isEqual,
  startOfDay,
  endOfDay,
  parseISO,
  differenceInMinutes,
  isSameDay,
} from "date-fns";
// NOTE: `date-fns-tz` has an exports mismatch in some environments which can
// crash the server at startup. For now provide lightweight synchronous stubs
// so the server can boot for local smoke-testing. These stubs produce
// approximate behavior and should be replaced with the real library import
// (or a proper ESM/CJS interop) for production.
const utcToZonedTime = (date: Date, _tz: string) => {
  return new Date(date);
};

const zonedTimeToUtc = (isoLike: string, _tz: string) => {
  // Try to parse an ISO-like string; fall back to Date constructor.
  // This will treat the input as local/UTC depending on the string.
  return new Date(isoLike);
};
import {
  type TimeSlot,
  type InsertTimeSlot,
  type ScheduleConflict,
  type InsertScheduleConflict,
  type InsertScheduleAuditLog,
  type WorkOrder,
  type InsertWorkOrder,
  type ContractorProfile,
} from "@shared/schema";
import { getStorageRepositories } from "./storage/repositories";
import { getStorage } from "./storage";
import type { IStorage } from "./storage";

// ===========================
// INTERNAL TYPES (non-breaking)
// ===========================

type ManagerSettings = {
  homeManagerId: string;
  maxDailyJobs: number;
  serviceWindowStart: string; // "08:00"
  serviceWindowEnd: string; // "18:00"
  bufferMinutes: number; // default 20
};

type ManagerTimeBlock = {
  id: string;
  homeManagerId: string;
  blockType: "BLACKOUT" | "TIME_OFF" | "TRAINING" | "MAINTENANCE";
  startAt: Date;
  endAt: Date;
  reason: string | null;
};

type SlotDuration = InsertTimeSlot["duration"];
type SlotType = InsertTimeSlot["slotType"];
type ConflictSeverity = InsertScheduleConflict["conflictType"];

// ===========================
// SCHEDULING SERVICE TYPES
// ===========================

export interface AvailabilityRequest {
  contractorId: string;
  startDate: Date;
  endDate: Date;
  timezone: string;
  slotDuration?: SlotDuration; // "1_hour", "2_hour", "4_hour", "8_hour"
  slotType?: SlotType; // "standard", "emergency", "consultation"
}

export interface SlotBookingRequest {
  contractorId: string;
  slotId?: string;
  startTime: Date;
  endTime: Date;
  slotType: SlotType;
  workOrderId: string;
  adminOverride?: boolean;
  overrideReason?: string;
  overrideBy?: string;
}

export interface AdminSlotOverrideRequest {
  contractorId: string;
  startTime: Date;
  endTime: Date;
  workOrderId: string;
  overrideReason: string;
  adminUserId: string;
}

export interface ConflictDetails {
  severity: ConflictSeverity;
  conflictingSlots: TimeSlot[];
  conflictingWorkOrders: WorkOrder[];
  description: string;
  canOverride: boolean;
}

export interface SchedulingResult {
  success: boolean;
  conflicts: ConflictDetails[];
  booking?: {
    slotId: string;
    workOrderId: string;
    startTime: Date;
    endTime: Date;
  };
  alternatives?: TimeSlot[];
}

export interface ContractorWorkingHours {
  monday?: { start: string; end: string };
  tuesday?: { start: string; end: string };
  wednesday?: { start: string; end: string };
  thursday?: { start: string; end: string };
  friday?: { start: string; end: string };
  saturday?: { start: string; end: string };
  sunday?: { start: string; end: string };
  timezone: string;
  breaks?: Array<{ start: string; end: string }>;
}

// ===========================
// SCHEDULING SERVICE CLASS
// ===========================

export class SchedulingService {
  private defaultTimezone = "America/New_York";
  // Business rules
  private TURNOVER_BUFFER_MINUTES = 20; // no job within +/- 20 mins
  private TRAVEL_MINUTES = 20; // naive travel pad if different address
  private cachedStorage: IStorage | null = null;

  private async resolveRepositories() {
    return getStorageRepositories();
  }

  private async coreStorage(): Promise<IStorage> {
    if (!this.cachedStorage) {
      this.cachedStorage = await getStorage();
    }
    return this.cachedStorage;
  }

  private async schedulingStorage() {
    const repos = await this.resolveRepositories();
    return {
      getContractorProfile: (id: string) => repos.contractors.getContractorProfile(id),
      getContractorTimeSlots: (contractorId: string, start?: Date, end?: Date) =>
        repos.schedulingSlots.getContractorTimeSlots(contractorId, start, end),
      getWorkOrdersByContractor: (contractorId: string) =>
        repos.workOrders.getWorkOrdersByContractor(contractorId),
      getOverlappingTimeSlots: (contractorId: string, start: Date, end: Date) =>
        repos.schedulingSlots.getOverlappingTimeSlots(contractorId, start, end),
      getOverlappingWorkOrders: (contractorId: string, start: Date, end: Date) =>
        repos.schedulingWorkOrders.getOverlappingWorkOrders(contractorId, start, end),
      getWorkOrdersByDateRange: (contractorId: string, start: Date, end: Date) =>
        repos.schedulingWorkOrders.getWorkOrdersByDateRange(contractorId, start, end),
      createTimeSlot: (slot: InsertTimeSlot) => repos.schedulingSlots.createTimeSlot(slot),
      updateTimeSlot: (id: string, updates: Partial<InsertTimeSlot>) =>
        repos.schedulingSlots.updateTimeSlot(id, updates),
      getTimeSlot: (id: string) => repos.schedulingSlots.getTimeSlot(id),
      createScheduleConflict: (conflict: InsertScheduleConflict) =>
        repos.schedulingConflicts.createScheduleConflict(conflict),
      createScheduleAuditLog: (entry: InsertScheduleAuditLog) =>
        repos.schedulingAudit.createScheduleAuditLog(entry),
      getServiceRequest: (id: string) => repos.serviceRequests.getServiceRequest(id),
      getWorkOrder: (id: string) => repos.workOrders.getWorkOrder(id),
      updateWorkOrder: (id: string, updates: Partial<InsertWorkOrder>) =>
        repos.workOrders.updateWorkOrder(id, updates),
      getWorkOrders: () => repos.workOrders.getWorkOrders(),
    };
  }

  /**
   * Generate available time slots for a contractor based on their working hours and existing bookings
   */
  async generateAvailableSlots(
    request: AvailabilityRequest,
  ): Promise<TimeSlot[]> {
    const storage = await this.schedulingStorage();
    const contractor = await storage.getContractorProfile(request.contractorId);
    if (!contractor) {
      throw new Error(`Contractor ${request.contractorId} not found`);
    }

    const managerId = await this.resolveManagerIdForContractor(contractor);
    const mgrSettings = await this.getManagerSettings(managerId);

    // Get contractor's working hours from profile
    const workingHours = this.parseContractorAvailability(
      contractor,
      mgrSettings,
    );

    // Get existing bookings and blocked slots
    const existingSlots = await storage.getContractorTimeSlots(
      request.contractorId,
      request.startDate,
      request.endDate,
    );
    const existingWorkOrders = await storage.getWorkOrdersByContractor(
      request.contractorId,
    );

    const rangeStart = startOfDay(new Date(request.startDate));
    const rangeEnd = endOfDay(new Date(request.endDate));

    // Manager blocks (blackouts, time off)
    const managerBlocks = await this.getManagerTimeBlocks(
      managerId,
      rangeStart,
      rangeEnd,
    );

    const availableSlots: InsertTimeSlot[] = [];
    const slotDuration = this.getSlotDurationMinutes(
      request.slotDuration ?? "2_hour",
    );
    const slotType: SlotType = request.slotType ?? "standard";
    const timezone = workingHours.timezone ?? request.timezone ?? this.defaultTimezone;

    // Generate slots for each day in the range
    let currentDate = rangeStart;
    while (currentDate <= rangeEnd) {
      // Capacity gate: if day already at or over capacity, skip generating slots for the day
      const capacityReached = await this.isDailyCapacityReached(
        managerId,
        currentDate,
        mgrSettings,
      );
      if (!capacityReached) {
        const daySlots = this.generateSlotsForDay(
          currentDate,
          workingHours,
          slotDuration,
          mgrSettings.bufferMinutes ?? this.TURNOVER_BUFFER_MINUTES,
          request.contractorId,
          slotType,
          timezone,
          managerBlocks,
        );

        // Filter out conflicts with existing reservations/work orders
        const nonConflictingSlots = this.filterConflictingSlots(
          daySlots,
          existingSlots,
          existingWorkOrders,
          mgrSettings,
        );

        availableSlots.push(...nonConflictingSlots);
      }
      currentDate = addDays(currentDate, 1);
    }

    // Persist each slot to DB so they have durable IDs
    const persistedSlots: TimeSlot[] = [];
    for (const slotData of availableSlots) {
      try {
        const existingSlot = await this.findExistingSlot(
          request.contractorId,
          slotData.startTime,
          slotData.endTime,
        );

        if (!existingSlot) {
          const persistedSlot = await storage.createTimeSlot(slotData);
          persistedSlots.push(persistedSlot);
        } else {
          persistedSlots.push(existingSlot);
        }
      } catch (error) {
        console.error("Error persisting slot:", error);
      }
    }

    return persistedSlots;
  }

  /**
   * Detect scheduling conflicts for a booking request
   */
  async detectConflicts(
    request: SlotBookingRequest,
  ): Promise<ConflictDetails[]> {
    const storage = await this.schedulingStorage();
    const conflicts: ConflictDetails[] = [];

    const contractor = await storage.getContractorProfile(request.contractorId);
    const managerId = await this.resolveManagerIdForContractor(contractor);
    const mgrSettings = await this.getManagerSettings(managerId);

    // Expand the overlap window by buffer minutes to enforce turnover at the app layer
    const startWithBuffer = addMinutes(
      request.startTime,
      -(mgrSettings.bufferMinutes ?? this.TURNOVER_BUFFER_MINUTES),
    );
    const endWithBuffer = addMinutes(
      request.endTime,
      +(mgrSettings.bufferMinutes ?? this.TURNOVER_BUFFER_MINUTES),
    );

    // Overlapping time slots and work orders, using buffer-expanded window
    const overlappingSlots = await storage.getOverlappingTimeSlots(
      request.contractorId,
      startWithBuffer,
      endWithBuffer,
    );

    const overlappingWorkOrders = await storage.getOverlappingWorkOrders(
      request.contractorId,
      startWithBuffer,
      endWithBuffer,
    );

    if (overlappingSlots.length > 0 || overlappingWorkOrders.length > 0) {
      conflicts.push({
        severity: "hard",
        conflictingSlots: overlappingSlots,
        conflictingWorkOrders: overlappingWorkOrders,
        description: `Conflicts within ${mgrSettings.bufferMinutes ?? this.TURNOVER_BUFFER_MINUTES} min buffer (${overlappingSlots.length} slots, ${overlappingWorkOrders.length} work orders).`,
        canOverride: true,
      });
    }

    // Service window policy
    const outside = await this.isOutsideServiceWindow(
      managerId,
      request.startTime,
      request.endTime,
      mgrSettings,
    );
    if (outside) {
      conflicts.push({
        severity: "hard",
        conflictingSlots: [],
        conflictingWorkOrders: [],
        description: `Requested time is outside manager service window ${mgrSettings.serviceWindowStart}â€“${mgrSettings.serviceWindowEnd}.`,
        canOverride: false,
      });
    }

    // Blackouts/time-off
    const blocked = await this.isInManagerBlock(
      managerId,
      request.startTime,
      request.endTime,
    );
    if (blocked) {
      conflicts.push({
        severity: "hard",
        conflictingSlots: [],
        conflictingWorkOrders: [],
        description: `Requested time falls inside a manager blackout/time-off block.`,
        canOverride: false,
      });
    }

    // Capacity for that day
    const capacityReached = await this.isDailyCapacityReached(
      managerId,
      request.startTime,
      mgrSettings,
    );
    if (capacityReached) {
      conflicts.push({
        severity: "soft",
        conflictingSlots: [],
        conflictingWorkOrders: [],
        description: `Daily capacity reached for ${format(request.startTime, "yyyy-MM-dd")}.`,
        canOverride: true,
      });
    }

    // Turnover soft conflicts (kept at app layer for context)
    const bufferConflicts = await this.checkBufferTimeConflicts(
      request,
      mgrSettings.bufferMinutes ?? this.TURNOVER_BUFFER_MINUTES,
    );
    if (bufferConflicts.length > 0) conflicts.push(...bufferConflicts);

    // Travel conflicts
    const travelConflicts = await this.checkTravelTimeConflicts(
      request,
      this.TRAVEL_MINUTES,
    );
    if (travelConflicts.length > 0) conflicts.push(...travelConflicts);

    return conflicts;
  }

  /**
   * Book a time slot, handling conflicts and admin overrides
   */
  async bookSlot(request: SlotBookingRequest): Promise<SchedulingResult> {
    const storage = await this.schedulingStorage();
    const conflicts = await this.detectConflicts(request);

    // Reject on non-overridable conflicts unless admin override
    const blocking = conflicts.filter((c) => !c.canOverride);
    if (blocking.length > 0 && !request.adminOverride) {
      const alternatives = await this.generateAlternativeSlots(request);
      return { success: false, conflicts: blocking, alternatives };
    }

    try {
      let assignedSlot: TimeSlot;

      if (request.slotId) {
        const slot = await storage.getTimeSlot(request.slotId);
        if (!slot || !slot.isAvailable)
          throw new Error("Requested slot is not available");
        assignedSlot = slot;
        await storage.updateTimeSlot(request.slotId, { isAvailable: false });
      } else {
        // Create new slot marked as booked
        const newSlot: InsertTimeSlot = {
          contractorId: request.contractorId,
          slotDate: request.startTime,
          startTime: request.startTime,
          endTime: request.endTime,
          slotType: request.slotType,
          duration: this.getDurationFromMinutes(
            (request.endTime.getTime() - request.startTime.getTime()) / 60000,
          ),
          isAvailable: false,
          isRecurring: false,
        };
        assignedSlot = await storage.createTimeSlot(newSlot);
      }

      await storage.updateWorkOrder(request.workOrderId, {
        assignedSlotId: assignedSlot.id,
        scheduledStartDate: request.startTime,
        scheduledEndDate: request.endTime,
        slotType: request.slotType,
        scheduledDuration:
          (request.endTime.getTime() - request.startTime.getTime()) / 60000,
        hasSchedulingConflicts: conflicts.length > 0,
        conflictOverrideReason: request.adminOverride
          ? request.overrideReason
          : undefined,
        conflictOverrideBy: request.adminOverride
          ? request.overrideBy
          : undefined,
        conflictOverrideAt: request.adminOverride ? new Date() : undefined,
      });

      if (request.adminOverride && conflicts.length > 0) {
        await this.logSchedulingConflicts(request, conflicts);
        await this.auditOverrideAction(request);
      }

      await storage.createScheduleAuditLog({
        action: "schedule_created",
        entityType: "work_order",
        entityId: request.workOrderId,
        userId: request.overrideBy,
        userRole: request.adminOverride ? "admin" : "manager",
        newValues: {
          slotId: assignedSlot.id,
          startTime: request.startTime.toISOString(),
          endTime: request.endTime.toISOString(),
        },
        reason: request.overrideReason,
        adminOverride: request.adminOverride || false,
      });

      return {
        success: true,
        conflicts,
        booking: {
          slotId: assignedSlot.id,
          workOrderId: request.workOrderId,
          startTime: request.startTime,
          endTime: request.endTime,
        },
      };
    } catch (error: any) {
      // Map DB-level exclusion constraint to a clean 409 if present
      const msg = String(error?.message || "");
      if (msg.includes("work_orders_no_overlap_manager_excl")) {
        throw Object.assign(
          new Error(
            "Scheduling conflict: manager already booked (20 min buffer enforced).",
          ),
          {
            status: 409,
            code: "OVERLAP",
          },
        );
      }
      console.error("Error booking slot:", error);
      throw error;
    }
  }

  /**
   * Generate alternative time slots when conflicts exist
   */
  async generateAlternativeSlots(
    originalRequest: SlotBookingRequest,
  ): Promise<TimeSlot[]> {
    const duration =
      originalRequest.endTime.getTime() - originalRequest.startTime.getTime();
    const startDate = new Date(originalRequest.startTime);
    const endDate = addDays(startDate, 14); // Look ahead 2 weeks

    const availabilityRequest: AvailabilityRequest = {
      contractorId: originalRequest.contractorId,
      startDate,
      endDate,
      timezone: this.defaultTimezone,
      slotType: originalRequest.slotType,
      slotDuration: this.getDurationFromMinutes(duration / 60000),
    };

    const availableSlots =
      await this.generateAvailableSlots(availabilityRequest);

    // Return first 5 alternatives, excluding the original requested time
    return availableSlots
      .filter(
        (slot) => !isEqual(new Date(slot.startTime), originalRequest.startTime),
      )
      .slice(0, 5);
  }

  /**
   * Match member preferred dates with available contractor slots
   */
  async matchPreferredDates(
    contractorId: string,
    preferredDates: { date: string; time?: string }[],
    slotDuration: SlotDuration = "2_hour",
    timezone: string = this.defaultTimezone,
  ): Promise<{ preference: number; slots: TimeSlot[] }[]> {
    const matchedSlots: { preference: number; slots: TimeSlot[] }[] = [];

    for (let i = 0; i < preferredDates.length; i++) {
      const preferred = preferredDates[i];
      const preferredDate = parseISO(preferred.date);

      const dayStart = startOfDay(preferredDate);
      const dayEnd = endOfDay(preferredDate);

      const availabilityRequest: AvailabilityRequest = {
        contractorId,
        startDate: dayStart,
        endDate: dayEnd,
        timezone,
        slotDuration,
        slotType: "standard",
      };

      const availableSlots =
        await this.generateAvailableSlots(availabilityRequest);

      let matchingSlots = availableSlots;
      if (preferred.time) {
        const preferredTime = parseISO(`${preferred.date}T${preferred.time}`);
        matchingSlots = availableSlots.filter((slot) => {
          const slotStart = new Date(slot.startTime);
          const timeDiff = Math.abs(
            slotStart.getTime() - preferredTime.getTime(),
          );
          return timeDiff <= 2 * 60 * 60 * 1000; // Within 2 hours
        });
      }

      matchedSlots.push({ preference: i + 1, slots: matchingSlots });
    }

    return matchedSlots;
  }

  // ===========================
  // PRIVATE HELPER METHODS
  // ===========================

  private parseContractorAvailability(
    contractor: ContractorProfile,
    mgr: ManagerSettings,
  ): ContractorWorkingHours {
    const defaultHours: ContractorWorkingHours = {
      monday: { start: "08:00", end: "17:00" },
      tuesday: { start: "08:00", end: "17:00" },
      wednesday: { start: "08:00", end: "17:00" },
      thursday: { start: "08:00", end: "17:00" },
      friday: { start: "08:00", end: "17:00" },
      timezone: this.defaultTimezone,
    };

    const hours =
      contractor.availability && typeof contractor.availability === "object"
        ? { ...defaultHours, ...contractor.availability }
        : defaultHours;

    // Clamp by manager's service window
    const clamp = (start: string, end: string) => {
      const s = start < mgr.serviceWindowStart ? mgr.serviceWindowStart : start;
      const e = end > mgr.serviceWindowEnd ? mgr.serviceWindowEnd : end;
      return { start: s, end: e };
    };

    for (const dow of [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ] as const) {
      if ((hours as any)[dow]) {
        (hours as any)[dow] = clamp(
          (hours as any)[dow].start,
          (hours as any)[dow].end,
        );
      }
    }

    return hours;
  }

  private generateSlotsForDay(
    date: Date,
    workingHours: ContractorWorkingHours,
    slotDurationMinutes: number,
    bufferMinutes: number,
    contractorId: string,
    slotType: SlotType,
    timezone: string,
    managerBlocks: ManagerTimeBlock[],
  ): InsertTimeSlot[] {
    const slots: InsertTimeSlot[] = [];
    const dayOfWeek = format(date, "EEEE").toLowerCase() as keyof Omit<
      ContractorWorkingHours,
      "timezone" | "breaks"
    >;

    const dayHours = workingHours[dayOfWeek];
    if (!dayHours) return slots; // Not working this day

    const tz = workingHours.timezone ?? timezone ?? this.defaultTimezone;
    const dayStart = this.composeDateTime(date, dayHours.start, tz);
    const dayEnd = this.composeDateTime(date, dayHours.end, tz);
    const slotDate = zonedTimeToUtc(`${format(utcToZonedTime(date, tz), 'yyyy-MM-dd')}T00:00:00`, tz);

    const breaks =
      workingHours.breaks?.map((b) => ({
        start: this.composeDateTime(date, b.start, tz),
        end: this.composeDateTime(date, b.end, tz),
      })) || [];

    let currentSlotStart = new Date(dayStart);

    while (
      currentSlotStart.getTime() + slotDurationMinutes * 60 * 1000 <=
      dayEnd.getTime()
    ) {
      const currentSlotEnd = new Date(
        currentSlotStart.getTime() + slotDurationMinutes * 60 * 1000,
      );

      const overlapsBreak = breaks.some((br) =>
        this.timesOverlap(currentSlotStart, currentSlotEnd, br.start, br.end),
      );
      if (overlapsBreak) {
        currentSlotStart = this.bumpPastBlock(currentSlotStart, breaks);
        continue;
      }

      const overlapsBlock = managerBlocks.some((b) =>
        this.timesOverlap(currentSlotStart, currentSlotEnd, b.startAt, b.endAt),
      );
      if (!overlapsBlock) {
        slots.push({
          contractorId,
          slotDate: new Date(slotDate),
          startTime: new Date(currentSlotStart),
          endTime: new Date(currentSlotEnd),
          slotType,
          duration: this.getDurationFromMinutes(slotDurationMinutes),
          isAvailable: true,
          isRecurring: false,
        });
      }

      currentSlotStart = addMinutes(currentSlotEnd, bufferMinutes);
    }

    return slots;
  }

  private bumpPastBlock(
    current: Date,
    blocks: Array<{ start: Date; end: Date }>,
  ): Date {
    let candidate = new Date(current);
    for (const block of blocks) {
      if (current >= block.start && current < block.end && block.end > candidate) {
        candidate = new Date(block.end);
      }
    }
    return candidate;
  }

  private filterConflictingSlots(
    generatedSlots: InsertTimeSlot[],
    existingSlots: TimeSlot[],
    existingWorkOrders: WorkOrder[],
    mgrSettings: ManagerSettings,
  ): InsertTimeSlot[] {
    const buffer = mgrSettings.bufferMinutes ?? this.TURNOVER_BUFFER_MINUTES;

    return generatedSlots.filter((slot) => {
      // Compare with existing slots with buffer padding
      const hasSlotConflict = existingSlots.some((existing) =>
        this.timesOverlap(
          addMinutes(new Date(slot.startTime), -buffer),
          addMinutes(new Date(slot.endTime), +buffer),
          new Date(existing.startTime),
          new Date(existing.endTime),
        ),
      );

      // Compare with work orders with buffer padding
      const hasWorkOrderConflict = existingWorkOrders.some(
        (wo) =>
          wo.scheduledStartDate &&
          wo.scheduledEndDate &&
          this.timesOverlap(
            addMinutes(new Date(slot.startTime), -buffer),
            addMinutes(new Date(slot.endTime), +buffer),
            new Date(wo.scheduledStartDate),
            new Date(wo.scheduledEndDate),
          ),
      );

      return !hasSlotConflict && !hasWorkOrderConflict;
    });
  }

  private timesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date,
  ): boolean {
    return start1 < end2 && end1 > start2;
  }

  private getSlotDurationMinutes(duration: string): number {
    const durationMap: Record<string, number> = {
      "1_hour": 60,
      "2_hour": 120,
      "4_hour": 240,
      "8_hour": 480,
      custom: 120,
    };
    return durationMap[duration] || 120;
  }

  private getDurationFromMinutes(minutes: number): SlotDuration {
    if (minutes <= 60) return "1_hour";
    if (minutes <= 120) return "2_hour";
    if (minutes <= 240) return "4_hour";
    if (minutes <= 480) return "8_hour";
    return "custom";
  }

  private async checkBufferTimeConflicts(
    request: SlotBookingRequest,
    bufferMinutes: number,
  ): Promise<ConflictDetails[]> {
    const storage = await this.schedulingStorage();
    const conflicts: ConflictDetails[] = [];

    // Work orders within an hour around the request window
    const bufferStart = addHours(request.startTime, -1);
    const bufferEnd = addHours(request.endTime, 1);

    const nearbyWorkOrders = await storage.getWorkOrdersByDateRange(
      request.contractorId,
      bufferStart,
      bufferEnd,
    );

    for (const workOrder of nearbyWorkOrders) {
      if (
        !workOrder.scheduledStartDate ||
        !workOrder.scheduledEndDate ||
        workOrder.id === request.workOrderId
      ) {
        continue;
      }

      const minutesBefore = differenceInMinutes(
        request.startTime,
        new Date(workOrder.scheduledEndDate),
      );
      const minutesAfter = differenceInMinutes(
        new Date(workOrder.scheduledStartDate),
        request.endTime,
      );

      if (minutesBefore < bufferMinutes && minutesBefore > -1440) {
        conflicts.push({
          severity: "soft",
          conflictingSlots: [],
          conflictingWorkOrders: [workOrder],
          description: `Less than ${bufferMinutes} minutes turnover before this job.`,
          canOverride: true,
        });
      } else if (minutesAfter < bufferMinutes && minutesAfter > -1440) {
        conflicts.push({
          severity: "soft",
          conflictingSlots: [],
          conflictingWorkOrders: [workOrder],
          description: `Less than ${bufferMinutes} minutes turnover after this job.`,
          canOverride: true,
        });
      }
    }

    return conflicts;
  }

  private async checkTravelTimeConflicts(
    request: SlotBookingRequest,
    travelMinutes: number,
  ): Promise<ConflictDetails[]> {
    const storage = await this.schedulingStorage();
    const conflicts: ConflictDetails[] = [];
    const currentWorkOrder = await storage.getWorkOrder(request.workOrderId);
    if (!currentWorkOrder) return conflicts;

    const serviceRequest = await storage.getServiceRequest(
      currentWorkOrder.serviceRequestId,
    );
    if (!serviceRequest) return conflicts;

    const dayStart = startOfDay(request.startTime);
    const dayEnd = endOfDay(request.startTime);

    const samedayWorkOrders = await storage.getWorkOrdersByDateRange(
      request.contractorId,
      dayStart,
      dayEnd,
    );

    for (const workOrder of samedayWorkOrders) {
      if (
        !workOrder.scheduledStartDate ||
        !workOrder.scheduledEndDate ||
        workOrder.id === request.workOrderId
      ) {
        continue;
      }

      const otherSR = await storage.getServiceRequest(
        workOrder.serviceRequestId,
      );
      if (!otherSR) continue;

      const differentLocation =
        serviceRequest.address !== otherSR.address ||
        serviceRequest.city !== otherSR.city ||
        serviceRequest.zipCode !== otherSR.zipCode;

      if (differentLocation) {
        // naive: require at least travelMinutes between previous end and next start
        const minutesBetween = Math.abs(
          differenceInMinutes(
            request.startTime,
            new Date(workOrder.scheduledEndDate),
          ),
        );
        if (minutesBetween < travelMinutes) {
          conflicts.push({
            severity: "travel",
            conflictingSlots: [],
            conflictingWorkOrders: [workOrder],
            description: `Insufficient travel time (${minutesBetween} min) between ${serviceRequest.address} and ${otherSR.address}.`,
            canOverride: true,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Find existing slot to avoid duplicates during slot generation
   */
  private async findExistingSlot(
    contractorId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<TimeSlot | undefined> {
    const storage = await this.schedulingStorage();
    const overlappingSlots = await storage.getOverlappingTimeSlots(
      contractorId,
      addMinutes(startTime, -1),
      addMinutes(endTime, +1),
    );
    return overlappingSlots.find(
      (slot) =>
        isEqual(new Date(slot.startTime), startTime) &&
        isEqual(new Date(slot.endTime), endTime),
    );
  }

  private async logSchedulingConflicts(
    request: SlotBookingRequest,
    conflicts: ConflictDetails[],
  ) {
    const storage = await this.schedulingStorage();
    for (const conflict of conflicts) {
      const conflictData: InsertScheduleConflict = {
        conflictType: conflict.severity,
        workOrderId: request.workOrderId,
        contractorId: request.contractorId,
        conflictStart: request.startTime,
        conflictEnd: request.endTime,
        conflictingWorkOrderIds: conflict.conflictingWorkOrders.map(
          (wo) => wo.id,
        ),
        conflictingSlotIds: conflict.conflictingSlots.map((slot) => slot.id),
        detectionMethod: "booking_validation",
        conflictDescription: conflict.description,
        adminOverride: request.adminOverride || false,
        resolvedBy: request.overrideBy,
        resolutionNotes: request.overrideReason,
      };

      await storage.createScheduleConflict(conflictData);
    }
  }

  /**
   * Handle admin override for scheduling conflicts
   */
  async handleAdminOverride(request: AdminSlotOverrideRequest): Promise<void> {
    const storage = await this.schedulingStorage();
    await storage.createScheduleAuditLog({
      action: "admin_override",
      entityType: "work_order",
      entityId: request.workOrderId,
      userId: request.adminUserId,
      userRole: "admin",
      reason: request.overrideReason,
      adminOverride: true,
      newValues: {
        contractorId: request.contractorId,
        startTime: request.startTime.toISOString(),
        endTime: request.endTime.toISOString(),
        overrideReason: request.overrideReason,
      },
      additionalData: {
        overrideType: "scheduling_conflict",
        overrideTimestamp: new Date().toISOString(),
      },
    });

    const bookingRequest: SlotBookingRequest = {
      contractorId: request.contractorId,
      startTime: request.startTime,
      endTime: request.endTime,
      slotType: "standard",
      workOrderId: request.workOrderId,
      adminOverride: true,
      overrideReason: request.overrideReason,
      overrideBy: request.adminUserId,
    };

    await this.bookSlot(bookingRequest);
  }

  private async auditOverrideAction(request: SlotBookingRequest) {
    const storage = await this.schedulingStorage();
    await storage.createScheduleAuditLog({
      action: "admin_override",
      entityType: "work_order",
      entityId: request.workOrderId,
      userId: request.overrideBy,
      userRole: "admin",
      reason: request.overrideReason || "Admin scheduling override",
      adminOverride: true,
      additionalData: {
        originalStartTime: request.startTime.toISOString(),
        originalEndTime: request.endTime.toISOString(),
        contractorId: request.contractorId,
      },
    });
  }

  // ===========================
  // MANAGER SETTINGS / BLOCKS / CAPACITY
  // ===========================

  private async resolveManagerIdForContractor(
    contractor?: ContractorProfile | null,
  ): Promise<string> {
    if (!contractor) return "";
    if ((contractor as any).homeManagerId) {
      return String((contractor as any).homeManagerId);
    }
    if ((contractor as any).managerId) {
      return String((contractor as any).managerId);
    }
    return String(contractor.userId ?? contractor.id ?? "");
  }

  private async getManagerSettings(
    homeManagerId: string,
  ): Promise<ManagerSettings> {
    const storage = await this.coreStorage();
    const stored = await storage.getManagerSettings(homeManagerId);
    if (stored) {
      return {
        homeManagerId: stored.homeManagerId,
        maxDailyJobs: stored.maxDailyJobs,
        serviceWindowStart: stored.serviceWindowStart,
        serviceWindowEnd: stored.serviceWindowEnd,
        bufferMinutes: stored.bufferMinutes,
      };
    }
    return {
      homeManagerId: String(homeManagerId),
      maxDailyJobs: 8,
      serviceWindowStart: "08:00",
      serviceWindowEnd: "18:00",
      bufferMinutes: this.TURNOVER_BUFFER_MINUTES,
    };
  }

  private async getManagerTimeBlocks(
    homeManagerId: string,
    start: Date,
    end: Date,
  ): Promise<ManagerTimeBlock[]> {
    const storage = await this.coreStorage();
    const blocks = await storage.getManagerTimeBlocks(homeManagerId);
    return blocks
      .filter((block) => block.endAt >= start && block.startAt <= end)
      .map((block) => ({
        id: block.id,
        homeManagerId: block.homeManagerId,
        blockType: block.blockType,
        startAt: block.startAt,
        endAt: block.endAt,
        reason: block.reason ?? null,
      }));
  }

  private composeDateTime(
    date: Date,
    hhmm: string,
    timezone = this.defaultTimezone,
  ): Date {
    const zonedDay = utcToZonedTime(date, timezone);
    const dayString = format(zonedDay, 'yyyy-MM-dd');
    return zonedTimeToUtc(`${dayString}T${hhmm}:00`, timezone);
  }

  private async isOutsideServiceWindow(
    homeManagerId: string,
    start: Date,
    end: Date,
    mgr: ManagerSettings,
  ): Promise<boolean> {
    const s = this.composeDateTime(start, mgr.serviceWindowStart);
    const e = this.composeDateTime(start, mgr.serviceWindowEnd);
    return start < s || end > e;
  }

  private async isInManagerBlock(
    homeManagerId: string,
    start: Date,
    end: Date,
  ): Promise<boolean> {
    const blocks = await this.getManagerTimeBlocks(
      homeManagerId,
      startOfDay(start),
      endOfDay(start),
    );
    return blocks.some((b) =>
      this.timesOverlap(start, end, b.startAt, b.endAt),
    );
  }

  private async isDailyCapacityReached(
    homeManagerId: string,
    day: Date,
    mgr: ManagerSettings,
  ): Promise<boolean> {
    const repos = await this.resolveRepositories();
    const managerOrders = await repos.workOrders.getWorkOrdersByManager(
      homeManagerId,
    );
    const count = managerOrders.filter((order) => {
      if (!order.scheduledStartDate) return false;
      return isSameDay(new Date(order.scheduledStartDate), day);
    }).length;
    return count >= (mgr.maxDailyJobs ?? 8);
  }
}

// Export singleton instance
export const schedulingService = new SchedulingService();




