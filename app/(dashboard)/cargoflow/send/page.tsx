"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Package,
  MapPin,
  Truck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Info,
  Calendar,
  Sparkles,
  ChevronDown,
  ShieldAlert,
  Search,
  Check,
} from "lucide-react";
import {
  CargoCategory,
  CargoOpportunityOption,
  CargoShipment,
} from "../../../../lib/domain/villages";
import {
  searchKopargaonLocations,
  getVillageByIdOrName,
  KOPARGAON_TALUKA_VILLAGES,
  TRANSIT_DESTINATION_NODES,
} from "../../../../mock/mockVillagesData";
import {
  searchCargoOpportunities,
  calculateDemoEstimatedPriceInr,
  validateCargoEligibility,
} from "../../../../lib/cargoflow/cargoOpportunityEngine";
import { cargoFlowRepository } from "../../../../lib/repositories/cargoFlowRepository";
import { DataSourceBadge } from "../../../../components/shared/DataSourceBadge";
import { useResilience } from "../../../../lib/resilience/useResilience";

function CargoFlowSendInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFarmerMode = searchParams.get("mode") === "farmer";
  const { systemStatus, isSafeMode, isOnline } = useResilience();

  // Form State
  const [originQuery, setOriginQuery] = useState(isFarmerMode ? "Sonewadi" : "");
  const [selectedOrigin, setSelectedOrigin] = useState<any>(
    isFarmerMode ? getVillageByIdOrName("Sonewadi") : null
  );
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);

  const [destQuery, setDestQuery] = useState(isFarmerMode ? "Kopargaon APMC Main Yard" : "");
  const [selectedDest, setSelectedDest] = useState<any>(
    isFarmerMode ? TRANSIT_DESTINATION_NODES[1] : null
  );
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const [category, setCategory] = useState<CargoCategory>(
    isFarmerMode ? "AGRI_PRODUCE" : "SMALL_PARCEL"
  );
  const [commodityCrop, setCommodityCrop] = useState(isFarmerMode ? "Onion" : "");
  const [weightKg, setWeightKg] = useState<number>(isFarmerMode ? 100 : 20);
  const [deadline, setDeadline] = useState(isFarmerMode ? "10:00 AM (Morning Auction)" : "Today 02:00 PM");
  const [description, setDescription] = useState(isFarmerMode ? "Fresh Harvest Onion (4 Crates)" : "General Box");

  const [senderName, setSenderName] = useState("Balu Shinde");
  const [senderPhone, setSenderPhone] = useState("+91 98220 44102");
  const [recipientName, setRecipientName] = useState("APMC Commission Agent (Lot #42)");
  const [recipientPhone, setRecipientPhone] = useState("+91 94231 88910");

  // Search Results & Booking State
  const [searchResults, setSearchResults] = useState<{
    options: CargoOpportunityOption[];
    notes: string[];
  } | null>(null);

  const [selectedOption, setSelectedOption] = useState<CargoOpportunityOption | null>(null);
  const [bookedShipment, setBookedShipment] = useState<CargoShipment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autocomplete lists
  const originSuggestions = useMemo(() => {
    return searchKopargaonLocations(originQuery);
  }, [originQuery]);

  const destSuggestions = useMemo(() => {
    return searchKopargaonLocations(destQuery);
  }, [destQuery]);

  // Execute Opportunity Search
  const handleFindOpportunities = () => {
    if (!originQuery || !destQuery) return;

    const results = searchCargoOpportunities({
      originLocation: originQuery,
      destinationLocation: destQuery,
      weightKg: Number(weightKg),
      category,
      commodityCrop: commodityCrop || undefined,
      requiredDeadline: deadline,
    });

    setSearchResults({
      options: results.options,
      notes: results.notes,
    });

    // Pre-select first eligible option
    const firstEligible = results.options.find((o) => o.is_eligible);
    if (firstEligible) {
      setSelectedOption(firstEligible);
    } else {
      setSelectedOption(null);
    }
  };

  // Trigger search automatically on mount if farmer mode
  useEffect(() => {
    if (isFarmerMode && originQuery && destQuery) {
      handleFindOpportunities();
    }
  }, [isFarmerMode]);

  // Handle Reservation
  const handleConfirmReservation = async () => {
    if (!selectedOption) return;
    setIsSubmitting(true);

    try {
      const originVillage = getVillageByIdOrName(originQuery);

      const newShipment = await cargoFlowRepository.createShipment({
        sender_name: senderName || "Citizen Sender",
        sender_phone: senderPhone || "+91 98000 00000",
        recipient_name: recipientName || "Recipient",
        recipient_phone: recipientPhone || "+91 98000 00000",

        origin_village_id: originVillage?.id || "vil-custom",
        origin_village_name: originVillage?.name || originQuery,
        origin_stop_id: selectedOption.pickup_stop_id,
        origin_stop_name: selectedOption.pickup_stop_name,
        is_origin_stop_verified: selectedOption.is_direct_stop,
        origin_distance_to_stop_km: selectedOption.distance_from_origin_km,

        destination_location_name: destQuery,
        destination_stop_id: selectedOption.dropoff_stop_id,

        cargo_specs: {
          category,
          description: description || "Public Goods",
          commodity_crop: commodityCrop || undefined,
          weight_kg: Number(weightKg),
        },
        required_by: deadline,

        assigned_trip_id: selectedOption.trip_id,
        assigned_bus_number: selectedOption.bus_number,
        assigned_route_name: selectedOption.route_name,
        departure_time: selectedOption.departure_time,
        estimated_arrival_time: selectedOption.estimated_arrival_time,

        status: "RESERVED",
        allocated_weight_kg: Number(weightKg),
        estimated_price_inr: selectedOption.estimated_price_inr,
        is_price_demo_estimate: true,
      });

      setBookedShipment(newShipment);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.07] shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-gray-950">
              {isFarmerMode ? "FARMER PRODUCE CARGO BOOKING" : "SEND A PARCEL / GOODS"}
            </h1>
            <DataSourceBadge type="LIVE" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Discover spare luggage capacity on scheduled buses serving Kopargaon Taluka villages.
          </p>
        </div>

        <Link
          href="/cargoflow"
          className="text-xs font-mono text-gray-600 hover:text-gray-900 border border-black/[0.06] bg-gray-50 px-2.5 py-1 rounded-md font-semibold"
        >
          ← Hub
        </Link>
      </div>

      {/* Confirmation View if Booked */}
      {bookedShipment ? (
        <div className="bg-white p-4 sm:p-6 rounded-lg border border-emerald-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="text-[10.5px] font-mono text-emerald-800 uppercase font-bold tracking-wider">
                Cargo Space Reserved
              </div>
              <h2 className="text-base sm:text-lg font-bold font-mono text-gray-950">
                {bookedShipment.reference_code}
              </h2>
            </div>
          </div>

          {(isSafeMode || !isOnline || systemStatus === "SAFE_MODE" || systemStatus === "DEGRADED") && (
            <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-lg text-xs space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 font-bold text-amber-950 font-mono text-[11.5px]">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>⚠️ PRIMARY DATA SERVICE CURRENTLY UNAVAILABLE</span>
              </div>
              <p className="text-amber-900 text-[11.5px] leading-relaxed">
                Your cargo reservation has been <strong>safely stored locally on this device</strong>.
              </p>
              <div className="flex items-center justify-between text-[10.5px] font-mono text-amber-800 pt-0.5 border-t border-amber-200">
                <span>Status: <strong>PENDING RECONCILIATION</strong></span>
                <span>Protected in IndexedDB Outbox</span>
              </div>
            </div>
          )}

          <div className="p-3 bg-gray-50 rounded-md border border-black/[0.05] space-y-2 text-xs font-mono">
            <div className="flex justify-between border-b border-black/[0.04] pb-1.5">
              <span className="text-gray-500">From Village:</span>
              <span className="font-bold text-gray-900">{bookedShipment.origin_village_name}</span>
            </div>
            <div className="flex justify-between border-b border-black/[0.04] pb-1.5">
              <span className="text-gray-500">Pickup Location:</span>
              <span className="font-bold text-gray-900">{bookedShipment.origin_stop_name}</span>
            </div>
            <div className="flex justify-between border-b border-black/[0.04] pb-1.5">
              <span className="text-gray-500">Destination:</span>
              <span className="font-bold text-gray-900">{bookedShipment.destination_location_name}</span>
            </div>
            <div className="flex justify-between border-b border-black/[0.04] pb-1.5">
              <span className="text-gray-500">Assigned Transit Trip:</span>
              <span className="font-bold text-blue-700">{bookedShipment.assigned_bus_number} ({bookedShipment.assigned_route_name?.split("(")[0]})</span>
            </div>
            <div className="flex justify-between border-b border-black/[0.04] pb-1.5">
              <span className="text-gray-500">Scheduled Departure:</span>
              <span className="font-bold text-gray-900">{bookedShipment.departure_time}</span>
            </div>
            <div className="flex justify-between border-b border-black/[0.04] pb-1.5">
              <span className="text-gray-500">Cargo Weight:</span>
              <span className="font-bold text-gray-900">{bookedShipment.allocated_weight_kg} kg ({bookedShipment.cargo_specs.commodity_crop || bookedShipment.cargo_specs.category})</span>
            </div>
            <div className="flex justify-between pt-0.5 text-sm">
              <span className="text-gray-700 font-bold">Estimated Fee:</span>
              <span className="font-bold text-emerald-800">₹{bookedShipment.estimated_price_inr} <span className="text-[10px] text-gray-500 font-normal">(Demo Rate)</span></span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-md text-xs text-blue-900 space-y-1">
            <div className="font-bold font-mono text-[11px] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-700" />
              <span>Next Steps for Handoff:</span>
            </div>
            <p className="text-[11.5px] leading-relaxed">
              Please bring your packed parcel to <strong>{bookedShipment.origin_stop_name}</strong> 10 minutes prior to departure ({bookedShipment.departure_time}). Show reference <strong>{bookedShipment.reference_code}</strong> to the bus conductor.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Link
              href="/cargoflow/shipments"
              className="flex-1 py-2 text-center rounded-md bg-gray-950 hover:bg-gray-900 text-white font-mono font-bold text-xs touch-press shadow-xs"
            >
              View in My Shipments
            </Link>
            <button
              onClick={() => {
                setBookedShipment(null);
                setSearchResults(null);
              }}
              className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 font-mono text-xs font-semibold touch-press"
            >
              Book Another
            </button>
          </div>
        </div>
      ) : (
        /* Booking Step Form */
        <div className="space-y-4">
          {/* STEP 1: Route & Origin / Destination Form */}
          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.07] shadow-xs space-y-3">
            <div className="text-xs font-bold font-mono text-gray-950 uppercase border-b border-black/[0.04] pb-1.5 flex items-center justify-between">
              <span>1. Choose Pickup & Destination</span>
              <span className="text-[10px] text-gray-400 font-normal">75 Villages Supported</span>
            </div>

            {/* Quick Mode Switch */}
            {isFarmerMode && (
              <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-md text-xs text-amber-900 flex items-start gap-2">
                <Truck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Farmer APMC Express Mode:</span> Preset for direct agricultural produce transport from rural villages to Kopargaon APMC morning market.
                </div>
              </div>
            )}

            {/* Origin Input with full 75 Village Autocomplete */}
            <div className="relative space-y-1">
              <label className="block text-xs font-semibold text-gray-700">
                Where are you sending from? (Village / Town):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={originQuery}
                  onChange={(e) => {
                    setOriginQuery(e.target.value);
                    setShowOriginDropdown(true);
                  }}
                  onFocus={() => setShowOriginDropdown(true)}
                  placeholder="e.g. Sonewadi, Kolpewadi, Pohegaon, Dharangaon..."
                  className="w-full p-2.5 pl-8 text-xs bg-gray-50 border border-black/[0.08] rounded-md font-medium text-gray-950 focus:outline-none focus:bg-white focus:border-gray-900"
                />
                <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
              </div>

              {/* Origin Dropdown Autocomplete */}
              {showOriginDropdown && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-52 overflow-y-auto bg-white border border-black/[0.1] rounded-md shadow-lg divide-y divide-black/[0.04]">
                  {originSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setOriginQuery(item.name);
                        setSelectedOrigin(item.record);
                        setShowOriginDropdown(false);
                      }}
                      className="w-full text-left p-2 hover:bg-gray-50 flex items-center justify-between text-xs touch-press"
                    >
                      <div>
                        <span className="font-bold text-gray-900">{item.name}</span>
                        <span className="text-[10px] text-gray-500 block">{item.subtitle}</span>
                      </div>
                      <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                        {item.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Origin Proximity & Stop Verification Status Feedback */}
              {selectedOrigin && (
                <div className="pt-1 text-[11px] font-mono">
                  {selectedOrigin.has_verified_bus_stop ? (
                    <span className="text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Served Bus Stop Verified ({selectedOrigin.name})</span>
                    </span>
                  ) : (
                    <span className="text-amber-800 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>
                        Near route · {selectedOrigin.distance_to_nearest_stop_km || 0.4} km (Stop not verified · Board at {selectedOrigin.nearest_verified_stop_name || "Corridor Stop"})
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Destination Input */}
            <div className="relative space-y-1 pt-1">
              <label className="block text-xs font-semibold text-gray-700">
                Where should it go? (APMC Yard, City, or Village):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={destQuery}
                  onChange={(e) => {
                    setDestQuery(e.target.value);
                    setShowDestDropdown(true);
                  }}
                  onFocus={() => setShowDestDropdown(true)}
                  placeholder="e.g. Kopargaon APMC Main Yard, Pune, Shirdi, Anjanapur..."
                  className="w-full p-2.5 pl-8 text-xs bg-gray-50 border border-black/[0.08] rounded-md font-medium text-gray-950 focus:outline-none focus:bg-white focus:border-gray-900"
                />
                <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
              </div>

              {/* Destination Dropdown */}
              {showDestDropdown && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-52 overflow-y-auto bg-white border border-black/[0.1] rounded-md shadow-lg divide-y divide-black/[0.04]">
                  {destSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setDestQuery(item.name);
                        setSelectedDest(item.record);
                        setShowDestDropdown(false);
                      }}
                      className="w-full text-left p-2 hover:bg-gray-50 flex items-center justify-between text-xs touch-press"
                    >
                      <div>
                        <span className="font-bold text-gray-900">{item.name}</span>
                        <span className="text-[10px] text-gray-500 block">{item.subtitle}</span>
                      </div>
                      <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                        {item.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: Cargo Specifications & Category */}
          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.07] shadow-xs space-y-3">
            <div className="text-xs font-bold font-mono text-gray-950 uppercase border-b border-black/[0.04] pb-1.5 flex items-center justify-between">
              <span>2. Cargo Details & Weight</span>
              <span className="text-[10px] text-gray-400 font-normal">Luggage Bay Allocation</span>
            </div>

            {/* Category Selector */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Cargo Category:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CargoCategory)}
                className="w-full p-2 text-xs bg-gray-50 border border-black/[0.08] rounded-md font-medium text-gray-950 focus:outline-none focus:bg-white"
              >
                <option value="AGRI_PRODUCE">Agricultural Produce (Onion, Grain, Pomegranate)</option>
                <option value="SMALL_PARCEL">Small Parcel / Box</option>
                <option value="CLOTHING">Clothing & Textiles</option>
                <option value="HOUSEHOLD">Household Goods</option>
                <option value="DOCUMENTS">Documents & Letters</option>
                <option value="PACKAGED_FOOD">Packaged Food</option>
                <option value="RESTRICTED_UNSUPPORTED">Hazardous / Unpackaged Perishable (Restricted)</option>
              </select>
            </div>

            {/* Farmer Crop Shortcuts */}
            {category === "AGRI_PRODUCE" && (
              <div className="space-y-1.5 p-2.5 bg-gray-50/80 rounded-md border border-black/[0.05]">
                <span className="text-[10.5px] font-mono font-bold text-gray-600 uppercase">
                  Quick Crop Selection:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {["Onion", "Pomegranate", "Wheat", "Tomato", "Soybean", "Guava"].map((crop) => (
                    <button
                      key={crop}
                      type="button"
                      onClick={() => {
                        setCommodityCrop(crop);
                        setDescription(`${crop} Harvest Crates`);
                      }}
                      className={`px-2.5 py-1 text-xs font-mono rounded border touch-press ${
                        commodityCrop === crop
                          ? "bg-gray-950 text-white font-bold border-gray-950"
                          : "bg-white text-gray-700 border-black/[0.07] hover:bg-gray-100"
                      }`}
                    >
                      {crop}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Weight Slider & Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-gray-700">Cargo Weight:</label>
                <span className="font-mono font-bold text-gray-950 text-sm">{weightKg} kg</span>
              </div>
              <input
                type="range"
                min="1"
                max="150"
                step="1"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full accent-gray-950 h-1.5"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>1 kg (Doc)</span>
                <span>20 kg (Box)</span>
                <span>50 kg (Bags)</span>
                <span>100 kg (Produce)</span>
                <span>150 kg (Max)</span>
              </div>
            </div>

            {/* Deadline Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Required Arrival Deadline:</label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="e.g. 10:00 AM (Morning Auction)"
                className="w-full p-2 text-xs bg-gray-50 border border-black/[0.08] rounded-md font-medium text-gray-950 focus:outline-none focus:bg-white"
              />
            </div>

            {/* Action to Search */}
            <button
              type="button"
              onClick={handleFindOpportunities}
              className="w-full py-2.5 bg-gray-950 hover:bg-gray-900 text-white rounded-md font-mono font-bold text-xs flex items-center justify-center gap-1.5 touch-press shadow-xs mt-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span>FIND AVAILABLE CARGO SPACE</span>
            </button>
          </div>

          {/* STEP 3: Available Scheduled Transportation Options */}
          {searchResults && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold font-mono text-gray-950 uppercase tracking-wider">
                  Available Scheduled Services ({searchResults.options.length})
                </span>
                <span className="text-[10px] font-mono text-gray-500">
                  Existing Transit Capacity
                </span>
              </div>

              {searchResults.options.length === 0 ? (
                <div className="p-4 bg-white rounded-lg border border-black/[0.07] text-center text-xs text-gray-500 font-mono space-y-1">
                  <p>No direct scheduled transportation found for this village corridor.</p>
                  <p className="text-[11px] text-blue-700">
                    Try boarding at nearest hub (Kopargaon Central Stand).
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.options.map((opt) => (
                    <div
                      key={opt.trip_id}
                      onClick={() => {
                        if (opt.is_eligible) setSelectedOption(opt);
                      }}
                      className={`p-3.5 rounded-lg border transition-all touch-press ${
                        !opt.is_eligible
                          ? "bg-gray-50/70 border-black/[0.05] opacity-60 cursor-not-allowed"
                          : selectedOption?.trip_id === opt.trip_id
                          ? "bg-white border-gray-950 ring-1 ring-gray-950 shadow-xs cursor-pointer"
                          : "bg-white border-black/[0.07] hover:border-gray-400 shadow-xs cursor-pointer"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Trip Info */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-gray-950">
                              {opt.departure_time} → {opt.estimated_arrival_time}
                            </span>
                            <span className="text-[9.5px] font-mono bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.2 rounded font-semibold">
                              {opt.bus_number}
                            </span>
                            {selectedOption?.trip_id === opt.trip_id && (
                              <span className="text-[9.5px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> Selected
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-gray-600 font-medium">
                            {opt.route_name}
                          </div>

                          <div className="text-[10.5px] font-mono text-gray-500 flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5">
                            <span>Boarding: <strong>{opt.pickup_stop_name}</strong></span>
                            <span>Available Space: <strong className="text-emerald-800">{opt.available_cargo_capacity_kg} kg</strong></span>
                          </div>
                        </div>

                        {/* Price & Capacity Status */}
                        <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-black/[0.04] space-y-0.5 font-mono">
                          <div className="text-sm font-bold text-gray-950">
                            ₹{opt.estimated_price_inr}
                            <span className="text-[9.5px] font-normal text-gray-400 block sm:inline sm:ml-1">
                              (Demo Estimate)
                            </span>
                          </div>
                          {!opt.is_eligible && (
                            <span className="text-[10px] text-red-700 font-semibold block">
                              {opt.ineligibility_reason || "Not enough space"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Explainable Reasons */}
                      <div className="mt-2 pt-2 border-t border-black/[0.04] text-[10.5px] text-gray-500 space-y-0.5">
                        {opt.explainable_reasons.map((r, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Confirm Booking Action */}
          {selectedOption && selectedOption.is_eligible && (
            <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-black/[0.08] shadow-xs space-y-3">
              <div className="text-xs font-bold font-mono text-gray-950 uppercase border-b border-black/[0.04] pb-1.5">
                3. Sender & Recipient Contact
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-gray-600 font-medium text-[11px]">Sender Name:</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-black/[0.08] rounded-md font-medium text-gray-950 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium text-[11px]">Sender Mobile:</label>
                  <input
                    type="text"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-black/[0.08] rounded-md font-medium text-gray-950 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium text-[11px]">Recipient Name:</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-black/[0.08] rounded-md font-medium text-gray-950 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium text-[11px]">Recipient Mobile:</label>
                  <input
                    type="text"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-black/[0.08] rounded-md font-medium text-gray-950 text-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmReservation}
                disabled={isSubmitting}
                className="w-full py-3 bg-gray-950 hover:bg-gray-900 disabled:opacity-50 text-white rounded-md font-mono font-bold text-xs flex items-center justify-center gap-2 touch-press shadow-xs mt-2"
              >
                <Package className="w-4 h-4 text-emerald-400" />
                <span>
                  {isSubmitting
                    ? "RESERVING LUGGAGE SPACE..."
                    : `RESERVE CARGO SPACE (₹${selectedOption.estimated_price_inr})`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CargoFlowSendPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-mono text-gray-500">
          Loading cargo booking engine...
        </div>
      }
    >
      <CargoFlowSendInner />
    </Suspense>
  );
}
