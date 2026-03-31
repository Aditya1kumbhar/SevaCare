# Case Study 1: SevaCare Platform

## 1.1 Abstract
The management of senior citizens and differently-abled individuals in elder care facilities often relies on antiquated, paper-based systems, leading to high data retrieval latency and delayed emergency responses. This project, **SevaCare**, proposes a highly available, digital-first management platform. Engineered using a modern JavaScript stack (**Next.js 16, React 19**), the system provides an **Offline-First Progressive Web App (PWA)** architecture. By utilizing **Dexie.js (IndexedDB)** for local state caching and **Supabase (PostgreSQL)** for authoritative cloud storage, the system ensures continuous tracking of vitals and automated medication reminders even during network grid partitions. The platform transforms the care environment from a reactive state to a proactive, real-time sanctuary using event-driven WebSockets.

## 1.2 Rationale of the Study
The traditional workflows in old age homes suffer from severe data siloing and lack of interoperability. Care centers managing differently-abled people require immediate access to aggregated health metrics, which manual, paper-based architectures fundamentally cannot provide. The rationale for developing SevaCare is to bridge this technological gap. By implementing a decentralized, edge-ready architecture, we eliminate the single points of failure present in conventional record-keeping. The deployment of a robust, relational database schema backed by **Row Level Security (RLS)** ensures that caretakers are equipped with secure, real-time telemetry, directly elevating the standard of medical and psychological care.

## 1.3 Problem Definition
Through an analysis of the computational and operational bottlenecks within old age homes, the following core system deficits were identified:

1. **Relational Data Disaggregation (Information Fragmentation):** Critical health markers (e.g., life-threatening allergies, specific mobility statuses, and communication barriers) are traditionally stored in unstructured, physical formats. This lack of a normalized database structure exponentially increases query time during emergency retrievals.
2. **Latency in Asynchronous Event Handling (Emergency Response):** When a resident experiences a traumatic event (e.g., falls, wandering), legacy facilities lack a real-time pub/sub notification layer to trigger multi-node staff alerts instantaneously.
3. **UX/Engagement Deficits (Lack of Activity):** Facilities do not employ standardized, digitized frameworks for tracking and promoting resident wellness. The lack of interactive frontend modules leads to a regression in physical and cognitive rehabilitation tracking.
4. **Network Partition Vulnerabilities (Infrastructure Deficits):** Facilities operating in zones with high packet loss or unstable network topology render traditional cloud-only Software-as-a-Service (SaaS) models ineffective, endangering real-time data persistence.

## 1.4 Objectives
The primary engineering and operational objectives are:
* To normalize and migrate highly unstructured resident data into a secure, **PostgreSQL** relational database.
* To drastically reduce network dependency by implementing **Service Workers** and client-side database caching.
* To establish a real-time alerting mechanism utilizing **Supabase Realtime (WebSockets)** to broadcast critical events.
* To implement a Zero-Server-Export mechanism capable of generating compliance-ready PDF reports directly on the client side.
* To develop an accessible, component-driven User Interface (UI) using **Tailwind CSS** to track the efficacy of wellness programs.

## 1.5 Methodology
The study adopts an Agile Software Development Lifecycle (SDLC) combined with Component-Driven UI principles:
1. **Requirement Engineering:** Modeling the specific edge cases of differently-abled senior citizens through exact data types (Enums, Arrays) for mobility and communication restrictions.
2. **System Architecture Design:** Adopting a **Serverless framework (Next.js App Router)** coupled with an offline-first **PWA manifest** to circumvent infrastructure unreliability.
3. **Database & API Implementation:** Developing scalable schema migrations applying strict primary/foreign key constraints and exposing endpoints securely via **PostgREST**.
4. **State Management & Synchronization:** Utilizing optimistic UI updates and background synchronization protocols to reconcile local IndexedDB state with the master Supabase database upon network reconnection.

*(Note: 1.6 Observation/Data Collection, 1.7 Results, and 1.8 Geo-Tag Photos are executed post-deployment).*

## 1.9 Proposed Solution
The SevaCare platform engineered specific technical modules to systematically overwrite the identified systemic bottlenecks:

### A. Normalized Relational Profiles (Centralized DB)
Physical records were replaced with a strongly-typed digital database. 
* **Technical Implementation:** Leveraging **PostgreSQL**, the system queries a centralized `residents` table constraint by Enums for variables like 'Mobility Status' and 'Communication Barrier'. This ensures $O(1)$/indexed lookup speeds for caretakers retrieving lifesaving metadata during an emergency.

