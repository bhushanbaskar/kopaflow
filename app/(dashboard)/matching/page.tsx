"use client";

import React, { useState } from "react";
import {
  ArrowLeftRight,
  CheckCircle2,
  Info,
} from "lucide-react";
import { DataSourceBadge } from "../../../components/shared/DataSourceBadge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { ConfirmDialog } from "../../../components/shared/ConfirmDialog";
import {
  MOCK_BUS_FLEET,
  MOCK_AGRI_SHIPMENTS,
} from "../../../mock/kopargaonData";
import {
  formatWeightKg,
  formatPercent,
  formatInr,
} from "../../../lib/utils/formatters";

export default function CapacityMatchingPage() {
  const [selectedBusId, setSelectedBusId] = useState<string>("BUS-108");
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([
    "AG-001",
    "AG-005",
  ]);
  const [isAllocated, setIsAllocated] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const activeBus =
    MOCK_BUS_FLEET.find((b) => b.id === selectedBusId) || MOCK_BUS_FLEET[1];

  const candidateShipments = MOCK_AGRI_SHIPMENTS.filter(
    (s) => s.status === "PENDING" || s.status === "MATCHED"
  );

  const matchedWeight = selectedShipmentIds.reduce((sum, id) => {
    const s = MOCK_AGRI_SHIPMENTS.find((item) => item.id === id);
    return sum + (s?.totalWeightKg || 0);
  }, 0);

  const capacityUtilizationPct = Math.min(
    100,
    Math.round((matchedWeight / activeBus.maxParcelCapacityKg) * 100)
  );

  const handleToggleShipment = (id: string) => {
    if (selectedShipmentIds.includes(id)) {
      setSelectedShipmentIds(selectedShipmentIds.filter((item) => item !== id));
    } else {
      setSelectedShipmentIds([...selectedShipmentIds, id]);
    }
  };

  const handleConfirmAllocation = () => {
    setIsAllocated(true);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-6">
      {/* Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-[22px] border border-black/[0.06] shadow-xs space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              CAPACITY MATCHING ENGINE
            </h1>
            <DataSourceBadge type="SIMULATED" />
          </div>
          <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full font-bold shadow-xs">
            Constraint Safe
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Match agricultural shipments with unused luggage capacity on existing public buses heading to APMC Kopargaon.
        </p>
      </div>

      {/* 1. BEST AVAILABLE OPTION (Highlighted Recommendation Card) */}
      <div className="app-card rounded-[24px] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-black/[0.04] pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase text-emerald-700 font-bold tracking-wider">
              Optimization Recommendation
            </div>
            <h2 className="text-sm sm:text-base font-bold font-mono text-gray-950 mt-0.5">
              BEST AVAILABLE TRANSPORT OPTION
            </h2>
          </div>
          <StatusBadge
            label={isAllocated ? "ALLOCATED" : "RECOMMENDED"}
            variant={isAllocated ? "operational" : "informational"}
          />
        </div>

        {/* Bus Summary Row */}
        <div className="p-3.5 bg-gray-50/90 rounded-2xl border border-black/[0.04] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs">
                🚍
              </div>
              <div>
                <div className="text-xs font-bold text-gray-950 font-mono">{activeBus.busNumber}</div>
                <div className="text-[11px] text-gray-500">{activeBus.routeName}</div>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-xs font-bold text-gray-950">07:42 Departure</div>
              <div className="text-[11px] text-emerald-800 font-bold">08:27 APMC Arrival</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-black/[0.04] text-center font-mono text-xs">
            <div>
              <div className="text-[9px] text-gray-500 font-semibold uppercase">Passenger Load</div>
              <div className="font-bold text-gray-900 mt-0.5">{formatPercent(activeBus.predictedOccupancyPercentage)}</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-500 font-semibold uppercase">Luggage Space</div>
              <div className="font-bold text-emerald-800 mt-0.5">{formatWeightKg(activeBus.availableParcelCapacityKg)}</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-500 font-semibold uppercase">Utilization</div>
              <div className="font-bold text-blue-700 mt-0.5">{capacityUtilizationPct}%</div>
            </div>
          </div>
        </div>

        {/* Matched Cargo Manifest */}
        <div className="space-y-2">
          <div className="text-xs font-bold font-mono text-gray-900 uppercase">
            Allocated Agricultural Crop Cargo:
          </div>
          <div className="app-card-green p-3.5 rounded-2xl flex items-center justify-between text-xs font-mono shadow-xs">
            <div>
              <div className="font-bold text-emerald-950 text-[11.5px]">
                120 kg Onion (Savalyavihar) + 35 kg Guava
              </div>
              <div className="text-[10.5px] text-emerald-800 font-sans mt-0.5">
                Total Weight: <strong>{formatWeightKg(matchedWeight)}</strong> (Leaves 25 kg buffer)
              </div>
            </div>
            <div className="text-right">
              <div className="text-emerald-950 font-bold text-xs">₹240 Saved</div>
              <div className="text-[10px] text-emerald-800 font-semibold">1 Truck Saved</div>
            </div>
          </div>
        </div>

        {/* Explainable Rationale */}
        <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-black/[0.04] space-y-1 text-xs text-gray-700">
          <div className="font-bold text-gray-950 text-[10.5px] uppercase font-mono flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Why this option?</span>
          </div>
          <ul className="space-y-0.5 text-[11px] list-disc list-inside leading-relaxed text-gray-600">
            <li>Existing scheduled route passes Savalyavihar pickup hub at 07:42.</li>
            <li>Arrival at APMC at 08:27 precedes the 09:00 AM daily auction cutoff.</li>
            <li>Passenger seating is safely protected (68% load is below the 85% safety cap).</li>
            <li>Eliminates 1 separate mini-truck run on congested corridor KPG-14.</li>
          </ul>
        </div>

        {/* Action Button */}
        {isAllocated ? (
          <div className="p-3.5 bg-emerald-100/80 border border-emerald-300/60 rounded-2xl text-xs font-mono font-bold text-emerald-900 flex items-center justify-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>ALLOCATION COMMITTED TO DISPATCH BOARD</span>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={selectedShipmentIds.length === 0}
            className="w-full py-3.5 px-4 bg-gray-950 hover:bg-black disabled:opacity-50 text-white rounded-2xl text-xs font-mono font-bold tracking-wider flex items-center justify-center gap-2 touch-press shadow-md transition-all"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>CONFIRM ALLOCATION ({formatWeightKg(matchedWeight)})</span>
          </button>
        )}
      </div>

      {/* 2. Candidate Shipments Checkbox List */}
      <div className="bg-white border border-black/[0.06] rounded-[24px] p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-gray-950 uppercase">
            Candidate Agricultural Shipments ({candidateShipments.length})
          </span>
          <span className="text-[10px] font-mono text-gray-500">
            Select items to include
          </span>
        </div>

        <div className="space-y-2">
          {candidateShipments.map((shipment) => {
            const isSelected = selectedShipmentIds.includes(shipment.id);
            return (
              <div
                key={shipment.id}
                onClick={() => handleToggleShipment(shipment.id)}
                className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all touch-press flex items-center justify-between ${
                  isSelected
                    ? "bg-emerald-50/60 border-emerald-300/80 shadow-xs"
                    : "bg-gray-50/70 border-black/[0.04] hover:bg-gray-100/70"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="rounded-full border-gray-300 text-emerald-700 focus:ring-emerald-700 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-gray-950">{shipment.code}</span>
                      <span className="font-semibold text-gray-900">
                        {shipment.commodity} ({formatWeightKg(shipment.totalWeightKg)})
                      </span>
                    </div>
                    <div className="text-[10.5px] text-gray-500 mt-0.5">
                      {shipment.farmerName} • {shipment.villageClusterName}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono text-[10.5px]">
                  <div className="text-red-700 font-semibold">Cutoff: {shipment.requiredArrivalDeadline}</div>
                  <div className="text-gray-500">{formatInr(shipment.freightCostInr)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmAllocation}
        title="Confirm Cargo Bus Allocation"
        description="This locks the luggage cargo allocation for the selected agricultural shipments onto Demo Bus 108 for departure from Savalyavihar."
        confirmText="Commit Allocation"
        variant="operational"
        details={[
          { label: "Vehicle", value: `${activeBus.busNumber} (${activeBus.routeName})` },
          { label: "Cargo Load", value: `${matchedWeight} kg (${capacityUtilizationPct}% utilization)` },
          { label: "APMC Arrival", value: "08:27 AM (Gate 1 Transit Bay)" },
        ]}
      />
    </div>
  );
}
