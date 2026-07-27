// SevaCare Shared Types
// Common type definitions shared between frontend and potential backend services

export interface Resident {
  id: string;
  name: string;
  age: number;
  room_number: string;
  family_contact_name?: string;
  family_phone_number?: string;
  blood_group?: string;
  life_threatening_allergies?: string;
  mobility_status?: string;
  critical_conditions?: string;
  wandering_risk?: boolean;
  aggression_triggers?: string;
  communication_barrier?: string;
  medications?: Medication[];
  gamification_score?: number;
  activity_streak?: number;
  last_activity_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  time: string;
}

export interface DailyLog {
  id: string;
  resident_id: string;
  caretaker_id: string;
  status: 'good' | 'fair' | 'poor' | 'critical';
  meal_taken: boolean;
  medication_taken: boolean;
  mood?: string;
  notes?: string;
  logged_at: string;
}

export interface HealthRecord {
  id: string;
  resident_id: string;
  blood_pressure?: string;
  heart_rate?: number;
  temperature?: number;
  weight?: number;
  blood_sugar?: number;
  oxygen_level?: number;
  notes?: string;
  recorded_at: string;
}

export interface EmergencyAlert {
  id: string;
  resident_id: string;
  alert_type: 'medical' | 'fall' | 'missing' | 'fire' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  resolved: boolean;
  resolved_at?: string;
  escalated?: boolean;
  created_at: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'nurse' | 'caretaker' | 'doctor' | 'volunteer' | 'admin';
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface TelemedicineSession {
  id: string;
  resident_id: string;
  doctor_name: string;
  room_code: string;
  started_at: string;
  ended_at?: string;
  notes?: string;
  bandwidth_mode: 'low' | 'normal';
}

export interface ConsentRecord {
  id: string;
  resident_id: string;
  consent_type: string;
  granted: boolean;
  granted_by: string;
  created_at: string;
}