### B. Automated Telemetry & Event Cron-Tasks
The system eliminates the cognitive load of manual tracking by rendering impending tasks dynamically.
* **Technical Implementation:** Vitals (BP, Sugar) are captured via **React Hook Forms** validated stringently by **Zod** schema validators before execution. The frontend state consumes data to conditionally render urgent visual cues for overdue medications without requiring page reloads.

### C. The Interactive Wellness Hub
A dedicated front-end engine designed to stimulate and track resident rehabilitation.
* **Technical Implementation:** Built with modular **React Components**, the hub provides guided interface flows (timers, visual cues) for physical routines. Completion data is securely POSTed to the backend `activities` table to structurally chart and graph a resident's cognitive and physical progression over time.

### D. Offline-First Synchronization (PWA Resilience)
Ensuring 100% operational uptime irrespective of local ISP failures.
* **Technical Implementation:** By registering a **Service Worker (sw.js)** and utilizing **Dexie.js** (an IndexedDB wrapper), API POST requests made while offline are intercepted and serialized locally. Upon detecting a `navigator.onLine` event, a synchronization queue flushes the payload to the Supabase endpoint asynchronously, preventing data starvation.

### E. Automated Telemetry Export (One-Click PDF Generation)
To ensure compliance with external medical audits or family transparency requests, the system is engineered to port digital records into universally accepted formats instantaneously.
* **Technical Implementation:** Utilizing **jsPDF** and **jspdf-autotable**, the React front-end parses the normalized JSON payload containing a resident's vitals, activities, and metadata. This payload is mathematically formatted into an A4 PDF blob entirely on the client-side (Zero-Server-Export). This enables an immediate, one-click download mechanism without stressing backend REST APIs constraints.

## 1.10 Objective of System
The objective of the SevaCare system is to establish a highly available, fault-tolerant software ecosystem. By decoupling the frontend client from immediate backend reliance through offline caching, and by encrypting data transport, the system aims to provide caretakers with an infallible digital assistant that prioritizes data integrity and instantaneous event broadcasting.

## 1.11 Design
### 1.11.1 Entity Relationship Concept
The schema is designed in the Third Normal Form (3NF). The foundational entity is the **Resident** (`id` UUID PRIMARY KEY). Related physical entities such as **Health Records** and **Activities** possess foreign keys (`resident_id`) referencing the Resident table with `ON DELETE CASCADE` rules. **Emergency Alerts** exist as real-time actionable rows referencing the same resident UUID.

### 1.11.2 Class/Architecture Diagram (Logical)
The architecture follows a decoupled **Client-Server model**:
* **Presentation Layer:** Next.js Server Components and Client Components rendering the DOM.
* **Local Persistence Layer:** Dexie.js interfacing with the browser's IndexedDB.
* **API/Transport Layer:** Next.js Route Handlers and Supabase Client mapping REST/WebSocket requests.
* **Data Layer:** Hosted PostgreSQL executing SQL transactions.

### 1.11.3 Use Case Concept
* **Authenticated Caretaker Mode:** Employs JWT (JSON Web Tokens) to authorize the client. Can execute INSERTs on health logs, TRIGGER `high-severity` alerts over WebSockets, and operates the UI in offline mode.
* **System/Database Mode:** Evaluates Row Level Security (RLS) policies to block unauthorized data mutations, ensuring cross-tenant isolation.

## 1.12 Database Design
The persistence layer utilizes a sophisticated SQL configuration:
1. **Immutable Identifiers:** All primary tables utilize `gen_random_uuid()` to prevent ID sequencing attacks and ensure unique hashing.
2. **Data Constraints:** Hardened `CHECK` clauses in PostgreSQL (e.g., `CHECK (severity IN ('low', 'medium', 'high', 'critical'))`) to prevent corrupted client data from entering the database.
3. **Security:** Implementation of **Row Level Security (RLS)** using `auth.uid()` checks ensures that only authenticated application layers can `SELECT` or `INSERT` healthcare records, achieving HIPAA-like stringent data encapsulation.

*(Note: 1.13 Screen Shots and 1.14 Test Cases are derived during the User Acceptance Testing phase).*

## 1.15 References
1. Vercel / Next.js Documentation on Edge runtimes and Server Components.
2. Supabase / PostgreSQL Documentation regarding Row Level Security policies and PostgREST.
3. W3C specifications on Service Workers and Progressive Web Application caching strategies.
4. Dexie.js Documentation for asynchronous IndexedDB transactions.
