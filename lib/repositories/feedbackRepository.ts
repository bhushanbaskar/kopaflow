import {
  FeedbackReport,
  FeedbackStatus,
  FeedbackCategory,
  OperationalPriority,
  OperationalTeam,
  RoadIncident,
  FeedbackAnalyticsSummary,
} from "../domain/types";
import {
  IFeedbackRepository,
  FeedbackFilterOptions,
  CreateReportInput,
} from "./types";
import { MOCK_FEEDBACK_REPORTS } from "../../mock/mockFeedbackData";
import { MOCK_INCIDENTS } from "../../mock/kopargaonData";
import { db } from "../resilience/db";
import { syncEngine } from "../resilience/syncEngine";

class MockFeedbackRepository implements IFeedbackRepository {
  private reports: FeedbackReport[] = [...MOCK_FEEDBACK_REPORTS];

  constructor() {
    this.hydrateFromIndexedDB();
  }

  private async hydrateFromIndexedDB() {
    try {
      const stored = await db.complaints.toArray();
      if (stored && stored.length > 0) {
        this.reports = stored;
      } else {
        await db.complaints.bulkPut(this.reports);
      }
    } catch (e) {
      // Fallback
    }
  }

  async getAllReports(filters?: FeedbackFilterOptions): Promise<FeedbackReport[]> {
    try {
      const stored = await db.complaints.toArray();
      if (stored && stored.length > 0) {
        this.reports = stored;
      }
    } catch (e) {
      // Ignore
    }

    let result = [...this.reports];

    if (filters) {
      if (filters.status && filters.status !== "ALL") {
        result = result.filter((r) => r.status === filters.status);
      }
      if (filters.category && filters.category !== "ALL") {
        result = result.filter((r) => r.category === filters.category);
      }
      if (filters.priority && filters.priority !== "ALL") {
        result = result.filter((r) => r.operationalPriority === filters.priority);
      }
      if (filters.relatedEntityId) {
        result = result.filter((r) => r.relatedEntityId === filters.relatedEntityId);
      }
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        result = result.filter(
          (r) =>
            r.referenceCode.toLowerCase().includes(query) ||
            r.issueTitle.toLowerCase().includes(query) ||
            r.description.toLowerCase().includes(query) ||
            r.locationName.toLowerCase().includes(query) ||
            (r.relatedEntityName && r.relatedEntityName.toLowerCase().includes(query)) ||
            (r.citizenName && r.citizenName.toLowerCase().includes(query))
        );
      }
    }

    // Sort latest first
    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getReportById(id: string): Promise<FeedbackReport | null> {
    try {
      const fromDb = await db.complaints.get(id);
      if (fromDb) return fromDb;
    } catch (e) {
      // Ignore
    }
    const report = this.reports.find((r) => r.id === id);
    return report ? { ...report } : null;
  }

  async getReportByReferenceCode(referenceCode: string): Promise<FeedbackReport | null> {
    const normalized = referenceCode.trim().toUpperCase();
    try {
      const fromDb = await db.complaints.where("referenceCode").equals(normalized).first();
      if (fromDb) return fromDb;
    } catch (e) {
      // Ignore
    }
    const report = this.reports.find(
      (r) => r.referenceCode.toUpperCase() === normalized
    );
    return report ? { ...report } : null;
  }

