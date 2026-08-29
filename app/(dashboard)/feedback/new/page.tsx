"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bus,
  AlertTriangle,
  ShieldAlert,
  Zap,
  Package,
  MapPin,
  Camera,
  Upload,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  LocateFixed,
  Info,
  Building,
  HelpCircle,
} from "lucide-react";
import { feedbackRepository } from "../../../../lib/repositories";
import {
  FeedbackCategory,
  FeedbackIssueType,
  CitizenSeverity,
} from "../../../../lib/domain/types";
import { cn } from "../../../../lib/utils/cn";

export default function NewFeedbackReportPage() {
  const router = useRouter();

  // Multi-step progress (Step 1 to 5, and 6 for success)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState<FeedbackCategory>("BUS_SERVICE");
  const [issueType, setIssueType] = useState<FeedbackIssueType>("BUS_DELAYED");
  const [relatedEntityId, setRelatedEntityId] = useState<string>("");
  const [relatedEntityName, setRelatedEntityName] = useState<string>("");

  // Location State
  const [locationName, setLocationName] = useState<string>("Kopargaon Central Bus Stand");
  const [latitude, setLatitude] = useState<number>(19.8874);
  const [longitude, setLongitude] = useState<number>(74.4795);
  const [locating, setLocating] = useState(false);
  const [locationSource, setLocationSource] = useState<"GEOLOCATION" | "PRESET" | "MANUAL">("PRESET");

  // Details State
  const [description, setDescription] = useState<string>("");
  const [occurredAt, setOccurredAt] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [citizenSeverity, setCitizenSeverity] = useState<CitizenSeverity>("NORMAL");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);

  // Contact / Privacy State
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [citizenName, setCitizenName] = useState<string>("");
  const [citizenPhone, setCitizenPhone] = useState<string>("");

  // Validation Error
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Category Configuration
  const categoryOptions: {
    id: FeedbackCategory;
    title: string;
    description: string;
    icon: React.ElementType;
  }[] = [
    {
      id: "BUS_SERVICE",
      title: "Bus / Public Transport",
      description: "Delays, missing trips, overcrowding, driver or ticketing issues",
      icon: Bus,
    },
    {
      id: "ROAD_TRAFFIC",
      title: "Road / Traffic",
      description: "Potholes, road blockages, heavy congestion, damaged surfaces",
      icon: AlertTriangle,
    },
    {
      id: "ROAD_SAFETY",
      title: "Road Safety",
      description: "Accident hazards, missing streetlights, dangerous intersections",
      icon: ShieldAlert,
    },
    {
      id: "AGRI_LOGISTICS",
      title: "Agricultural Logistics",
      description: "Luggage bay capacity, produce cargo delays, pickup issues",
      icon: Package,
    },
    {
      id: "EV_CHARGING",
      title: "EV Charging",
      description: "Depot fast charger faults, queues, payment issues",
      icon: Zap,
    },
    {
      id: "BUS_STOP",
      title: "Bus Stop / Shelter",
      description: "Damaged shelters, broken benches, missing timetable boards",
      icon: Building,
    },
    {
      id: "OTHER",
      title: "Other Mobility Issue",
      description: "General transportation feedback or suggestions",
      icon: HelpCircle,
    },
  ];

  // Dynamic Issue Types by Category
  const getIssuesForCategory = (cat: FeedbackCategory): { id: FeedbackIssueType; label: string }[] => {
    switch (cat) {
      case "BUS_SERVICE":
        return [
          { id: "BUS_DELAYED", label: "Bus delayed (arrived late)" },
          { id: "BUS_NOT_ARRIVED", label: "Bus did not arrive (missed scheduled trip)" },
          { id: "OVERCROWDING", label: "Severe passenger overcrowding / unable to board" },
          { id: "ROUTE_ISSUE", label: "Route bypassed scheduled village stop" },
          { id: "DRIVER_SERVICE_ISSUE", label: "Driver / conductor service issue" },
          { id: "BUS_CONDITION", label: "Bus vehicle maintenance or cleanliness issue" },
        ];
      case "ROAD_TRAFFIC":
        return [
          { id: "POTHOLE", label: "Pothole or cracked asphalt surface" },
          { id: "ROAD_BLOCKAGE", label: "Road blockage / construction / fallen debris" },
          { id: "HEAVY_CONGESTION", label: "Heavy traffic bottleneck / gridlock" },
          { id: "DAMAGED_ROAD", label: "Damaged bridge or canal crossing approach" },
          { id: "UNSAFE_INTERSECTION", label: "Unsafe crossing or junction blindspot" },
          { id: "MISSING_SIGNAGE", label: "Missing speed limit or direction signage" },
        ];
      case "ROAD_SAFETY":
        return [
          { id: "ACCIDENT_HAZARD", label: "High-risk accident hazard / oil spill" },
          { id: "LACK_OF_STREETLIGHT", label: "Broken or missing street lighting" },
          { id: "SPEEDING_ZONE", label: "Dangerous speeding / need for rumble strip" },
          { id: "PEDESTRIAN_RISK", label: "Unsafe pedestrian walking zone near school/market" },
        ];
      case "AGRI_LOGISTICS":
        return [
          { id: "PICKUP_ISSUE", label: "Farmer produce not picked up / luggage bay full" },
          { id: "DELIVERY_DELAY", label: "Delayed arrival at APMC market yard" },
          { id: "DAMAGED_GOODS", label: "Damaged crates during transit" },
          { id: "LOGISTICS_ROUTE_ISSUE", label: "Rural collection point bypassed" },
        ];
      case "EV_CHARGING":
        return [
          { id: "CHARGER_MALFUNCTION", label: "Charger fault code / handshake error" },
          { id: "CHARGER_UNAVAILABLE", label: "Charger offline or occupied by ICE vehicle" },
          { id: "LONG_QUEUE", label: "Excessive wait queue for electric bus charging" },
          { id: "INCORRECT_AVAILABILITY", label: "App status showed available but charger occupied" },
        ];
      case "BUS_STOP":
        return [
          { id: "BUS_STOP_DAMAGED", label: "Broken shelter roof or vandalized glass" },
          { id: "MISSING_TIMETABLE", label: "Missing or illegible route timetable" },
        ];
      default:
        return [{ id: "OTHER_ISSUE", label: "Other civic mobility feedback" }];
    }
  };

  // Known Transit Entities for linking
  const knownEntities = [
    { type: "BUS", id: "BUS-108", name: "Bus BUS-108 (Route 01)" },
    { type: "BUS", id: "BUS-102", name: "Bus BUS-102 (Electric - Route 02)" },
    { type: "BUS", id: "BUS-104", name: "Bus BUS-104 (Route 03)" },
    { type: "ROUTE", id: "R-01", name: "Route 01 (Bus Stand ↔ Pohegaon)" },
    { type: "ROUTE", id: "R-02", name: "Route 02 (Bus Stand ↔ Shirdi Border)" },
    { type: "ROUTE", id: "R-04", name: "Route 04 (Station ↔ Dhamori)" },
    { type: "ROAD_SEGMENT", id: "KPG-14", name: "Road Corridor KPG-14 (SH-7 Savalyavihar)" },
    { type: "ROAD_SEGMENT", id: "KPG-01", name: "Road Corridor KPG-01 (Kopargaon Bus Stand Road)" },
    { type: "EV_CHARGER", id: "chg-01", name: "Depot Fast Charger Bay A (60kW)" },
    { type: "EV_CHARGER", id: "chg-02", name: "Depot Fast Charger Bay B (60kW)" },
  ];

  // Preset Landmarks
  const presetLocations = [
    { name: "Kopargaon Central Bus Stand", lat: 19.8874, lng: 74.4795 },
    { name: "Kopargaon Railway Station Stop", lat: 19.891, lng: 74.484 },
    { name: "Pohegaon Cluster Center", lat: 19.835, lng: 74.442 },
    { name: "SH-7 Savalyavihar Turn", lat: 19.852, lng: 74.548 },
    { name: "APMC Kopargaon Main Market Yard", lat: 19.882, lng: 74.475 },
    { name: "Yeola Road Junction (Yeola Naka)", lat: 19.905, lng: 74.498 },
    { name: "Shingnapur Phata Highway Crossing", lat: 19.821, lng: 74.492 },
  ];

  // Geolocation Handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        setLocationName(`GPS Position: ${lat}, ${lng} (Near Kopargaon)`);
        setLocationSource("GEOLOCATION");
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setErrorMsg("Location access denied. Please choose a landmark below.");
        // Fallback to Kopargaon default
        setLatitude(19.8874);
        setLongitude(74.4795);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Photo Attachment Handler with Client Compression
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File validation: Size < 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image file too large. Please select a photo under 5MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Invalid file type. Please upload a JPG or PNG image.");
      return;
    }

    setErrorMsg(null);
    setPhotoFileName(file.name);

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setPhotoDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Step Validation & Navigation
  const handleNextStep = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      // Ensure issue type is updated to valid issue for the selected category
      const issues = getIssuesForCategory(category);
      if (!issues.some((i) => i.id === issueType)) {
        setIssueType(issues[0].id);
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!locationName.trim()) {
        setErrorMsg("Please specify or select a location for the report.");
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (!description.trim()) {
        setErrorMsg("Please provide a brief description of what happened.");
        return;
      }
      if (description.trim().length < 5) {
        setErrorMsg("Description must be at least 5 characters long.");
        return;
      }
      setCurrentStep(5);
    }
  };

  // Final Submission
  const handleSubmitReport = async () => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const selectedEntity = knownEntities.find((e) => e.id === relatedEntityId);
      const selectedIssueObj = getIssuesForCategory(category).find((i) => i.id === issueType);
      const issueTitle = selectedIssueObj ? selectedIssueObj.label : "Citizen Mobility Report";

      const created = await feedbackRepository.createReport({
        category,
        issueType,
        issueTitle,
        description: description.trim(),
        citizenSeverity,
        latitude,
        longitude,
        locationName: locationName.trim(),
        relatedEntityType: selectedEntity?.type as any,
        relatedEntityId: selectedEntity?.id,
        relatedEntityName: selectedEntity?.name,
        citizenName: isAnonymous ? undefined : citizenName.trim() || undefined,
        citizenPhone: isAnonymous ? undefined : citizenPhone.trim() || undefined,
        isAnonymous,
        photoUrl: photoDataUrl || undefined,
        photoFileName: photoFileName || undefined,
        occurredAt: new Date(occurredAt).toISOString(),
      });

      setSubmittedRef(created.referenceCode);
      setCurrentStep(6); // Success Step
    } catch (err: any) {
      console.error("Submission failed", err);
      setErrorMsg("Unable to submit your report right now. Your data is safe. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // SUCCESS SCREEN
  // ==========================================
  if (currentStep === 6 && submittedRef) {
    return (
      <div className="max-w-md mx-auto py-8 px-4 text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-bold font-sans text-gray-950">
            Report Submitted
          </h1>
          <p className="text-xs text-gray-600">
            Thank you for helping improve public mobility in Kopargaon.
          </p>
        </div>

        {/* Reference Code Card (Solid, Clean) */}
        <div className="bg-white border border-gray-200 rounded-[8px] p-4 space-y-2 text-left shadow-xs">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-semibold">
            COMPLAINT REFERENCE CODE
          </div>
          <div className="text-lg font-bold font-mono text-gray-950 flex items-center justify-between">
            <span>{submittedRef}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-pixel bg-amber-50 text-amber-900 border border-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
              <span>UNDER REVIEW</span>
            </span>
          </div>
          <p className="text-[11px] text-gray-500 border-t border-gray-100 pt-2">
            Your complaint has been forwarded to the Kopargaon mobility dispatch team. You can track progress anytime with this code.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href={`/feedback/${submittedRef}`}
            className="w-full py-2.5 bg-gray-950 hover:bg-gray-850 text-white rounded-[8px] text-xs font-semibold tracking-tight transition-colors shadow-xs touch-press flex items-center justify-center gap-1.5"
          >
            <span>Track report status</span>
            <ChevronRight className="w-4 h-4" />
          </Link>

          <Link
            href="/feedback"
            className="w-full py-2.5 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 rounded-[8px] text-xs font-medium transition-colors"
          >
            Return to Feedback Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-12">
      {/* 1. Header & Progress Stepper */}
      <div className="bg-white border border-gray-200 rounded-[8px] p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/feedback"
              className="p-1 -ml-1 text-gray-500 hover:text-gray-900 rounded-[6px] hover:bg-gray-100 transition-colors"
              title="Back to feedback list"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-sm font-bold font-sans text-gray-950">
              Report a Mobility Issue
            </h1>
          </div>
          <span className="text-[11px] font-mono font-semibold text-gray-600">
            Step {currentStep} of 5
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-950 transition-all duration-200 rounded-full"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Inline Error Notice */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-[8px] p-3 text-xs text-red-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ========================================== */}
      {/* STEP 1: CATEGORY SELECTION                 */}
      {/* ========================================== */}
      {currentStep === 1 && (
        <div className="bg-white border border-gray-200 rounded-[8px] p-4 sm:p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold font-sans text-gray-950">
              What do you want to report?
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select the service or infrastructure category that best matches your issue.
            </p>
          </div>

          <div className="space-y-2">
            {categoryOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = category === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCategory(opt.id)}
                  className={cn(
                    "w-full p-3 rounded-[8px] border text-left transition-all flex items-start gap-3 touch-press",
                    isSelected
                      ? "bg-gray-50 border-gray-950 ring-1 ring-gray-950 text-gray-950"
                      : "bg-white border-gray-200 hover:border-gray-300 text-gray-800"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0 border",
                      isSelected
                        ? "bg-gray-950 text-white border-gray-950"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold font-sans">{opt.title}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                      {opt.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* STEP 2: ISSUE TYPE & OPTIONAL ENTITY       */}
      {/* ========================================== */}
      {currentStep === 2 && (
        <div className="bg-white border border-gray-200 rounded-[8px] p-4 sm:p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold font-sans text-gray-950">
              What is the specific problem?
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select the issue type and optionally link the vehicle, route, or road.
            </p>
          </div>

          {/* Issue Types List */}
          <div className="space-y-2">
            {getIssuesForCategory(category).map((issue) => {
              const isSelected = issueType === issue.id;
              return (
                <label
                  key={issue.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-[8px] border cursor-pointer transition-all",
                    isSelected
                      ? "bg-gray-50 border-gray-950 ring-1 ring-gray-950"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <input
                    type="radio"
                    name="issueType"
                    checked={isSelected}
                    onChange={() => setIssueType(issue.id)}
                    className="w-4 h-4 text-gray-950 focus:ring-gray-950 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-gray-900">
                    {issue.label}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Optional Entity Linking */}
          <div className="pt-3 border-t border-gray-100 space-y-1.5">
            <label className="block text-xs font-semibold text-gray-800">
              Related Vehicle, Route, or Road (Optional)
            </label>
            <select
              value={relatedEntityId}
              onChange={(e) => {
                setRelatedEntityId(e.target.value);
                const ent = knownEntities.find((k) => k.id === e.target.value);
                setRelatedEntityName(ent?.name || "");
              }}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-[6px] text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-950/10 focus:border-gray-900 cursor-pointer"
            >
              <option value="">-- None / General Area --</option>
              {knownEntities.map((ent) => (
                <option key={ent.id} value={ent.id}>
                  {ent.name}
                </option>
              ))}
            </select>
            <p className="text-[10.5px] text-gray-500">
              Linking a specific bus or road corridor connects your report directly to operational dispatch.
            </p>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* STEP 3: LOCATION CAPTURE                   */}
      {/* ========================================== */}
      {currentStep === 3 && (
        <div className="bg-white border border-gray-200 rounded-[8px] p-4 sm:p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold font-sans text-gray-950">
              Where did this happen?
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Provide location so field teams can investigate and dispatch maintenance.
            </p>
          </div>

          {/* Location Quick Button */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locating}
              className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-[6px] text-xs font-semibold text-gray-900 flex items-center justify-center gap-2 transition-colors touch-press disabled:opacity-60"
            >
              <LocateFixed className="w-4 h-4 text-blue-700" />
              <span>{locating ? "Capturing GPS..." : "Use Current GPS Location"}</span>
            </button>

            <select
              onChange={(e) => {
                const preset = presetLocations.find((p) => p.name === e.target.value);
                if (preset) {
                  setLocationName(preset.name);
                  setLatitude(preset.lat);
                  setLongitude(preset.lng);
                  setLocationSource("PRESET");
                }
              }}
              className="p-3 bg-gray-50 border border-gray-200 rounded-[6px] text-xs text-gray-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="">-- Choose Common Landmark --</option>
              {presetLocations.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Manual Location Name Input */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-gray-800">
              Location Description / Street Landmark
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => {
                setLocationName(e.target.value);
                setLocationSource("MANUAL");
              }}
              placeholder="e.g. Near Kopargaon Bus Stand Bay 2, or Pohegaon Turn"
              className="w-full p-2.5 bg-white border border-gray-200 rounded-[6px] text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-950/10 focus:border-gray-900"
            />
          </div>

          {/* Coordinates Confirmation Box */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-[6px] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5 text-gray-700">
              <MapPin className="w-3.5 h-3.5 text-gray-500" />
              <span>Coordinates:</span>
            </div>
            <span className="font-semibold text-gray-950">
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </span>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* STEP 4: DETAILS, PHOTO & SEVERITY          */}
      {/* ========================================== */}
      {currentStep === 4 && (
        <div className="bg-white border border-gray-200 rounded-[8px] p-4 sm:p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold font-sans text-gray-950">
              Details & Photos
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Describe what occurred and optionally attach a photo.
            </p>
          </div>

          {/* Description Textarea */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-800">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue clearly (e.g. Bus arrived 20 minutes late; deep pothole blocking left lane)..."
              className="w-full p-2.5 bg-white border border-gray-200 rounded-[6px] text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-950/10 focus:border-gray-900"
            />
          </div>

          {/* Date & Time Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-800">
              When did this happen?
            </label>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-[6px] text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-950/10 focus:border-gray-900"
            />
          </div>

          {/* Photo Upload Attachment */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-800">
              Add a Photo (Optional)
            </label>
            {photoDataUrl ? (
              <div className="relative border border-gray-200 rounded-[6px] p-2 bg-gray-50 flex items-center gap-3">
                <img
                  src={photoDataUrl}
                  alt="Attached evidence"
                  className="w-14 h-14 object-cover rounded-[4px] border border-gray-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-900 truncate">
                    {photoFileName || "attached_photo.jpg"}
                  </div>
                  <div className="text-[10.5px] text-emerald-700 font-medium mt-0.5">
                    ✓ Photo ready to attach
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPhotoDataUrl(null);
                    setPhotoFileName(null);
                  }}
                  className="p-1.5 text-gray-500 hover:text-red-700 rounded-[4px] hover:bg-gray-200 transition-colors"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border border-dashed border-gray-300 hover:border-gray-400 rounded-[6px] p-4 text-center cursor-pointer bg-gray-50 flex flex-col items-center justify-center gap-1.5 transition-colors">
                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-gray-900">
                  Tap to upload photo from camera or library
                </div>
                <div className="text-[10px] text-gray-500">
                  PNG, JPG, or WebP up to 5MB
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Citizen Severity */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-800">
              How serious is this problem?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "LOW", label: "Low", desc: "Minor inconvenience" },
                { id: "NORMAL", label: "Normal", desc: "Affects travel" },
                { id: "URGENT", label: "Urgent", desc: "Safety risk" },
              ].map((sev) => (
                <button
                  key={sev.id}
                  type="button"
                  onClick={() => setCitizenSeverity(sev.id as CitizenSeverity)}
                  className={cn(
                    "p-2.5 rounded-[6px] border text-center transition-all",
                    citizenSeverity === sev.id
                      ? "bg-gray-950 text-white border-gray-950 font-bold"
                      : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <div className="text-xs font-bold">{sev.label}</div>
                  <div className="text-[9.5px] opacity-80 mt-0.5">{sev.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Anonymous / Contact Toggle */}
          <div className="pt-3 border-t border-gray-100 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-gray-950 rounded border-gray-300 focus:ring-gray-950"
              />
              <span className="text-xs font-medium text-gray-900">
                Submit this report anonymously
              </span>
            </label>

            {!isAnonymous ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Your Name (optional)"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  className="p-2 bg-white border border-gray-200 rounded-[6px] text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-950/10 focus:border-gray-900"
                />
                <input
                  type="tel"
                  placeholder="Phone / WhatsApp (optional)"
                  value={citizenPhone}
                  onChange={(e) => setCitizenPhone(e.target.value)}
                  className="p-2 bg-white border border-gray-200 rounded-[6px] text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-950/10 focus:border-gray-900"
                />
              </div>
            ) : (
              <p className="text-[10.5px] text-gray-500">
                Anonymous reports are fully logged in our system. You won't receive direct SMS updates unless contact info is provided.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* STEP 5: REVIEW & CONFIRMATION              */}
      {/* ========================================== */}
      {currentStep === 5 && (
        <div className="bg-white border border-gray-200 rounded-[8px] p-4 sm:p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold font-sans text-gray-950">
              Review your report
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Please verify the details below before submitting to Kopargaon mobility operations.
            </p>
          </div>

          <div className="border border-gray-200 rounded-[6px] divide-y divide-gray-100 text-xs">
            <div className="p-2.5 flex justify-between">
              <span className="text-gray-500">Category:</span>
              <span className="font-semibold text-gray-900">
                {categoryOptions.find((c) => c.id === category)?.title}
              </span>
            </div>

            <div className="p-2.5 flex justify-between">
              <span className="text-gray-500">Issue:</span>
              <span className="font-semibold text-gray-900">
                {getIssuesForCategory(category).find((i) => i.id === issueType)?.label}
              </span>
            </div>

            {relatedEntityName && (
              <div className="p-2.5 flex justify-between">
                <span className="text-gray-500">Entity:</span>
                <span className="font-mono font-semibold text-gray-900">
                  {relatedEntityName}
                </span>
              </div>
            )}

            <div className="p-2.5 flex justify-between">
              <span className="text-gray-500">Location:</span>
              <span className="font-medium text-gray-900 text-right truncate max-w-[200px]">
                {locationName}
              </span>
            </div>

            <div className="p-2.5 flex justify-between">
              <span className="text-gray-500">Severity:</span>
              <span className="font-semibold text-gray-900 capitalize">
                {citizenSeverity.toLowerCase()}
              </span>
            </div>

            <div className="p-2.5 space-y-1">
              <div className="text-gray-500">Description:</div>
              <div className="text-gray-900 bg-gray-50 p-2 rounded-[4px] font-sans">
                {description}
              </div>
            </div>

            {photoDataUrl && (
              <div className="p-2.5 flex items-center justify-between">
                <span className="text-gray-500">Photo Attached:</span>
                <span className="font-semibold text-emerald-800">1 Image</span>
              </div>
            )}

            <div className="p-2.5 flex justify-between">
              <span className="text-gray-500">Reporter:</span>
              <span className="text-gray-900">
                {isAnonymous ? "Anonymous" : citizenName || "Citizen"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setCurrentStep((s) => s - 1);
            }}
            disabled={submitting}
            className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 rounded-[8px] text-xs font-medium transition-colors"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="px-5 py-2.5 bg-gray-950 hover:bg-gray-850 text-white rounded-[8px] text-xs font-semibold tracking-tight transition-colors shadow-xs touch-press flex items-center gap-1 ml-auto"
          >
            <span>Continue</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmitReport}
            disabled={submitting}
            className="px-6 py-2.5 bg-gray-950 hover:bg-gray-850 disabled:opacity-50 text-white rounded-[8px] text-xs font-semibold tracking-tight transition-colors shadow-xs touch-press flex items-center gap-1.5 ml-auto"
          >
            {submitting ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Submitting report...</span>
              </>
            ) : (
              <span>Submit report</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
