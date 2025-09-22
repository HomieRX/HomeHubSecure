import {
  insertWorkOrderSchema,
  insertEstimateSchema,
  insertInvoiceSchema,
  insertDealSchema,
  insertCalendarEventSchema,
  type InsertWorkOrder,
  type InsertEstimate,
  type InsertInvoice,
  type InsertDeal,
  type InsertCalendarEvent,
} from "@shared/schema";
import {
  type WorkOrderCreate,
  type WorkOrderUpdate,
  type EstimateCreate,
  type EstimateUpdate,
  type InvoiceCreate,
  type InvoiceUpdate,
  type DealCreate,
  type DealUpdate,
  type CalendarEventCreate,
  type CalendarEventUpdate,
} from "@shared/types";

function coerceDate(value?: string | Date | null): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === "") {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function coerceDateOrUndefined(value?: string | Date | null): Date | undefined {
  const result = coerceDate(value);
  return result === null ? undefined : result;
}

function toDecimalString(value?: number | string | null): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return typeof value === "number" ? value.toFixed(2) : value;
}

export function normalizeWorkOrderCreate(data: WorkOrderCreate): InsertWorkOrder {
  const normalized: Partial<InsertWorkOrder> = {
    serviceRequestId: data.serviceRequestId,
    homeManagerId: data.homeManagerId,
    contractorId: data.contractorId ?? null,
    workOrderNumber: data.workOrderNumber,
    workDescription: data.workDescription,
    materialsNeeded: data.materialsNeeded ?? null,
    laborHours: data.laborHours ?? null,
    workNotes: data.workNotes ?? null,
    beforeImages: data.beforeImages ?? null,
    afterImages: data.afterImages ?? null,
    attachments: data.attachments ?? null,
  };

  const scheduledStart = coerceDateOrUndefined(data.scheduledStartDate);
  if (scheduledStart !== undefined) {
    normalized.scheduledStartDate = scheduledStart;
  }

  const scheduledEnd = coerceDateOrUndefined(data.scheduledEndDate);
  if (scheduledEnd !== undefined) {
    normalized.scheduledEndDate = scheduledEnd;
  }

  return insertWorkOrderSchema.parse(normalized);
}

export function normalizeWorkOrderUpdate(data: WorkOrderUpdate): Partial<InsertWorkOrder> {
  const normalized: Partial<InsertWorkOrder> = {};

  if (data.contractorId !== undefined) {
    normalized.contractorId = data.contractorId ?? null;
  }
  if (data.materialsNeeded !== undefined) {
    normalized.materialsNeeded = data.materialsNeeded ?? null;
  }
  if (data.laborHours !== undefined) {
    normalized.laborHours = data.laborHours ?? null;
  }
  if (data.workNotes !== undefined) {
    normalized.workNotes = data.workNotes ?? null;
  }
  if (data.beforeImages !== undefined) {
    normalized.beforeImages = data.beforeImages ?? null;
  }
  if (data.afterImages !== undefined) {
    normalized.afterImages = data.afterImages ?? null;
  }
  if (data.attachments !== undefined) {
    normalized.attachments = data.attachments ?? null;
  }
  if (data.slotType !== undefined) {
    normalized.slotType = data.slotType;
  }
  if (data.memberPreferredDates !== undefined) {
    normalized.memberPreferredDates = data.memberPreferredDates ?? null;
  }
  if (data.hasSchedulingConflicts !== undefined) {
    normalized.hasSchedulingConflicts = data.hasSchedulingConflicts;
  }
  if (data.conflictOverrideReason !== undefined) {
    normalized.conflictOverrideReason = data.conflictOverrideReason ?? null;
  }
  if (data.conflictOverrideBy !== undefined) {
    normalized.conflictOverrideBy = data.conflictOverrideBy ?? null;
  }
  if (data.conflictOverrideAt !== undefined) {
    const overrideAt = coerceDate(data.conflictOverrideAt);
    if (overrideAt !== undefined) {
      normalized.conflictOverrideAt = overrideAt;
    }
  }

  if (data.scheduledStartDate !== undefined) {
    const scheduledStart = coerceDate(data.scheduledStartDate);
    if (scheduledStart !== undefined) {
      normalized.scheduledStartDate = scheduledStart;
    }
  }

  if (data.scheduledEndDate !== undefined) {
    const scheduledEnd = coerceDate(data.scheduledEndDate);
    if (scheduledEnd !== undefined) {
      normalized.scheduledEndDate = scheduledEnd;
    }
  }

  return insertWorkOrderSchema.partial().parse(normalized);
}

