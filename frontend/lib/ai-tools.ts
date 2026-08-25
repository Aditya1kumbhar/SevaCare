import { createClient } from '@/lib/supabase/client';

export const AI_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "fetch_resident_profile",
      description: "Fetches the medical history, allergies, and current medications of a resident to provide context for medical advice.",
      parameters: {
        type: "object",
        properties: {
          resident_name: {
            type: "string",
            description: "The name of the resident (e.g. 'Rajesh Sharma')."
          }
        },
        required: ["resident_name"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "log_symptom",
      description: "Logs a non-emergency medical symptom (e.g., headache, mild fever) into the daily log for caretakers to review.",
      parameters: {
        type: "object",
        properties: {
          resident_name: {
            type: "string",
            description: "The name of the resident experiencing the symptom."
          },
          symptom_description: {
            type: "string",
            description: "A short description of the symptom in English."
          }
        },
        required: ["resident_name", "symptom_description"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "trigger_emergency_alert",
      description: "Triggers a high-priority emergency alert (e.g., for falls, severe chest pain, unconsciousness, heavy bleeding). This instantly pages caretakers and medical staff.",
      parameters: {
        type: "object",
        properties: {
          resident_name: {
            type: "string",
            description: "The name of the resident in distress."
          },
          emergency_type: {
            type: "string",
            description: "The type of emergency (e.g., 'Fall', 'Cardiac Arrest', 'Bleeding')."
          }
        },
        required: ["resident_name", "emergency_type"]
      }
    }
  }
];

export async function executeAiTool(toolName: string, args: any): Promise<string> {
  const supabase = createClient();
  
  try {
    switch (toolName) {
      case 'fetch_resident_profile': {
        // In a real app, query the resident's medical records table by name.
        // For hackathon mock, we return a structured summary.
        return JSON.stringify({
          status: "success",
          data: {
            name: args.resident_name,
            age: 72,
            blood_type: "O+",
            known_conditions: ["Hypertension", "Mild Arthritis"],
            allergies: ["Penicillin"],
            current_medications: ["Amlodipine 5mg daily", "Ibuprofen PRN for joint pain"],
            recent_vitals_summary: "Normal BP yesterday. Heart rate steady."
          }
        });
      }

      case 'log_symptom': {
        // Mock logging symptom to database
        console.log(`[AI Agent] Logged symptom for ${args.resident_name}: ${args.symptom_description}`);
        return JSON.stringify({
          status: "success",
          message: `Symptom successfully recorded in daily logs. Caretaker has been softly notified.`
        });
      }

      case 'trigger_emergency_alert': {
        // Mock triggering emergency
        console.log(`[AI Agent] 🚨 EMERGENCY ALERT TRIGGERED for ${args.resident_name}: ${args.emergency_type}`);
        return JSON.stringify({
          status: "success",
          message: `CRITICAL ALERT FIRED. Emergency medical team and caretakers are en route immediately. Inform the patient help is on the way.`
        });
      }

      default:
        return JSON.stringify({ status: "error", message: `Tool ${toolName} not found.` });
    }
  } catch (error: any) {
    return JSON.stringify({ status: "error", message: error.message });
  }
}
