# RentTrack System ERD

## Entity Relationship Diagram

```mermaid
flowchart TD
    USERS["USERS<br/>id PK<br/>name, email, role<br/>phone, address<br/>avatar_url<br/>id_verification_url<br/>id_verification_status<br/>created_at"]
    UPLOADS["UPLOADS<br/>id PK<br/>user_id FK<br/>type<br/>data, mime_type<br/>size, created_at"]
    PROPERTIES["PROPERTIES<br/>id PK<br/>name, location, type<br/>units, occupied_units<br/>monthly_revenue<br/>status, image_url<br/>created_by FK<br/>created_at"]
    UNITS["UNITS<br/>id PK<br/>property_id FK<br/>unit_number, floor<br/>status, rent_amount<br/>tenant_name, tenant_id<br/>lease_end, image_url"]
    TENANTS["TENANTS<br/>id PK<br/>name, email, phone<br/>address, occupation<br/>unit_id FK<br/>property_name<br/>unit_number<br/>contract_start, end<br/>rent_amount, status<br/>created_by FK<br/>created_at"]
    PAYMENTS["PAYMENTS<br/>id PK<br/>tenant_id FK<br/>tenant_name, unit_id<br/>property_name<br/>amount_paid, due, balance<br/>payment_date, due_date<br/>status, method<br/>receipt_url, notes<br/>verified_by FK<br/>created_by FK<br/>created_at"]
    NOTIFICATIONS["NOTIFICATIONS<br/>id PK<br/>user_id FK<br/>title, message<br/>type, read<br/>created_at"]
    RATINGS["RATINGS<br/>id PK<br/>user_id FK<br/>target_type<br/>target_id<br/>rating, comment<br/>created_at"]
    COMPLAINTS["COMPLAINTS<br/>id PK<br/>tenant_id FK<br/>target_type, target_id<br/>subject, message<br/>status, priority<br/>assigned_to FK<br/>resolved_at<br/>created_at, updated_at"]
    AUDIT_LOGS["AUDIT_LOGS<br/>id PK<br/>user_id FK<br/>action<br/>ip_address, user_agent<br/>details<br/>created_at"]
    OTP["PAYMENT_VERIFICATION_CODES<br/>id PK<br/>user_id FK<br/>purpose<br/>code_hash<br/>expires_at<br/>consumed_at<br/>created_at"]

    USERS -->|1:N| UPLOADS
    USERS -->|1:N| PROPERTIES
    USERS -->|1:N| TENANTS
    USERS -->|1:N| NOTIFICATIONS
    USERS -->|1:N| RATINGS
    USERS -->|1:N| COMPLAINTS
    USERS -->|1:N| AUDIT_LOGS
    USERS -->|1:N| OTP
    USERS -->|1:N| PAYMENTS

    PROPERTIES -->|1:N| UNITS
    PROPERTIES -->|1:N| TENANTS

    UNITS -->|1:N| TENANTS

    TENANTS -->|1:N| PAYMENTS
    TENANTS -->|1:N| COMPLAINTS
```

## Tables Overview

| Table | Records | Description |
|-------|---------|-------------|
| **USERS** | All users | Admin, Owner, Agent, Tenant accounts |
| **UPLOADS** | File storage | Avatars, IDs, property images, unit images, receipts |
| **PROPERTIES** | Properties | Registered rental properties |
| **UNITS** | Units | Individual rental units |
| **TENANTS** | Tenants | Tenant records |
| **PAYMENTS** | Payments | Payment transactions |
| **NOTIFICATIONS** | Notifications | User notifications |
| **RATINGS** | Ratings | Property/unit ratings |
| **COMPLAINTS** | Complaints | Tenant complaints |
| **AUDIT_LOGS** | Audit trail | System action logs |
| **PAYMENT_VERIFICATION_CODES** | OTP codes | Payment verification codes |

## Relationships

```
USERS (1) ----< (N) UPLOADS
USERS (1) ----< (N) PROPERTIES
USERS (1) ----< (N) TENANTS
USERS (1) ----< (N) NOTIFICATIONS
USERS (1) ----< (N) RATINGS
USERS (1) ----< (N) COMPLAINTS
USERS (1) ----< (N) AUDIT_LOGS
USERS (1) ----< (N) PAYMENT_VERIFICATION_CODES
USERS (1) ----< (N) PAYMENTS

PROPERTIES (1) ----< (N) UNITS
PROPERTIES (1) ----< (N) TENANTS
UNITS (1) ----< (N) TENANTS
TENANTS (1) ----< (N) PAYMENTS
TENANTS (1) ----< (N) COMPLAINTS
```

## User Roles

| Role | Access Level |
|------|-------------|
| **Admin** | Full system access |
| **Owner** | Full system access |
| **Agent** | Tenant management, payment verification |
| **Tenant** | View properties, make payments, submit complaints |