export function normalizeEstimateCreate(data: EstimateCreate): InsertEstimate {
  const normalized: Partial<InsertEstimate> = {
    serviceRequestId: data.serviceRequestId,
    contractorId: data.contractorId,
    estimateNumber: data.estimateNumber,
    title: data.title,
    description: data.description,
    laborCost: toDecimalString(data.laborCost) ?? "0.00",
    materialCost: toDecimalString(data.materialCost) ?? "0.00",
    additionalCosts: toDecimalString(data.additionalCosts) ?? "0.00",
    totalCost: toDecimalString(data.totalCost) ?? "0.00",
    materials: data.materials ?? null,
    laborBreakdown: data.laborBreakdown ?? null,
    terms: data.terms ?? null,
    notes: data.notes ?? null,
    attachments: data.attachments ?? null,
  };

  const estimatedHours = toDecimalString(data.estimatedHours);
  if (estimatedHours !== undefined) {
    normalized.estimatedHours = estimatedHours;
  }

  const startDate = coerceDateOrUndefined(data.startDate);
  if (startDate !== undefined) {
    normalized.startDate = startDate;
  }

  const completionDate = coerceDateOrUndefined(data.completionDate);
  if (completionDate !== undefined) {
    normalized.completionDate = completionDate;
  }

  const validUntil = coerceDateOrUndefined(data.validUntil);
  if (validUntil !== undefined) {
    normalized.validUntil = validUntil;
  }

  return insertEstimateSchema.parse(normalized);
}

export function normalizeEstimateUpdate(data: EstimateUpdate): Partial<InsertEstimate> {
  const normalized: Partial<InsertEstimate> = {};

  if (data.laborCost !== undefined) {
    normalized.laborCost = toDecimalString(data.laborCost) ?? "0.00";
  }
  if (data.materialCost !== undefined) {
    normalized.materialCost = toDecimalString(data.materialCost) ?? "0.00";
  }
  if (data.additionalCosts !== undefined) {
    normalized.additionalCosts = toDecimalString(data.additionalCosts) ?? "0.00";
  }
  if (data.totalCost !== undefined) {
    normalized.totalCost = toDecimalString(data.totalCost) ?? "0.00";
  }
  if (data.estimatedHours !== undefined) {
    const estimatedHours = toDecimalString(data.estimatedHours);
    if (estimatedHours !== undefined) {
      normalized.estimatedHours = estimatedHours;
    }
  }
  if (data.startDate !== undefined) {
    const startDate = coerceDate(data.startDate);
    if (startDate !== undefined) {
      normalized.startDate = startDate;
    }
  }
  if (data.completionDate !== undefined) {
    const completionDate = coerceDate(data.completionDate);
    if (completionDate !== undefined) {
      normalized.completionDate = completionDate;
    }
  }
  if (data.validUntil !== undefined) {
    const validUntil = coerceDate(data.validUntil);
    if (validUntil !== undefined) {
      normalized.validUntil = validUntil;
    }
  }

  if (data.materials !== undefined) {
    normalized.materials = data.materials ?? null;
  }
  if (data.laborBreakdown !== undefined) {
    normalized.laborBreakdown = data.laborBreakdown ?? null;
  }
  if (data.terms !== undefined) {
    normalized.terms = data.terms ?? null;
  }
  if (data.notes !== undefined) {
    normalized.notes = data.notes ?? null;
  }
  if (data.attachments !== undefined) {
    normalized.attachments = data.attachments ?? null;
  }

  return insertEstimateSchema.partial().parse(normalized);
}

