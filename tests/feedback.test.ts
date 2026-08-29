import { describe, it, expect, beforeEach } from "vitest";
import { feedbackRepository } from "../lib/repositories/feedbackRepository";

describe("Public Feedback & Complaint System", () => {
  it("should create a new citizen report with unique reference code and initial timeline", async () => {
    const report = await feedbackRepository.createReport({
      category: "BUS_SERVICE",
      issueType: "BUS_DELAYED",
      issueTitle: "Bus 108 delayed by 25 mins",
      description: "Bus 108 towards Pohegaon did not arrive at Kopargaon Bus Stand at scheduled time.",
      citizenSeverity: "NORMAL",
      latitude: 19.8874,
      longitude: 74.4795,
      locationName: "Kopargaon Central Bus Stand",
      relatedEntityType: "BUS",
      relatedEntityId: "BUS-108",
      relatedEntityName: "Bus BUS-108 (Route 01)",
      citizenName: "Ramesh Shinde",
      citizenPhone: "+91 98220 14592",
    });

    expect(report).toBeDefined();
    expect(report.referenceCode).toMatch(/^KM-2026-00\d{4}$/);
    expect(report.status).toBe("UNDER_REVIEW");
    expect(report.operationalPriority).toBe("NORMAL");
    expect(report.updates.length).toBeGreaterThanOrEqual(2);
    expect(report.updates[0].isPublic).toBe(true);
  });

  it("should detect recurring issues when multiple complaints occur on the same entity or corridor", async () => {
    // Create 2 additional reports on BUS-108
    await feedbackRepository.createReport({
      category: "BUS_SERVICE",
      issueType: "BUS_DELAYED",
      description: "Bus 108 delayed again yesterday evening.",
      citizenSeverity: "NORMAL",
      latitude: 19.8874,
      longitude: 74.4795,
      locationName: "Kopargaon Bus Stand",
      relatedEntityType: "BUS",
      relatedEntityId: "BUS-108",
    });

    const report3 = await feedbackRepository.createReport({
      category: "BUS_SERVICE",
      issueType: "BUS_DELAYED",
      description: "Third time this week Bus 108 is late.",
      citizenSeverity: "NORMAL",
      latitude: 19.8874,
      longitude: 74.4795,
      locationName: "Kopargaon Bus Stand",
      relatedEntityType: "BUS",
      relatedEntityId: "BUS-108",
    });

    expect(report3.isRecurring).toBe(true);
    expect(report3.recurringCount).toBeGreaterThanOrEqual(3);
    // Recurring issues should receive elevated operational priority
    expect(report3.operationalPriority).toBe("HIGH");

    const recurringList = await feedbackRepository.getRecurringIssues();
    const busEntry = recurringList.find((r) => r.entityId === "BUS-108");
    expect(busEntry).toBeDefined();
  });

  it("should assign report to an operational team and append public and internal notes", async () => {
    const report = await feedbackRepository.createReport({
      category: "ROAD_TRAFFIC",
      issueType: "POTHOLE",
      description: "Pothole on SH-7 near Savalyavihar.",
      citizenSeverity: "URGENT",
      latitude: 19.852,
      longitude: 74.548,
      locationName: "SH-7 Km 14",
    });

    const assigned = await feedbackRepository.assignTeam(
      report.id,
      "ROAD_MAINTENANCE",
      "PWD Quick Patch Unit",
      "Priority repair before evening truck traffic."
    );

    expect(assigned.assignment).toBeDefined();
    expect(assigned.assignment?.team).toBe("ROAD_MAINTENANCE");
    expect(assigned.status).toBe("ASSIGNED");

    // Internal note should be marked isPublic = false
    const internalNote = assigned.updates.find((u) => !u.isPublic);
    expect(internalNote).toBeDefined();
    expect(internalNote?.message).toContain("Priority repair");

    // Public update should exist for citizen
    const publicUpdate = assigned.updates.find(
      (u) => u.isPublic && u.message.includes("Assigned to PWD Road Maintenance Crew")
    );
    expect(publicUpdate).toBeDefined();
  });

  it("should verify and promote critical complaint into an active operational incident", async () => {
    const report = await feedbackRepository.createReport({
      category: "ROAD_TRAFFIC",
      issueType: "ROAD_BLOCKAGE",
      description: "Truck axle broken, completely blocking SH-7 Savalyavihar turn.",
      citizenSeverity: "URGENT",
      latitude: 19.852,
      longitude: 74.548,
      locationName: "SH-7 Savalyavihar Turn",
      relatedEntityType: "ROAD_SEGMENT",
      relatedEntityId: "KPG-14",
    });

    const { report: updatedReport, incident } = await feedbackRepository.promoteToIncident(
      report.id,
      "Road Blockage on KPG-14 (Citizen Verified)",
      "HIGH"
    );

    expect(incident).toBeDefined();
    expect(incident.code).toMatch(/^INC-\d+/);
    expect(incident.status).toBe("ACTIVE");
    expect(incident.coordinates.lat).toBe(19.852);

    expect(updatedReport.promotedIncidentId).toBe(incident.code);
    expect(updatedReport.status).toBe("IN_PROGRESS");
    expect(updatedReport.operationalPriority).toBe("CRITICAL");
  });

  it("should maintain strict privacy separation between public updates and internal notes", async () => {
    const report = await feedbackRepository.createReport({
      category: "BUS_SERVICE",
      issueType: "DRIVER_SERVICE_ISSUE",
      description: "Conductor did not return change.",
      citizenSeverity: "LOW",
      latitude: 19.8874,
      longitude: 74.4795,
      locationName: "Kopargaon Bus Stand",
    });

    await feedbackRepository.addInternalNote(
      report.id,
      "Driver log checked: Conductor ID #4412 reprimanded internally.",
      "Depot Supervisor",
      "Depot Manager"
    );

    await feedbackRepository.addPublicResponse(
      report.id,
      "We have reviewed the incident and addressed it with the depot crew.",
      "Customer Support",
      "Mobility Administrator"
    );

    const fetchedReport = await feedbackRepository.getReportById(report.id);
    expect(fetchedReport).toBeDefined();

    const publicUpdatesOnly = fetchedReport!.updates.filter((u) => u.isPublic);
    const internalNotesOnly = fetchedReport!.updates.filter((u) => !u.isPublic);

    expect(publicUpdatesOnly.some((u) => u.message.includes("Conductor ID #4412"))).toBe(false);
    expect(internalNotesOnly.some((u) => u.message.includes("Conductor ID #4412"))).toBe(true);
    expect(publicUpdatesOnly.some((u) => u.message.includes("addressed it with the depot crew"))).toBe(true);
  });
});
