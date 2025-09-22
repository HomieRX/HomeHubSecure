import { describe, expect, it } from "vitest";
import {
  normalizeWorkOrderCreate,
  normalizeWorkOrderUpdate,
  normalizeEstimateCreate,
  normalizeInvoiceCreate,
  normalizeDealCreate,
  normalizeCalendarEventCreate,
} from "../normalization";
import type {
  WorkOrderCreate,
  WorkOrderUpdate,
  EstimateCreate,
  InvoiceCreate,
  DealCreate,
  CalendarEventCreate,
} from "@shared/types";

const uuid = (suffix: string) => `00000000-0000-0000-0000-000000000${suffix}`;

describe("normalizeWorkOrderCreate", () => {
  it("coerces optional fields and dates for work orders", () => {
    const payload: WorkOrderCreate = {
      serviceRequestId: uuid("01"),
      homeManagerId: uuid("02"),
      contractorId: undefined,
      workOrderNumber: "WO-42",
      workDescription: "Replace HVAC filter and service unit",
      scheduledStartDate: "2025-01-15T13:00:00Z",
      scheduledEndDate: "2025-01-15T15:00:00Z",
    };

    const normalized = normalizeWorkOrderCreate(payload);

    expect(normalized.contractorId).toBeNull();
    expect(normalized.materialsNeeded).toBeNull();
    expect(normalized.workNotes).toBeNull();
    expect(normalized.beforeImages).toBeNull();
    expect(normalized.afterImages).toBeNull();
    expect(normalized.attachments).toBeNull();
    expect(normalized.scheduledStartDate).toBeInstanceOf(Date);
    expect(normalized.scheduledEndDate).toBeInstanceOf(Date);
    expect(normalized.scheduledStartDate?.toISOString()).toBe("2025-01-15T13:00:00.000Z");
    expect(normalized.scheduledEndDate?.toISOString()).toBe("2025-01-15T15:00:00.000Z");
  });
});

describe("normalizeWorkOrderUpdate", () => {
  it("omits invalid date updates while preserving valid ones", () => {
    const update: WorkOrderUpdate = {
      contractorId: uuid("03"),
      attachments: ["https://cdn.example.com/work-order/doc.pdf"],
      scheduledStartDate: "not-a-date",
      scheduledEndDate: "2025-02-01T09:30:00Z",
    };

    const normalized = normalizeWorkOrderUpdate(update);

    expect(normalized.contractorId).toBe(update.contractorId);
    expect(normalized.attachments).toEqual(update.attachments);
    expect("scheduledStartDate" in normalized).toBe(false);
    expect(normalized.scheduledEndDate).toBeInstanceOf(Date);
  });
});

describe("normalizeEstimateCreate", () => {
  it("casts numeric fields to fixed decimal strings", () => {
    const payload: EstimateCreate = {
      serviceRequestId: uuid("04"),
      contractorId: uuid("05"),
      estimateNumber: "EST-100",
      title: "Kitchen renovation",
      description: "Full kitchen remodel including cabinets and flooring",
      laborCost: 1250.5,
      materialCost: 2300,
      additionalCosts: 75.25,
      totalCost: 3625.75,
      estimatedHours: 42,
      startDate: "2025-03-10T09:00:00Z",
      completionDate: "2025-03-20T17:00:00Z",
      validUntil: "2025-04-01T00:00:00Z",
    };

    const normalized = normalizeEstimateCreate(payload);

    expect(normalized.laborCost).toBe("1250.50");
    expect(normalized.materialCost).toBe("2300.00");
    expect(normalized.additionalCosts).toBe("75.25");
    expect(normalized.totalCost).toBe("3625.75");
    expect(normalized.estimatedHours).toBe("42.00");
    expect(normalized.startDate).toBeInstanceOf(Date);
    expect(normalized.completionDate).toBeInstanceOf(Date);
    expect(normalized.validUntil).toBeInstanceOf(Date);
  });
});

describe("normalizeInvoiceCreate", () => {
  it("normalizes invoice monetary and loyalty fields", () => {
    const payload: InvoiceCreate = {
      workOrderId: uuid("06"),
      memberId: uuid("07"),
      invoiceNumber: "INV-9001",
      subtotal: 100,
      tax: 6.25,
      total: 106.25,
      amountDue: 50,
      loyaltyPointsUsed: 10,
      loyaltyPointsValue: 25,
      loyaltyPointsEarned: 5,
      dueDate: "2025-05-01T00:00:00Z",
      paymentMethod: "credit",
      paymentTransactionId: "txn_123",
      lineItems: [
        {
          description: "Labor",
          quantity: 5,
          unitPrice: 20,
          totalPrice: 100,
          category: "labor",
        },
      ],
      notes: "Thank you",
    };

    const normalized = normalizeInvoiceCreate(payload);

    expect(normalized.subtotal).toBe("100.00");
    expect(normalized.tax).toBe("6.25");
    expect(normalized.total).toBe("106.25");
    expect(normalized.amountDue).toBe("50.00");
    expect(normalized.loyaltyPointsValue).toBe("25.00");
    expect(normalized.loyaltyPointsUsed).toBe(10);
    expect(normalized.transactionId).toBe("txn_123");
    expect(normalized.dueDate).toBeInstanceOf(Date);
  });
});

describe("normalizeDealCreate", () => {
  it("throws for invalid date payloads", () => {
    const payload: DealCreate = {
      merchantId: uuid("08"),
      title: "Spring savings",
      description: "15% off seasonal services",
      category: "seasonal",
      discountType: "percentage",
      discountValue: 15,
      validFrom: "not-a-date",
      validUntil: "2025-06-01T00:00:00Z",
      isExclusive: true,
    };

    expect(() => normalizeDealCreate(payload)).toThrow();
  });
});

describe("normalizeCalendarEventCreate", () => {
  it("converts ISO strings to Date instances", () => {
    const payload: CalendarEventCreate = {
      userId: uuid("09"),
      title: "Site walk",
      description: "Walkthrough before project kickoff",
      startTime: "2025-07-07T14:00:00Z",
      endTime: "2025-07-07T15:30:00Z",
      eventType: "meeting",
      reminderMinutes: 30,
      isRecurring: false,
    };

    const normalized = normalizeCalendarEventCreate(payload);

    expect(normalized.startTime).toBeInstanceOf(Date);
    expect(normalized.endTime).toBeInstanceOf(Date);
    expect(normalized.description).toBe(payload.description);
  });
});
