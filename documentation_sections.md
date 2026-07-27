# SevaCare Project Documentation (Sections 1.11.1 to 1.12)

Here is the detailed documentation for the sections you requested. You can copy the text and diagrams directly into your project report. 

## 1.11 Design

### 1.11.1 Entity Relationship Diagram
The Entity-Relationship (ER) diagram illustrates the relationship between the core entities in the SevaCare system. The architecture relies on Supabase Auth for user management, with interconnected entities for residents, medical records, and staff.

```mermaid
erDiagram
    AUTH_USERS ||--o{ DAILY_LOGS : "logs"
    AUTH_USERS ||--o{ HEALTH_RECORDS : "records"
    AUTH_USERS ||--o| STAFF : "maps to"
    AUTH_USERS ||--o| FAMILY_MEMBERS : "maps to"
    AUTH_USERS ||--o{ INVENTORY : "updates"
    
    RESIDENTS ||--o{ DAILY_LOGS : "has"
    RESIDENTS ||--o{ HEALTH_RECORDS : "has"
    RESIDENTS ||--o{ FAMILY_MEMBERS : "has"
    RESIDENTS ||--o{ PRESCRIPTIONS : "needs"
    RESIDENTS ||--o{ ACTIVITIES : "performs"
    RESIDENTS ||--o{ EMERGENCY_ALERTS : "triggers"
    
    STAFF ||--o{ SCHEDULES : "assigned to"

    AUTH_USERS {
        uuid id PK
        string email
    }
    RESIDENTS {
        uuid id PK
        string name
        int age
        string room_number
        string mobility_status
    }
    STAFF {
        uuid id PK
        uuid user_id FK
        string name
        string role
    }
    DAILY_LOGS {
        uuid id PK
        uuid resident_id FK
        uuid caretaker_id FK
        string status
        boolean meal_taken
    }
    HEALTH_RECORDS {
        uuid id PK
        uuid resident_id FK
        string blood_pressure
        int heart_rate
    }
    PRESCRIPTIONS {
        uuid id PK
        uuid resident_id FK
        string medicine_name
        string dosage
    }
    INVENTORY {
        uuid id PK
        string item_name
        int quantity
    }
    EMERGENCY_ALERTS {
        uuid id PK
        uuid resident_id FK
        string severity
        string alert_type
    }
```

### 1.11.2 Class Diagram
The Class diagram represents the object-oriented structure of the backend models and frontend data interfaces. It defines the properties, methods, and inheritances of the core system components.

```mermaid
classDiagram
    class User {
        +UUID id
        +String email
        +login()
        +logout()
        +resetPassword()
    }
    class Resident {
        +UUID id
        +String name
        +Int age
        +String room_number
        +String mobilityStatus
        +String[] criticalConditions
        +getMedicalHistory()
        +updateStatus()
    }
    class Staff {
        +UUID id
        +UUID userId
        +String name
        +String role
        +String phone
        +recordDailyLog()
        +triggerEmergency()
    }
    class DailyLog {
        +UUID id
        +UUID residentId
        +UUID caretakerId
        +String status
        +Boolean mealTaken
        +saveLog()
    }
    class EmergencyAlert {
        +UUID id
        +UUID residentId
        +String alertType
        +String severity
        +resolveAlert()
    }
    class Inventory {
        +UUID id
        +String itemName
        +Int quantity
        +String category
        +updateStock()
        +replenish()
    }

    User <|-- Staff : extends
    Staff --> DailyLog : creates
    Staff --> EmergencyAlert : triggers
    Resident "1" *-- "*" DailyLog : contains
    Resident "1" *-- "*" EmergencyAlert : involves
```

### 1.11.3 Use Case Diagram
The Use Case diagram dictates the interactions between external actors (users acting in different roles) and the system boundaries. 

* **Admin:** Overlooks the facility, manages staff, and tracks inventory levels.
* **Staff (Nurse/Caretaker):** Interacts directly with residents, logging vitals and triggering SOS alerts when needed.
* **Family Member:** Receives updates, monitors resident wellbeing and receives automated notifications.

```mermaid
graph LR
    %% Actors
    Admin([Admin])
    Staff([Staff/Nurse])
    Family([Family Member])

    %% Use Cases
    subgraph SevaCare System
        UC1(Manage Residents)
        UC2(Manage Staff & Schedules)
        UC3(Log Daily Vitals / Activities)
        UC4(Trigger Emergency/SOS Alert)
        UC5(View Progress Reports)
        UC6(Maintain Inventory)
    end

    %% Relationships
    Admin --> UC1
    Admin --> UC2
    Admin --> UC6
    Staff --> UC1
    Staff --> UC3
    Staff --> UC4
    Family --> UC5
```

---

## 1.12 Database Design
The application utilizes a PostgreSQL relational database structured via Supabase. Below is the comprehensive data dictionary denoting the physical schema layout.

### Table: `residents`
Stores baseline demographic and physical status information for the old age home residents.
* `id` (UUID, Primary Key)
* `name` (TEXT, Not Null)
* `age` (INTEGER, Not Null)
* `room_number` (TEXT)
* `mobility_status` (TEXT) - Independent, Assisted, or Bedridden
* `critical_conditions` (TEXT Array)
* `created_at` (TIMESTAMPTZ)

### Table: `daily_logs`
Tracks qualitative day-to-day observations managed by caretakers.
* `id` (UUID, Primary Key)
* `resident_id` (UUID, Foreign Key) -> `residents.id`
* `caretaker_id` (UUID, Foreign Key) -> `auth.users.id`
* `status` (TEXT) - good, fair, poor, critical
* `meal_taken` (BOOLEAN)
* `medication_taken` (BOOLEAN)
* `mood` (TEXT)
* `logged_at` (TIMESTAMPTZ)

### Table: `health_records`
Detailed logs of physiological metrics / vitals.
* `id` (UUID, Primary Key)
* `resident_id` (UUID, Foreign Key) -> `residents.id`
* `blood_pressure` (TEXT)
* `heart_rate` (INTEGER)
* `temperature` (DECIMAL)
* `blood_sugar` (DECIMAL)
* `recorded_at` (TIMESTAMPTZ)

### Table: `emergency_alerts`
Logs system SOS triggers mapped to individual residents.
* `id` (UUID, Primary Key)
* `resident_id` (UUID, Foreign Key) -> `residents.id`
* `alert_type` (TEXT) - medical, fall, fire, etc.
* `severity` (TEXT) - low, medium, high, critical
* `resolved` (BOOLEAN)
* `triggered_by` (UUID, Foreign Key) -> `auth.users.id`

### Table: `inventory`
Manages supplies like medications and medical equipment.
* `id` (UUID, Primary Key)
* `item_name` (TEXT, Not Null)
* `category` (TEXT) - medicine, equipment, supplies
* `quantity` (INTEGER)
* `min_threshold` (INTEGER)
* `updated_by` (UUID, Foreign Key) -> `auth.users.id`

### Table: `staff`
Stores metadata regarding caretakers, doctors, and general workers.
* `id` (UUID, Primary Key)
* `user_id` (UUID, Foreign Key) -> `auth.users.id`
* `name` (TEXT, Not Null)
* `role` (TEXT) - nurse, caretaker, doctor, admin
* `phone` (TEXT)
* `is_active` (BOOLEAN)
