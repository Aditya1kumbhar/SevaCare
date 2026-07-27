export interface DoctorSchedule {
  attending_physician: string;
  specialty: string;
  visit_time: string;
  staff_prep_time: string;
}

export interface EmergencyContacts {
  national_ambulance: string;
  police: string;
  facility_physician: string;
}

export interface ResidentProfile {
  name: string;
  room: string;
  chronic_conditions: string[];
  known_allergies: string[];
  daily_medications: string[];
  emergency_note: string;
}

export interface FirstAidProtocol {
  condition: string;
  action_steps: string[];
  warnings: string;
}

export const KNOWLEDGE_BASE = {
  facility_sops: {
    doctor_schedule: {
      attending_physician: "Dr. Kulkarni",
      specialty: "General Physician",
      visit_time: "Every Tuesday at 4:00 PM",
      staff_prep_time: "3:30 PM (Vitals log and health chart review required)"
    },
    emergency_contacts: {
      national_ambulance: "108",
      police: "112",
      facility_physician: "Dr. Kulkarni"
    }
  },
  first_aid_sops: {
    hypoglycemia: {
      condition: "Low Blood Sugar / Hypoglycemia (<70 mg/dL)",
      action_steps: [
        "If conscious: Apply Rule of 15 — Give 15g fast sugar (3-4 tsp sugar dissolved in water or 150ml fruit juice).",
        "Wait 15 minutes, re-check blood glucose level."
      ],
      warnings: "CRITICAL SAFETY: If resident is unconscious or confused, NEVER give oral liquids due to high choking risk. Immediately place resident in recovery position on side and call 108."
    },
    chest_pain: {
      condition: "Chest Pain / Suspected Cardiac Event",
      action_steps: [
        "Have resident sit upright immediately.",
        "Loosen all tight clothing around neck and chest.",
        "Call national emergency ambulance at 108 immediately."
      ],
      warnings: "Do NOT administer Aspirin or Sorbitrate unless specifically pre-approved by their cardiologist."
    },
    bp_spike: {
      condition: "High Blood Pressure Spike (>180/120 mmHg)",
      action_steps: [
        "Move resident to a quiet, cool, dimly lit room.",
        "Allow resident to rest quietly for 15 minutes before re-checking BP.",
        "Contact attending physician (Dr. Kulkarni) for SOS medication guidance."
      ],
      warnings: "Monitor closely for dizziness, severe headache, or blurred vision."
    },
    heat_stroke: {
      condition: "Heat Stroke / Severe Overheating",
      action_steps: [
        "Move resident immediately to an AC or fan-cooled room.",
        "Apply wet cool towels to neck, forehead, and armpits.",
        "Offer small sips of ORS or salted buttermilk if fully conscious."
      ],
      warnings: "Do not plunge in ice water; cool down steadily."
    }
  },
  resident_profiles: [
    {
      name: "Rajesh Kumar",
      room: "204",
      chronic_conditions: ["Type 2 Diabetes", "High BP", "Osteoarthritis"],
      known_allergies: ["Penicillin", "Sulfa Drugs"],
      daily_medications: ["Metformin 500mg", "Telmisartan 40mg"],
      emergency_note: "High risk for sudden sugar drops (hypoglycemia)."
    }
  ]
};