export function normalizeInvoiceCreate(data: InvoiceCreate): InsertInvoice {
  const normalized: Partial<InsertInvoice> = {
    workOrderId: data.workOrderId ?? null,
    memberId: data.memberId,
    invoiceNumber: data.invoiceNumber,
    subtotal: toDecimalString(data.subtotal) ?? "0.00",
    tax: toDecimalString(data.tax) ?? "0.00",
    total: toDecimalString(data.total) ?? "0.00",
    amountDue: toDecimalString(data.amountDue) ?? "0.00",
    loyaltyPointsValue: toDecimalString(data.loyaltyPointsValue) ?? "0.00",
    loyaltyPointsUsed: data.loyaltyPointsUsed ?? 0,
    loyaltyPointsEarned: data.loyaltyPointsEarned ?? 0,
    paymentMethod: data.paymentMethod ?? null,
    transactionId: data.paymentTransactionId ?? null,
    lineItems: data.lineItems,
    notes: data.notes ?? null,
  };

  const dueDate = coerceDateOrUndefined(data.dueDate);
  if (dueDate !== undefined) {
    normalized.dueDate = dueDate;
  }

  return insertInvoiceSchema.parse(normalized);
}

export function normalizeInvoiceUpdate(data: InvoiceUpdate): Partial<InsertInvoice> {
  const normalized: Partial<InsertInvoice> = {};

  if (data.subtotal !== undefined) {
    normalized.subtotal = toDecimalString(data.subtotal) ?? "0.00";
  }
  if (data.tax !== undefined) {
    normalized.tax = toDecimalString(data.tax) ?? "0.00";
  }
  if (data.total !== undefined) {
    normalized.total = toDecimalString(data.total) ?? "0.00";
  }
  if (data.amountDue !== undefined) {
    normalized.amountDue = toDecimalString(data.amountDue) ?? "0.00";
  }
  if (data.loyaltyPointsValue !== undefined) {
    normalized.loyaltyPointsValue = toDecimalString(data.loyaltyPointsValue) ?? "0.00";
  }
  if (data.loyaltyPointsUsed !== undefined) {
    normalized.loyaltyPointsUsed = data.loyaltyPointsUsed;
  }
  if (data.loyaltyPointsEarned !== undefined) {
    normalized.loyaltyPointsEarned = data.loyaltyPointsEarned;
  }
  if (data.paymentMethod !== undefined) {
    normalized.paymentMethod = data.paymentMethod ?? null;
  }
  if (data.paymentTransactionId !== undefined) {
    normalized.transactionId = data.paymentTransactionId ?? null;
  }
  if (data.notes !== undefined) {
    normalized.notes = data.notes ?? null;
  }
  if (data.lineItems !== undefined) {
    normalized.lineItems = data.lineItems;
  }
  if (data.dueDate !== undefined) {
    const dueDate = coerceDate(data.dueDate);
    if (dueDate !== undefined) {
      normalized.dueDate = dueDate;
    }
  }

  return insertInvoiceSchema.partial().parse(normalized);
}

export function normalizeDealCreate(data: DealCreate): InsertDeal {
  const normalized: Partial<InsertDeal> = {
    merchantId: data.merchantId,
    title: data.title,
    description: data.description,
    category: data.category,
    discountType: data.discountType,
    discountValue: toDecimalString(data.discountValue) ?? "0.00",
    originalPrice: toDecimalString(data.originalPrice) ?? null,
    finalPrice: toDecimalString(data.finalPrice) ?? null,
    isExclusive: data.isExclusive ?? false,
    membershipRequired: data.membershipRequired ?? null,
    usageLimit: data.usageLimit ?? null,
    perUserLimit: data.perUserLimit ?? null,
    terms: data.terms ?? null,
    redemptionInstructions: data.redemptionInstructions ?? null,
    tags: data.tags ?? null,
  };

  const validFrom = coerceDateOrUndefined(data.validFrom);
  if (validFrom !== undefined) {
    normalized.validFrom = validFrom;
  }

  const validUntil = coerceDateOrUndefined(data.validUntil);
  if (validUntil !== undefined) {
    normalized.validUntil = validUntil;
  }

  return insertDealSchema.parse(normalized);
}

