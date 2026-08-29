// KOPA-MOVE Snapshot Management Engine
import { db } from "./db";
import { RecoverySnapshot, SnapshotStatus } from "./types";
import { computeChecksum } from "./recoveryLedger";

/**
 * Capture a complete verified snapshot of all domain entities.
 */
export async function createRecoverySnapshot(
  forcedStatus: SnapshotStatus = "VERIFIED"
): Promise<RecoverySnapshot> {
  const buses = await db.buses.toArray();
  const routes = await db.routes.toArray();
  const shipments = await db.cargoShipments.toArray();
  const complaints = await db.complaints.toArray();
  const incidents = await db.roadIncidents.toArray();
  const evChargers = await db.evChargers.toArray();
  const demandObservations = await db.demandObservations.toArray();
  const depotDispatches = await db.depotDispatches.toArray();

  // Find highest sequence number from recovery events
  const latestEvent = await db.recoveryEvents.orderBy("sequence_number").last();
  const includedSeq = latestEvent ? latestEvent.sequence_number : 0;

  const data = {
    buses,
    routes,
    shipments,
    complaints,
    incidents,
    evChargers,
    demandObservations,
    depotDispatches,
  };

  const checksum = computeChecksum(data);
  const snapshotId = `SNAP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;

  const snapshot: RecoverySnapshot = {
    snapshot_id: snapshotId,
    created_at: new Date().toISOString(),
    included_event_sequence: includedSeq,
    state_checksum: checksum,
    status: forcedStatus,
    data,
  };

  await db.recoverySnapshots.put(snapshot);

  // Update last verified snapshot reference in meta
  await db.meta.put({
    key: "last_verified_snapshot_id",
    value: snapshotId,
    updated_at: new Date().toISOString(),
  });

  return snapshot;
}

/**
 * Get the latest verified snapshot from Dexie DB.
 */
export async function getLastVerifiedSnapshot(): Promise<RecoverySnapshot | null> {
  const metaRec = await db.meta.get("last_verified_snapshot_id");
  if (metaRec && metaRec.value) {
    const snap = await db.recoverySnapshots.get(metaRec.value);
    if (snap && snap.status === "VERIFIED") return snap;
  }

  // Fallback: search for newest VERIFIED snapshot
  const verifiedSnaps = await db.recoverySnapshots
    .where("status")
    .equals("VERIFIED")
    .reverse()
    .sortBy("created_at");

  return verifiedSnaps.length > 0 ? verifiedSnaps[0] : null;
}

/**
 * Restore local IndexedDB domain tables from a verified snapshot.
 */
export async function restoreDatabaseFromSnapshot(snapshot: RecoverySnapshot): Promise<void> {
  const { data } = snapshot;

  await db.transaction(
    "rw",
    [
      db.buses,
      db.routes,
      db.cargoShipments,
      db.complaints,
      db.roadIncidents,
      db.evChargers,
      db.demandObservations,
      db.depotDispatches,
    ],
    async () => {
      if (data.buses) {
        await db.buses.clear();
        await db.buses.bulkPut(data.buses);
      }
      if (data.routes) {
        await db.routes.clear();
        await db.routes.bulkPut(data.routes);
      }
      if (data.shipments) {
        await db.cargoShipments.clear();
        await db.cargoShipments.bulkPut(data.shipments);
      }
      if (data.complaints) {
        await db.complaints.clear();
        await db.complaints.bulkPut(data.complaints);
      }
      if (data.incidents) {
        await db.roadIncidents.clear();
        await db.roadIncidents.bulkPut(data.incidents);
      }
      if (data.evChargers) {
        await db.evChargers.clear();
        await db.evChargers.bulkPut(data.evChargers);
      }
      if (data.demandObservations) {
        await db.demandObservations.clear();
        await db.demandObservations.bulkPut(data.demandObservations);
      }
      if (data.depotDispatches) {
        await db.depotDispatches.clear();
        await db.depotDispatches.bulkPut(data.depotDispatches);
      }
    }
  );
}
