import { format, addDays, addHours, isBefore, isAfter, isEqual, startOfDay, endOfDay, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import {
  type TimeSlot, 
  type InsertTimeSlot,
  type ScheduleConflict,
  type InsertScheduleConflict,
  type WorkOrder,
  type ContractorProfile,
  slotDurationEnum,
  conflictSeverityEnum
} from '@shared/schema';
import { storage } from './storage';

// ===========================
// SCHEDULING SERVICE TYPES
// ===========================

export interface AvailabilityRequest {
  contractorId: string;
  startDate: Date;
  endDate: Date;
  timezone: string;
  slotDuration?: string; // "1_hour", "2_hour", "4_hour", "8_hour"
  slotType?: string; // "standard", "emergency", "consultation"
}

export interface SlotBookingRequest {
  contractorId: string;
  slotId?: string;
  startTime: Date;
  endTime: Date;
  slotType: string;
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
  severity: "hard" | "soft" | "travel";
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
  monday?: { start: string; end: string; };
  tuesday?: { start: string; end: string; };
  wednesday?: { start: string; end: string; };
  thursday?: { start: string; end: string; };
  friday?: { start: string; end: string; };
  saturday?: { start: string; end: string; };
  sunday?: { start: string; end: string; };
  timezone: string;
  breaks?: Array<{ start: string; end: string; }>;
}

// ===========================
// SCHEDULING SERVICE CLASS
// ===========================

export class SchedulingService {
  private defaultTimezone = 'America/New_York';

  /**
   * Generate available time slots for a contractor based on their working hours and existing bookings
   */
  async generateAvailableSlots(request: AvailabilityRequest): Promise<TimeSlot[]> {
    const contractor = await storage.getContractorProfile(request.contractorId);
    if (!contractor) {
      throw new Error(`Contractor ${request.contractorId} not found`);
    }

    // Get contractor's working hours from profile
    const workingHours = this.parseContractorAvailability(contractor);
    
    // Get existing bookings and blocked slots
    const existingSlots = await storage.getContractorTimeSlots(request.contractorId, request.startDate, request.endDate);
    const existingWorkOrders = await storage.getWorkOrdersByContractor(request.contractorId);
    
    const availableSlots: InsertTimeSlot[] = [];
    const slotDuration = this.getSlotDurationMinutes(request.slotDuration || '2_hour');
    
    // Generate slots for each day in the range
    let currentDate = new Date(request.startDate);
    while (currentDate <= request.endDate) {
      const daySlots = this.generateSlotsForDay(
        currentDate,
        workingHours,
        slotDuration,
        request.contractorId,
        request.slotType || 'standard',
        request.timezone
      );
      
      // Filter out conflicting slots
      const nonConflictingSlots = this.filterConflictingSlots(
        daySlots, 
        existingSlots, 
        existingWorkOrders
      );
      
      availableSlots.push(...nonConflictingSlots);
      currentDate = addDays(currentDate, 1);
    }

    // CRITICAL FIX: Persist each slot to database for durable IDs instead of ephemeral ones
    const persistedSlots: TimeSlot[] = [];
    
    for (const slotData of availableSlots) {
      try {
        // Check if slot already exists to avoid duplicates
        const existingSlot = await this.findExistingSlot(
          request.contractorId, 
          slotData.startTime, 
          slotData.endTime
        );
        
        if (!existingSlot) {
          const persistedSlot = await storage.createTimeSlot(slotData);
          persistedSlots.push(persistedSlot);
        } else {
          persistedSlots.push(existingSlot);
        }
      } catch (error) {
        console.error('Error persisting slot:', error);
        // Continue with other slots even if one fails
      }
    }

    return persistedSlots;
  }

  /**
   * Detect scheduling conflicts for a booking request
   */
  async detectConflicts(request: SlotBookingRequest): Promise<ConflictDetails[]> {
    const conflicts: ConflictDetails[] = [];
    
    // Get overlapping time slots
    const overlappingSlots = await storage.getOverlappingTimeSlots(
      request.contractorId,
      request.startTime,
      request.endTime
    );

    // Get overlapping work orders
    const overlappingWorkOrders = await storage.getOverlappingWorkOrders(
      request.contractorId,
      request.startTime,
      request.endTime
    );

    // Check for hard conflicts (direct overlaps)
    if (overlappingSlots.length > 0 || overlappingWorkOrders.length > 0) {
      conflicts.push({
        severity: "hard",
        conflictingSlots: overlappingSlots,
        conflictingWorkOrders: overlappingWorkOrders,
        description: `Time slot conflicts with ${overlappingSlots.length} existing slots and ${overlappingWorkOrders.length} work orders`,
        canOverride: true // Admins can override
      });
    }

    // Check for soft conflicts (buffer time violations)
    const bufferConflicts = await this.checkBufferTimeConflicts(request);
    if (bufferConflicts.length > 0) {
      conflicts.push(...bufferConflicts);
    }

    // Check for travel time conflicts  
    const travelConflicts = await this.checkTravelTimeConflicts(request);
    if (travelConflicts.length > 0) {
      conflicts.push(...travelConflicts);
    }

    return conflicts;
  }

  /**
   * Book a time slot, handling conflicts and admin overrides
   */
  async bookSlot(request: SlotBookingRequest): Promise<SchedulingResult> {
    // Detect conflicts first
    const conflicts = await this.detectConflicts(request);
    
    // Check if booking is allowed
    const hardConflicts = conflicts.filter(c => c.severity === 'hard');
    if (hardConflicts.length > 0 && !request.adminOverride) {
      // Generate alternative slots
      const alternatives = await this.generateAlternativeSlots(request);
      
      return {
        success: false,
        conflicts: hardConflicts,
        alternatives
      };
    }

    // Proceed with booking
    try {
      let assignedSlot: TimeSlot;
      
      if (request.slotId) {
        // Use existing slot
        const slot = await storage.getTimeSlot(request.slotId);
        if (!slot || !slot.isAvailable) {
          throw new Error('Requested slot is not available');
        }
        assignedSlot = slot;
        
        // Update slot to mark as booked
        await storage.updateTimeSlot(request.slotId, { isAvailable: false });
      } else {
        // Create new slot
        const newSlot: InsertTimeSlot = {
          contractorId: request.contractorId,
          slotDate: request.startTime,
          startTime: request.startTime,
          endTime: request.endTime,
          slotType: request.slotType as any,
          duration: this.getDurationFromMinutes(
            (request.endTime.getTime() - request.startTime.getTime()) / 60000
          ),
          isAvailable: false, // Mark as booked immediately
          isRecurring: false
        };
        
        assignedSlot = await storage.createTimeSlot(newSlot);
      }

      // Update work order with slot assignment
      await storage.updateWorkOrder(request.workOrderId, {
        assignedSlotId: assignedSlot.id,
        scheduledStartDate: request.startTime,
        scheduledEndDate: request.endTime,
        slotType: request.slotType as any,
        scheduledDuration: (request.endTime.getTime() - request.startTime.getTime()) / 60000,
        hasSchedulingConflicts: conflicts.length > 0,
        conflictOverrideReason: request.adminOverride ? request.overrideReason : undefined,
        conflictOverrideBy: request.adminOverride ? request.overrideBy : undefined,
        conflictOverrideAt: request.adminOverride ? new Date() : undefined
      });

      // Log conflicts if admin override was used
      if (request.adminOverride && conflicts.length > 0) {
        await this.logSchedulingConflicts(request, conflicts);
        await this.auditOverrideAction(request);
      }

      // Log successful booking
      await storage.createScheduleAuditLog({
        action: 'schedule_created',
        entityType: 'work_order',
        entityId: request.workOrderId,
        userId: request.overrideBy,
        userRole: 'admin', // This should come from the actual user context
        newValues: {
          slotId: assignedSlot.id,
          startTime: request.startTime.toISOString(),
          endTime: request.endTime.toISOString()
        },
        reason: request.overrideReason,
        adminOverride: request.adminOverride || false
      });

      return {
        success: true,
        conflicts,
        booking: {
          slotId: assignedSlot.id,
          workOrderId: request.workOrderId,
          startTime: request.startTime,
          endTime: request.endTime
        }
      };
      
    } catch (error) {
      console.error('Error booking slot:', error);
      throw error;
    }
  }

  /**
   * Generate alternative time slots when conflicts exist
   */
  async generateAlternativeSlots(originalRequest: SlotBookingRequest): Promise<TimeSlot[]> {
    const duration = originalRequest.endTime.getTime() - originalRequest.startTime.getTime();
    const startDate = new Date(originalRequest.startTime);
    const endDate = addDays(startDate, 14); // Look ahead 2 weeks
    
    const availabilityRequest: AvailabilityRequest = {
      contractorId: originalRequest.contractorId,
      startDate,
      endDate,
      timezone: this.defaultTimezone,
      slotType: originalRequest.slotType,
      slotDuration: this.getDurationFromMinutes(duration / 60000)
    };
    
    const availableSlots = await this.generateAvailableSlots(availabilityRequest);
    
    // Return first 5 alternatives, excluding the original requested time
    return availableSlots
      .filter(slot => 
        !isEqual(new Date(slot.startTime), originalRequest.startTime)
      )
      .slice(0, 5);
  }

  /**
   * Match member preferred dates with available contractor slots
   */
  async matchPreferredDates(
    contractorId: string, 
    preferredDates: { date: string; time?: string; }[],
    slotDuration: string = '2_hour',
    timezone: string = this.defaultTimezone
  ): Promise<{ preference: number; slots: TimeSlot[] }[]> {
    const matchedSlots: { preference: number; slots: TimeSlot[] }[] = [];
    
    for (let i = 0; i < preferredDates.length; i++) {
      const preferred = preferredDates[i];
      const preferredDate = parseISO(preferred.date);
      
      // Generate availability for just this day
      const dayStart = startOfDay(preferredDate);
      const dayEnd = endOfDay(preferredDate);
      
      const availabilityRequest: AvailabilityRequest = {
        contractorId,
        startDate: dayStart,
        endDate: dayEnd,
        timezone,
        slotDuration,
        slotType: 'standard'
      };
      
      const availableSlots = await this.generateAvailableSlots(availabilityRequest);
      
      // If specific time is preferred, filter for slots near that time
      let matchingSlots = availableSlots;
      if (preferred.time) {
        const preferredTime = parseISO(`${preferred.date}T${preferred.time}`);
        matchingSlots = availableSlots.filter(slot => {
          const slotStart = new Date(slot.startTime);
          const timeDiff = Math.abs(slotStart.getTime() - preferredTime.getTime());
          return timeDiff <= 2 * 60 * 60 * 1000; // Within 2 hours
        });
      }
      
      matchedSlots.push({
        preference: i + 1,
        slots: matchingSlots
      });
    }
    
    return matchedSlots;
  }

  // ===========================
  // PRIVATE HELPER METHODS
  // ===========================

  private parseContractorAvailability(contractor: ContractorProfile): ContractorWorkingHours {
    // Default working hours if not specified
    const defaultHours: ContractorWorkingHours = {
      monday: { start: '08:00', end: '17:00' },
      tuesday: { start: '08:00', end: '17:00' },
      wednesday: { start: '08:00', end: '17:00' },
      thursday: { start: '08:00', end: '17:00' },
      friday: { start: '08:00', end: '17:00' },
      timezone: this.defaultTimezone
    };

    // Parse availability from contractor profile if it exists
    if (contractor.availability && typeof contractor.availability === 'object') {
      return { ...defaultHours, ...contractor.availability };
    }

    return defaultHours;
  }

  private generateSlotsForDay(
    date: Date,
    workingHours: ContractorWorkingHours,
    slotDurationMinutes: number,
    contractorId: string,
    slotType: string,
    timezone: string
  ): InsertTimeSlot[] {
    const slots: InsertTimeSlot[] = [];
    const dayOfWeek = format(date, 'EEEE').toLowerCase() as keyof Omit<ContractorWorkingHours, 'timezone' | 'breaks'>;
    
    const dayHours = workingHours[dayOfWeek];
    if (!dayHours) return slots; // Not working this day
    
    // Parse start and end times
    const [startHour, startMin] = dayHours.start.split(':').map(Number);
    const [endHour, endMin] = dayHours.end.split(':').map(Number);
    
    const startTime = new Date(date);
    startTime.setHours(startHour, startMin, 0, 0);
    
    const endTime = new Date(date);
    endTime.setHours(endHour, endMin, 0, 0);
    
    // Generate slots
    let currentSlotStart = new Date(startTime);
    while (currentSlotStart.getTime() + (slotDurationMinutes * 60 * 1000) <= endTime.getTime()) {
      const currentSlotEnd = new Date(currentSlotStart.getTime() + (slotDurationMinutes * 60 * 1000));
      
      slots.push({
        contractorId,
        slotDate: new Date(date),
        startTime: new Date(currentSlotStart),
        endTime: new Date(currentSlotEnd),
        slotType: slotType as any,
        duration: this.getDurationFromMinutes(slotDurationMinutes),
        isAvailable: true,
        isRecurring: false
      });
      
      // Move to next slot (with potential gap/break handling)
      currentSlotStart = new Date(currentSlotEnd);
    }
    
    return slots;
  }

  private filterConflictingSlots(
    generatedSlots: InsertTimeSlot[],
    existingSlots: TimeSlot[],
    existingWorkOrders: WorkOrder[]
  ): InsertTimeSlot[] {
    return generatedSlots.filter(slot => {
      // Check against existing slots
      const hasSlotConflict = existingSlots.some(existing => 
        this.timesOverlap(
          new Date(slot.startTime), 
          new Date(slot.endTime),
          new Date(existing.startTime),
          new Date(existing.endTime)
        )
      );
      
      // Check against work orders
      const hasWorkOrderConflict = existingWorkOrders.some(wo => 
        wo.scheduledStartDate && wo.scheduledEndDate &&
        this.timesOverlap(
          new Date(slot.startTime),
          new Date(slot.endTime), 
          new Date(wo.scheduledStartDate),
          new Date(wo.scheduledEndDate)
        )
      );
      
      return !hasSlotConflict && !hasWorkOrderConflict;
    });
  }

  private timesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && end1 > start2;
  }

  private getSlotDurationMinutes(duration: string): number {
    const durationMap: Record<string, number> = {
      '1_hour': 60,
      '2_hour': 120, 
      '4_hour': 240,
      '8_hour': 480,
      'custom': 120 // Default to 2 hours for custom
    };
    return durationMap[duration] || 120;
  }

  private getDurationFromMinutes(minutes: number): string {
    if (minutes <= 60) return '1_hour';
    if (minutes <= 120) return '2_hour';
    if (minutes <= 240) return '4_hour';
    if (minutes <= 480) return '8_hour';
    return 'custom';
  }

  private async checkBufferTimeConflicts(request: SlotBookingRequest): Promise<ConflictDetails[]> {
    // ENHANCED: Check for 30-minute buffer before/after other appointments
    const bufferMinutes = 30;
    const conflicts: ConflictDetails[] = [];
    
    // Get work orders within buffer time range
    const bufferStart = addHours(request.startTime, -1);
    const bufferEnd = addHours(request.endTime, 1);
    
    const nearbyWorkOrders = await storage.getWorkOrdersByDateRange(
      request.contractorId,
      bufferStart,
      bufferEnd
    );
    
    for (const workOrder of nearbyWorkOrders) {
      if (!workOrder.scheduledStartDate || !workOrder.scheduledEndDate || workOrder.id === request.workOrderId) {
        continue;
      }
      
      const timeBefore = Math.abs(
        request.startTime.getTime() - new Date(workOrder.scheduledEndDate).getTime()
      ) / 60000; // minutes
      
      const timeAfter = Math.abs(
        new Date(workOrder.scheduledStartDate).getTime() - request.endTime.getTime()
      ) / 60000; // minutes
      
      if (timeBefore < bufferMinutes || timeAfter < bufferMinutes) {
        conflicts.push({
          severity: "soft",
          conflictingSlots: [],
          conflictingWorkOrders: [workOrder],
          description: `Less than ${bufferMinutes} minutes buffer time with work order ${workOrder.workOrderNumber}`,
          canOverride: true
        });
      }
    }
    
    return conflicts;
  }

  private async checkTravelTimeConflicts(request: SlotBookingRequest): Promise<ConflictDetails[]> {
    // ENHANCED: Implement travel time calculation based on job locations
    const conflicts: ConflictDetails[] = [];
    const estimatedTravelMinutes = 15; // Default travel time estimate
    
    // Get work order details for location information
    const currentWorkOrder = await storage.getWorkOrder(request.workOrderId);
    if (!currentWorkOrder) return conflicts;
    
    // Get the service request for address information
    const serviceRequest = await storage.getServiceRequest(currentWorkOrder.serviceRequestId);
    if (!serviceRequest) return conflicts;
    
    // Get nearby work orders on the same day
    const dayStart = startOfDay(request.startTime);
    const dayEnd = endOfDay(request.startTime);
    
    const samedayWorkOrders = await storage.getWorkOrdersByDateRange(
      request.contractorId,
      dayStart,
      dayEnd
    );
    
    for (const workOrder of samedayWorkOrders) {
      if (!workOrder.scheduledStartDate || !workOrder.scheduledEndDate || workOrder.id === request.workOrderId) {
        continue;
      }
      
      // Get related service request for location comparison
      const otherServiceRequest = await storage.getServiceRequest(workOrder.serviceRequestId);
      if (!otherServiceRequest) continue;
      
      // Simple distance check - if different addresses, assume travel time needed
      const differentLocation = serviceRequest.address !== otherServiceRequest.address ||
                              serviceRequest.city !== otherServiceRequest.city;
      
      if (differentLocation) {
        const timeBetween = Math.abs(
          request.startTime.getTime() - new Date(workOrder.scheduledEndDate).getTime()
        ) / 60000; // minutes
        
        if (timeBetween < estimatedTravelMinutes) {
          conflicts.push({
            severity: "travel",
            conflictingSlots: [],
            conflictingWorkOrders: [workOrder],
            description: `Insufficient travel time (${Math.round(timeBetween)} min) between locations: ${serviceRequest.address} and ${otherServiceRequest.address}`,
            canOverride: true
          });
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Find existing slot to avoid duplicates during slot generation
   */
  private async findExistingSlot(contractorId: string, startTime: Date, endTime: Date): Promise<TimeSlot | undefined> {
    const overlappingSlots = await storage.getOverlappingTimeSlots(contractorId, startTime, endTime);
    return overlappingSlots.find(slot => 
      isEqual(new Date(slot.startTime), startTime) && 
      isEqual(new Date(slot.endTime), endTime)
    );
  }

  private async logSchedulingConflicts(request: SlotBookingRequest, conflicts: ConflictDetails[]) {
    for (const conflict of conflicts) {
      const conflictData: InsertScheduleConflict = {
        conflictType: conflict.severity,
        workOrderId: request.workOrderId,
        contractorId: request.contractorId,
        conflictStart: request.startTime,
        conflictEnd: request.endTime,
        conflictingWorkOrderIds: conflict.conflictingWorkOrders.map(wo => wo.id),
        conflictingSlotIds: conflict.conflictingSlots.map(slot => slot.id),
        detectionMethod: 'booking_validation',
        conflictDescription: conflict.description,
        adminOverride: request.adminOverride || false,
        resolvedBy: request.overrideBy,
        resolutionNotes: request.overrideReason
      };
      
      await storage.createScheduleConflict(conflictData);
    }
  }

  /**
   * Handle admin override for scheduling conflicts
   * IMPLEMENTED: Processes admin overrides with proper audit logging
   */
  async handleAdminOverride(request: AdminSlotOverrideRequest): Promise<void> {
    // Log the admin override action
    await storage.createScheduleAuditLog({
      action: 'admin_override',
      entityType: 'work_order',
      entityId: request.workOrderId,
      userId: request.adminUserId,
      userRole: 'admin',
      reason: request.overrideReason,
      adminOverride: true,
      newValues: {
        contractorId: request.contractorId,
        startTime: request.startTime.toISOString(),
        endTime: request.endTime.toISOString(),
        overrideReason: request.overrideReason
      },
      additionalData: {
        overrideType: 'scheduling_conflict',
        overrideTimestamp: new Date().toISOString()
      }
    });

    // Force book the slot despite conflicts
    const bookingRequest: SlotBookingRequest = {
      contractorId: request.contractorId,
      startTime: request.startTime,
      endTime: request.endTime,
      slotType: 'standard',
      workOrderId: request.workOrderId,
      adminOverride: true,
      overrideReason: request.overrideReason,
      overrideBy: request.adminUserId
    };

    await this.bookSlot(bookingRequest);
  }

  private async auditOverrideAction(request: SlotBookingRequest) {
    await storage.createScheduleAuditLog({
      action: 'admin_override',
      entityType: 'work_order',
      entityId: request.workOrderId,
      userId: request.overrideBy,
      userRole: 'admin',
      reason: request.overrideReason || 'Admin scheduling override',
      adminOverride: true,
      additionalData: {
        originalStartTime: request.startTime.toISOString(),
        originalEndTime: request.endTime.toISOString(),
        contractorId: request.contractorId
      }
    });
  }
}

// Export singleton instance
export const schedulingService = new SchedulingService();