export function normalizeDealUpdate(data: DealUpdate): Partial<InsertDeal> {
  const normalized: Partial<InsertDeal> = {};

  if (data.discountValue !== undefined) {
    normalized.discountValue = toDecimalString(data.discountValue) ?? "0.00";
  }
  if (data.originalPrice !== undefined) {
    normalized.originalPrice = toDecimalString(data.originalPrice) ?? null;
  }
  if (data.finalPrice !== undefined) {
    normalized.finalPrice = toDecimalString(data.finalPrice) ?? null;
  }
  if (data.validFrom !== undefined) {
    const validFrom = coerceDate(data.validFrom);
    if (validFrom !== undefined) {
      normalized.validFrom = validFrom;
    }
  }
  if (data.validUntil !== undefined) {
    const validUntil = coerceDate(data.validUntil);
    if (validUntil !== undefined) {
      normalized.validUntil = validUntil;
    }
  }
  if (data.isExclusive !== undefined) {
    normalized.isExclusive = data.isExclusive;
  }
  if (data.membershipRequired !== undefined) {
    normalized.membershipRequired = data.membershipRequired ?? null;
  }
  if (data.usageLimit !== undefined) {
    normalized.usageLimit = data.usageLimit ?? null;
  }
  if (data.perUserLimit !== undefined) {
    normalized.perUserLimit = data.perUserLimit ?? null;
  }
  if (data.terms !== undefined) {
    normalized.terms = data.terms ?? null;
  }
  if (data.redemptionInstructions !== undefined) {
    normalized.redemptionInstructions = data.redemptionInstructions ?? null;
  }
  if (data.tags !== undefined) {
    normalized.tags = data.tags ?? null;
  }

  return insertDealSchema.partial().parse(normalized);
}

export function normalizeCalendarEventCreate(data: CalendarEventCreate): InsertCalendarEvent {
  const normalized: Partial<InsertCalendarEvent> = {
    userId: data.userId,
    title: data.title,
    description: data.description ?? null,
    eventType: data.eventType,
    location: data.location ?? null,
    attendees: data.attendees ?? null,
    reminderMinutes: String(data.reminderMinutes ?? 15),
    isRecurring: data.isRecurring ?? false,
    recurrencePattern: data.recurrencePattern ?? null,
    relatedEntityId: data.relatedEntityId ?? null,
    relatedEntityType: data.relatedEntityType ?? null,
    metadata: data.metadata ?? null,
  };

  const startTime = coerceDateOrUndefined(data.startTime);
  if (startTime !== undefined) {
    normalized.startTime = startTime;
  }

  const endTime = coerceDateOrUndefined(data.endTime);
  if (endTime !== undefined) {
    normalized.endTime = endTime;
  }

  return insertCalendarEventSchema.parse(normalized);
}

export function normalizeCalendarEventUpdate(
  data: CalendarEventUpdate,
): Partial<InsertCalendarEvent> {
  const normalized: Partial<InsertCalendarEvent> = {};

  if (data.title !== undefined) {
    normalized.title = data.title ?? null;
  }
  if (data.description !== undefined) {
    normalized.description = data.description ?? null;
  }
  if (data.eventType !== undefined) {
    normalized.eventType = data.eventType ?? null;
  }
  if (data.location !== undefined) {
    normalized.location = data.location ?? null;
  }
  if (data.attendees !== undefined) {
    normalized.attendees = data.attendees ?? null;
  }
  if (data.reminderMinutes !== undefined) {
    normalized.reminderMinutes = data.reminderMinutes === null ? null : String(data.reminderMinutes);
  }
  if (data.isRecurring !== undefined) {
    normalized.isRecurring = data.isRecurring ?? null;
  }
  if (data.recurrencePattern !== undefined) {
    normalized.recurrencePattern = data.recurrencePattern ?? null;
  }
  if (data.relatedEntityId !== undefined) {
    normalized.relatedEntityId = data.relatedEntityId ?? null;
  }
  if (data.relatedEntityType !== undefined) {
    normalized.relatedEntityType = data.relatedEntityType ?? null;
  }
  if (data.metadata !== undefined) {
    normalized.metadata = data.metadata ?? null;
  }

  if (data.startTime !== undefined) {
    const startTime = coerceDate(data.startTime);
    if (startTime !== undefined) {
      normalized.startTime = startTime;
    }
  }

  if (data.endTime !== undefined) {
    const endTime = coerceDate(data.endTime);
    if (endTime !== undefined) {
      normalized.endTime = endTime;
    }
  }

  return insertCalendarEventSchema.partial().parse(normalized);
}