  async getUserReports(userId?: string): Promise<FeedbackReport[]> {
    if (userId) {
      return this.reports.filter((r) => r.userId === userId);
    }
    return [...this.reports].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createReport(input: CreateReportInput): Promise<FeedbackReport> {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const referenceCode = `KM-2026-00${randomSuffix}`;
    const newId = `fb-${Date.now()}`;
    const nowIso = new Date().toISOString();

    let operationalPriority: OperationalPriority = "NORMAL";
    if (input.citizenSeverity === "URGENT") {
      if (input.category === "ROAD_SAFETY" || input.category === "ROAD_TRAFFIC") {
        operationalPriority = "HIGH";
      } else {
        operationalPriority = "NORMAL";
      }
    } else if (input.citizenSeverity === "LOW") {
      operationalPriority = "LOW";
    }

    const existingSimilar = this.reports.filter(
      (r) =>
        (input.relatedEntityId && r.relatedEntityId === input.relatedEntityId) ||
        (r.category === input.category && r.locationName.toLowerCase() === input.locationName.toLowerCase())
    );

    const isRecurring = existingSimilar.length >= 2;
    const recurringCount = isRecurring ? existingSimilar.length + 1 : undefined;

    if (isRecurring && operationalPriority === "NORMAL") {
      operationalPriority = "HIGH";
    }

    const attachments = input.photoUrl
      ? [
          {
            id: `att-${Date.now()}`,
            feedbackId: newId,
            url: input.photoUrl,
            fileName: input.photoFileName || "attached_photo.jpg",
            mimeType: input.photoMimeType || "image/jpeg",
            fileSizeBytes: input.photoSizeBytes || 250000,
            createdAt: nowIso,
          },
        ]
      : [];

    const issueTitle =
      input.issueTitle ||
      `${input.category.replace(/_/g, " ")}: ${input.issueType.replace(/_/g, " ")}`;

    const newReport: FeedbackReport = {
      id: newId,
      referenceCode,
      citizenName: input.isAnonymous ? undefined : input.citizenName || "Citizen Reporter",
      citizenPhone: input.isAnonymous ? undefined : input.citizenPhone,
      citizenEmail: input.isAnonymous ? undefined : input.citizenEmail,
      isAnonymous: input.isAnonymous ?? false,
      category: input.category,
      issueType: input.issueType,
      issueTitle,
      description: input.description,
      status: "UNDER_REVIEW",
      citizenSeverity: input.citizenSeverity,
      operationalPriority,
      location: {
        lat: input.latitude,
        lng: input.longitude,
        label: input.locationName,
      },
      locationName: input.locationName,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      relatedEntityName: input.relatedEntityName,
      attachments,
      updates: [
        {
          id: `upd-${Date.now()}-1`,
          feedbackId: newId,
          status: "SUBMITTED",
          message: "Report received and registered in Kopargaon Mobility OS.",
          isPublic: true,
          authorName: "System",
          authorRole: "Automated Gateway",
          createdAt: nowIso,
        },
        {
          id: `upd-${Date.now()}-2`,
          feedbackId: newId,
          status: "UNDER_REVIEW",
          message: "Routed to mobility operations desk for verification.",
          isPublic: true,
          authorName: "Operations Dispatcher",
          authorRole: "Mobility Administrator",
          createdAt: nowIso,
        },
      ],
      occurredAt: input.occurredAt || nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
      isRecurring,
      recurringCount,
    };

    this.reports.unshift(newReport);
    try {
      await db.complaints.put(newReport);
    } catch (e) {
      // Ignore
    }

    // Resilience Core journal
    await syncEngine.submitOperation({
      entity_type: "COMPLAINT",
      entity_id: newId,
      operation_type: "COMPLAINT_CREATED",
      payload: newReport,
      idempotency_key: `IDEMP-COMPLAINT-${newId}`,
    });

    return { ...newReport };
  }

  async updateStatus(
    reportId: string,
    status: FeedbackStatus,
    message?: string,
    authorName: string = "Operations Desk",
    authorRole: string = "Mobility Administrator",
    isPublic: boolean = true
  ): Promise<FeedbackReport> {
    const report = await this.getReportById(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    const nowIso = new Date().toISOString();
    report.status = status;
    report.updatedAt = nowIso;
    if (status === "RESOLVED") {
      report.resolvedAt = nowIso;
    }

    if (message && message.trim()) {
      report.updates.push({
        id: `upd-${Date.now()}`,
        feedbackId: reportId,
        status,
        message: message.trim(),
        isPublic,
        authorName,
        authorRole,
        createdAt: nowIso,
      });
    }

    const reportIndex = this.reports.findIndex((r) => r.id === reportId);
    if (reportIndex !== -1) {
      this.reports[reportIndex] = report;
    }
    try {
      await db.complaints.put(report);
    } catch (e) {
      // Ignore
    }

    await syncEngine.submitOperation({
      entity_type: "COMPLAINT",
      entity_id: reportId,
      operation_type: "COMPLAINT_STATUS_CHANGED",
      payload: report,
    });

    return { ...report };
  }

  async assignTeam(
    reportId: string,
    team: OperationalTeam,
    assignedTo?: string,
    internalNote?: string
  ): Promise<FeedbackReport> {
    const report = await this.getReportById(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    const nowIso = new Date().toISOString();
    const teamLabels: Record<OperationalTeam, string> = {
      DEPOT_TEAM: "Central Bus Depot Team",
      TRAFFIC_TEAM: "Traffic & Highway Patrol",
      ROAD_MAINTENANCE: "PWD Road Maintenance Crew",
      EV_OPERATIONS: "EV Infrastructure Operations",
      LOGISTICS_TEAM: "Agri Logistics Dispatch Desk",
      SAFETY_TEAM: "Road Safety Inspection Cell",
    };

    report.assignment = {
      id: `asg-${Date.now()}`,
      feedbackId: reportId,
      team,
      assignedTo: assignedTo || teamLabels[team],
      assignedAt: nowIso,
      note: internalNote,
    };

    if (report.status === "SUBMITTED" || report.status === "UNDER_REVIEW") {
      report.status = "ASSIGNED";
    }
    report.updatedAt = nowIso;

    report.updates.push({
      id: `upd-${Date.now()}-pub`,
      feedbackId: reportId,
      status: report.status,
      message: `Assigned to ${teamLabels[team]}${assignedTo ? ` (${assignedTo})` : ""} for operational action.`,
      isPublic: true,
      authorName: "Control Center",
      authorRole: "Mobility Administrator",
      createdAt: nowIso,
    });

    if (internalNote && internalNote.trim()) {
      report.updates.push({
        id: `upd-${Date.now()}-int`,
        feedbackId: reportId,
        status: report.status,
        message: `[INTERNAL NOTE] ${internalNote.trim()}`,
        isPublic: false,
        authorName: "Assignment Desk",
        authorRole: "Operator",
        createdAt: nowIso,
      });
    }

    const reportIndex = this.reports.findIndex((r) => r.id === reportId);
    if (reportIndex !== -1) {
      this.reports[reportIndex] = report;
    }
    try {
      await db.complaints.put(report);
    } catch (e) {
      // Ignore
    }

    await syncEngine.submitOperation({
      entity_type: "COMPLAINT",
      entity_id: reportId,
      operation_type: "COMPLAINT_ASSIGNED",
      payload: report,
    });

    return { ...report };
  }

  async addInternalNote(
    reportId: string,
    note: string,
    authorName: string = "Staff Operator",
    authorRole: string = "Mobility Operator"
  ): Promise<FeedbackReport> {
    const report = await this.getReportById(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    const nowIso = new Date().toISOString();
    report.updates.push({
      id: `upd-${Date.now()}`,
      feedbackId: reportId,
      status: report.status,
      message: note.trim(),
      isPublic: false,
      authorName,
      authorRole,
      createdAt: nowIso,
    });

    report.updatedAt = nowIso;
    const reportIndex = this.reports.findIndex((r) => r.id === reportId);
    if (reportIndex !== -1) {
      this.reports[reportIndex] = report;
    }
    try {
      await db.complaints.put(report);
    } catch (e) {
      // Ignore
    }

    await syncEngine.submitOperation({
      entity_type: "COMPLAINT",
      entity_id: reportId,
      operation_type: "COMPLAINT_NOTE_ADDED",
      payload: report,
    });

    return { ...report };
  }

  async addPublicResponse(
    reportId: string,
    response: string,
    authorName: string = "Mobility Operations Desk",
    authorRole: string = "Mobility Administrator"
  ): Promise<FeedbackReport> {
    const report = await this.getReportById(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    const nowIso = new Date().toISOString();
    report.updates.push({
      id: `upd-${Date.now()}`,
      feedbackId: reportId,
      status: report.status,
      message: response.trim(),
      isPublic: true,
      authorName,
      authorRole,
      createdAt: nowIso,
    });

    report.updatedAt = nowIso;
    const reportIndex = this.reports.findIndex((r) => r.id === reportId);
    if (reportIndex !== -1) {
      this.reports[reportIndex] = report;
    }
    try {
      await db.complaints.put(report);
    } catch (e) {
      // Ignore
    }

    await syncEngine.submitOperation({
      entity_type: "COMPLAINT",
      entity_id: reportId,
      operation_type: "COMPLAINT_NOTE_ADDED",
      payload: report,
    });

    return { ...report };
  }

  async promoteToIncident(
    reportId: string,
    incidentTitle?: string,
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "HIGH"
  ): Promise<{ report: FeedbackReport; incident: RoadIncident }> {
    const report = await this.getReportById(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    const incidentCode = `INC-0${MOCK_INCIDENTS.length + 1}`;
    const nowIso = new Date().toISOString();
    const title = incidentTitle || `Citizen Verified: ${report.issueTitle}`;

    const newIncident: RoadIncident = {
      id: `inc-${Date.now()}`,
      code: incidentCode,
      title,
      type:
        report.category === "ROAD_TRAFFIC"
          ? "ROAD_BLOCKAGE"
          : report.category === "EV_CHARGING"
          ? "EV_CHARGER_OUTAGE"
          : "ROUTE_DISRUPTION",
      severity,
      locationDescription: report.locationName,
      coordinates: report.location,
      roadSegmentId: report.relatedEntityType === "ROAD_SEGMENT" ? report.relatedEntityId : undefined,
      reportedTime: nowIso,
      status: "ACTIVE",
      affectedRouteIds: ["R-01", "R-02"],
      affectedShipmentIds: [],
      detourRecommendation: "Divert via Godavari Ring Link Road to bypass obstruction",
      impactSummary: `Verified from citizen report ${report.referenceCode}. Active response underway.`,
      delayPropagationMinutes: 20,
    };

    MOCK_INCIDENTS.unshift(newIncident);

    report.promotedIncidentId = newIncident.code;
    report.operationalPriority = "CRITICAL";
    report.status = "IN_PROGRESS";
    report.verifiedBy = "Control Center Supervisor";
    report.updatedAt = nowIso;

    report.updates.push({
      id: `upd-${Date.now()}-inc`,
      feedbackId: reportId,
      status: "IN_PROGRESS",
      message: `Verified and escalated to official Operational Incident [${incidentCode}]. Traffic control & dispatch active.`,
      isPublic: true,
      authorName: "Control Room Supervisor",
      authorRole: "Mobility Administrator",
      createdAt: nowIso,
    });

    const reportIndex = this.reports.findIndex((r) => r.id === reportId);
    if (reportIndex !== -1) {
      this.reports[reportIndex] = report;
    }
    try {
      await db.complaints.put(report);
      await db.roadIncidents.put(newIncident);
    } catch (e) {
      // Ignore
    }

    await syncEngine.submitOperation({
      entity_type: "ROAD_INCIDENT",
      entity_id: newIncident.id,
      operation_type: "ROAD_INCIDENT_CREATED",
      payload: newIncident,
    });

    return { report: { ...report }, incident: newIncident };
  }

  async getAnalyticsSummary(): Promise<FeedbackAnalyticsSummary> {
    const total = this.reports.length;
    const resolved = this.reports.filter((r) => r.status === "RESOLVED" || r.status === "CLOSED").length;
    const open = total - resolved;
    const safety = this.reports.filter(
      (r) => r.category === "ROAD_SAFETY" || r.operationalPriority === "HIGH" || r.operationalPriority === "CRITICAL"
    ).length;
    const recurring = this.reports.filter((r) => r.isRecurring).length;

    return {
      openReportsCount: open,
      resolvedReportsCount: resolved,
      avgResolutionHours: 18.5,
      reportsThisWeekCount: total,
      safetyReportsCount: safety,
      recurringIssuesCount: recurring,
    };
  }

  async getRecurringIssues(): Promise<
    {
      entityId: string;
      entityName: string;
      category: FeedbackCategory;
      count: number;
      reportIds: string[];
      description: string;
    }[]
  > {
    const recurringMap = new Map<
      string,
      {
        entityId: string;
        entityName: string;
        category: FeedbackCategory;
        count: number;
        reportIds: string[];
        description: string;
      }
    >();

    for (const r of this.reports) {
      if (r.relatedEntityId && r.isRecurring) {
        const key = `${r.relatedEntityId}-${r.category}`;
        if (!recurringMap.has(key)) {
          recurringMap.set(key, {
            entityId: r.relatedEntityId,
            entityName: r.relatedEntityName || r.relatedEntityId,
            category: r.category,
            count: r.recurringCount || 2,
            reportIds: [r.id],
            description: `Multiple repeated reports (${r.issueTitle}) on corridor.`,
          });
        } else {
          const entry = recurringMap.get(key)!;
          entry.reportIds.push(r.id);
        }
      }
    }

    return Array.from(recurringMap.values());
  }
}

export const feedbackRepository: IFeedbackRepository = new MockFeedbackRepository();
