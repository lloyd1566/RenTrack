# RentTrack System Flowchart

## Complete System Flow

```mermaid
flowchart TD
    Start([User visits RentTrack]) --> Landing[Landing Page]
    Landing --> AuthChoice{Has Account?}
    
    AuthChoice -->|Sign Up| Signup[Registration Form]
    AuthChoice -->|Login| Login[Login Form]
    
    Signup --> RoleSelect{Select Role}
    RoleSelect -->|Tenant| TenantSignup[Tenant Registration]
    RoleSelect -->|Agent| AgentSignup[Agent Registration]
    RoleSelect -->|Admin/Owner| AdminSignup[Admin Registration]
    
    TenantSignup --> EmailVerify[Email Verification OTP]
    AgentSignup --> EmailVerify
    AdminSignup --> EmailVerify
    
    EmailVerify --> Verified{Verified?}
    Verified -->|No| EmailVerify
    Verified -->|Yes| IDCheck{ID Uploaded?}
    
    Login --> CredCheck{Valid Credentials?}
    CredCheck -->|No| Login
    CredCheck -->|Yes| IDCheck
    
    IDCheck -->|No| IDUpload[Upload ID for Verification]
    IDCheck -->|Yes| IDStatus{ID Status?}
    
    IDUpload --> AdminReview[Admin/Owner Reviews ID]
    AdminReview -->|Approved| IDStatus
    AdminReview -->|Rejected| IDUpload
    
    IDStatus -->|Pending| IDUpload
    IDStatus -->|Rejected| IDUpload
    IDStatus -->|Approved| Dashboard[Role-Based Dashboard]
    
    Dashboard --> Role{Role?}
    
    Role -->|Admin/Owner| AdminDash[Admin Dashboard]
    Role -->|Agent| AgentDash[Agent Dashboard]
    Role -->|Tenant| TenantDash[Tenant Dashboard]
    
    %% Admin/Owner Flows
    AdminDash --> AdminActions{Choose Action}
    AdminActions -->|Properties| PropMgmt[Property Management]
    AdminActions -->|Units| UnitMgmt[Unit Management]
    AdminActions -->|Tenants| TenantMgmt[Tenant Management]
    AdminActions -->|Agents| AgentMgmt[Agent Management]
    AdminActions -->|Payments| PaymentMgmt[Payment Verification]
    AdminActions -->|Reports| Reports[View Reports]
    AdminActions -->|Settings| Settings[Settings]
    
    PropMgmt --> CreateProp[Create Property]
    PropMgmt --> ViewProps[View Properties]
    PropMgmt --> EditProp[Edit Property]
    
    CreateProp --> AddUnits[Add Units to Property]
    AddUnits --> SetUnitDetails[Set Unit Details<br/>- Unit Number<br/>- Floor<br/>- Rent Amount<br/>- Status]
    SetUnitDetails --> UnitAvailable[Unit Available for Rent]
    
    ViewProps --> PropList[Properties List]
    PropList --> SelectProp[Select Property]
    SelectProp --> ViewUnits[View Units]
    
    TenantMgmt --> TenantList[Tenants List]
    TenantList --> SelectTenant[Select Tenant]
    SelectTenant --> ViewTenantDetails[View Tenant Details]
    ViewTenantDetails --> TenantActions{Tenant Actions}
    TenantActions -->|Request ID| ReqID[Request ID Verification]
    TenantActions -->|Approve ID| ApproveID[Approve ID]
    TenantActions -->|Reject ID| RejectID[Reject ID]
    TenantActions -->|Delete| DeleteTenant[Delete Tenant]
    
    AgentMgmt --> AgentList[Agents List]
    AgentList --> SelectAgent[Select Agent]
    SelectAgent --> ViewAgentDetails[View Agent Details]
    ViewAgentDetails --> AgentActions{Agent Actions}
    AgentActions -->|Reset Password| ResetPwd[Reset Password]
    AgentActions -->|Request ID| ReqAgentID[Request ID Verification]
    AgentActions -->|Delete| DeleteAgent[Delete Agent]
    
    PaymentMgmt --> PendingPayments[Pending Payments List]
    PendingPayments --> ReviewReceipt[Review Receipt]
    ReviewReceipt --> PaymentDecision{Decision}
    PaymentDecision -->|Approve| ApprovePay[Approve Payment]
    PaymentDecision -->|Reject| RejectPay[Reject Payment]
    
    ApprovePay --> UpdateBalance[Update Balance]
    RejectPay --> NotifyReupload[Notify Tenant to Re-upload]
    NotifyReupload --> TenantReupload[Tenant Re-uploads Receipt]
    
    %% Agent Flows
    AgentDash --> AgentActions2{Choose Action}
    AgentActions2 -->|My Tenants| AgentTenants[View My Tenants]
    AgentActions2 -->|My Properties| AgentProperties[View My Properties]
    AgentActions2 -->|Payments| AgentPayments[Verify Payments]
    
    AgentTenants --> ViewAgentTenantDetails[View Tenant Details]
    ViewAgentTenantDetails --> AgentTenantActions{Tenant Actions}
    AgentTenantActions -->|Verify Payment| VerifyPay[Verify Payment]
    AgentTenantActions -->|Request ID| ReqTenantID[Request ID Verification]
    
    AgentPayments --> PendingAgentPayments[Pending Payments]
    PendingAgentPayments --> VerifyPay
    
    VerifyPay --> UpdatePayStatus[Update Payment Status]
    UpdatePayStatus --> NotifyTenant[Notify Tenant]
    
    %% Tenant Flows
    TenantDash --> TenantActions2{Choose Action}
    TenantActions2 -->|Browse| BrowseProps[Browse Properties]
    TenantActions2 -->|Payments| TenantPayments[My Payments]
    TenantActions2 -->|Ratings| TenantRatings[My Ratings]
    TenantActions2 -->|Complaints| TenantComplaints[My Complaints]
    TenantActions2 -->|Settings| TenantSettings[Settings]
    
    BrowseProps --> ViewPropList[View Properties]
    ViewPropList --> SelectUnit[Select Unit]
    SelectUnit --> ViewUnitDetails[View Unit Details]
    ViewUnitDetails --> UnitActions{Unit Actions}
    UnitActions -->|Apply| ApplyUnit[Apply for Unit]
    UnitActions -->|Rate| RateUnit[Rate Unit]
    UnitActions -->|Complain| FileComplaint[File Complaint]
    
    TenantPayments --> ViewPayHistory[View Payment History]
    ViewPayHistory --> UploadReceipt[Upload Payment Receipt]
    UploadReceipt --> ReceiptPending[Receipt Pending Approval]
    ReceiptPending --> AdminReviewReceipt[Admin/Agent Reviews]
    AdminReviewReceipt --> ApprovePay
    AdminReviewReceipt --> RejectPay
    
    ApplyUnit --> SubmitApplication[Submit Application]
    SubmitApplication --> AdminReviewApp[Admin Reviews Application]
    AdminReviewApp -->|Approved| AssignUnit[Assign Unit to Tenant]
    AdminReviewApp -->|Rejected| NotifyReject[Notify Tenant]
    
    AssignUnit --> UnitOccupied[Unit Status = Occupied]
    UnitOccupied --> TenantAssigned[Tenant Assigned]
    
    FileComplaint --> SubmitComplaint[Submit Complaint]
    SubmitComplaint --> NotifyAdmin[Notify Admin/Agent]
    NotifyAdmin --> AdminReviewComplaint[Review Complaint]
    AdminReviewComplaint --> ResolveComplaint[Resolve Complaint]
    ResolveComplaint --> NotifyResolved[Notify Tenant]
    
    RateUnit --> SubmitRating[Submit Rating 1-5]
    SubmitRating --> SaveRating[Save Rating]
    
    TenantSettings --> UpdateProfile[Update Profile]
    TenantSettings --> UploadID[Upload ID]
    UploadID --> IDReview[Admin Reviews ID]
    IDReview --> ApproveID
    IDReview --> RejectID
    
    %% Notifications Flow
    NotifyTenant --> NotifSystem[Notification System]
    NotifyReupload --> NotifSystem
    NotifyReject --> NotifSystem
    NotifyAdmin --> NotifSystem
    NotifyResolved --> NotifSystem
    
    NotifSystem --> StoreNotif[Store in DB]
    StoreNotif --> BadgeCount[Show Badge Count]
    BadgeCount --> UserClicks[User Clicks Notification]
    UserClicks --> MarkRead[Mark as Read]
    
    %% Audit Flow
    AdminActions --> AuditLog[Log Action]
    AgentActions2 --> AuditLog
    TenantActions2 --> AuditLog
    
    AuditLog --> StoreAudit[Store in Audit Logs]
    
    %% Logout
    Dashboard --> Logout[Logout]
    Logout --> End([Session Ended])
    
    %% Styling
    classDef landing fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef auth fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef dashboard fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef admin fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef agent fill:#e0f2f1,stroke:#00695c,stroke-width:2px
    classDef tenant fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef database fill:#f5f5f5,stroke:#616161,stroke-width:2px
    
    class Start,Landing landing
    class AuthChoice,Signup,Login,RoleSelect,TenantSignup,AgentSignup,AdminSignup,EmailVerify,Verified,IDCheck,IDUpload,IDStatus,CredCheck auth
    class Dashboard,Role,AdminDash,AgentDash,TenantDash dashboard
    class AdminActions,PropMgmt,UnitMgmt,TenantMgmt,AgentMgmt,PaymentMgmt,Reports,Settings,CreateProp,AddUnits,SetUnitDetails,UnitAvailable,ViewProps,PropList,SelectProp,ViewUnits,TenantList,SelectTenant,ViewTenantDetails,TenantActions,ReqID,ApproveID,RejectID,DeleteTenant,AgentList,SelectAgent,ViewAgentDetails,AgentActions,ResetPwd,ReqAgentID,DeleteAgent,PendingPayments,ReviewReceipt,PaymentDecision,ApprovePay,RejectPay,UpdateBalance,NotifyReupload admin
    class AgentActions2,AgentTenants,AgentProperties,AgentPayments,ViewAgentTenantDetails,AgentTenantActions,VerifyPay,PendingAgentPayments,UpdatePayStatus,NotifyTenant agent
    class TenantActions2,BrowseProps,ViewPropList,SelectUnit,ViewUnitDetails,UnitActions,ApplyUnit,RateUnit,FileComplaint,TenantPayments,ViewPayHistory,UploadReceipt,ReceiptPending,TenantSettings,UpdateProfile tenant
    class NotifSystem,StoreNotif,BadgeCount,UserClicks,MarkRead,AuditLog,StoreAudit database
```

## User Role Dashboards

### Admin/Owner Dashboard
```mermaid
flowchart TD
    AdminLogin[Admin/Owner Login] --> AdminHome[Dashboard Home]
    AdminHome --> Stats[View Statistics]
    AdminHome --> QuickActions[Quick Actions]
    
    Stats --> TotalProps[Total Properties]
    Stats --> TotalUnits[Total Units]
    Stats --> TotalTenants[Total Tenants]
    Stats --> TotalRevenue[Total Revenue]
    Stats --> PendingVerifications[Pending Verifications]
    
    QuickActions --> AddProperty[+ Add Property]
    QuickActions --> AddUnit[+ Add Unit]
    QuickActions --> AddTenant[+ Add Tenant]
    QuickActions --> ViewPayments[View Payments]
    
    AdminHome --> Sidebar[Navigate via Sidebar]
    Sidebar --> Properties[Properties]
    Sidebar --> Units[Units]
    Sidebar --> Tenants[Tenants]
    Sidebar --> Agents[Agents]
    Sidebar --> Payments[Payments]
    Sidebar --> Reports[Reports]
    Sidebar --> Settings[Settings]
    
    Properties --> PropList[Properties List]
    PropList --> PropDetail[Property Detail]
    PropDetail --> AddUnit2[Add Units]
    PropDetail --> EditProp[Edit Property]
    PropDetail --> DeleteProp[Delete Property]
    
    Units --> UnitList[Units List]
    UnitList --> UnitDetail[Unit Detail]
    UnitDetail --> AssignTenant[Assign Tenant]
    UnitDetail --> EditUnit[Edit Unit]
    UnitDetail --> DeleteUnit[Delete Unit]
    
    Tenants --> TenantList[Tenants List]
    TenantList --> TenantDetail[Tenant Detail]
    TenantDetail --> ViewPayments2[View Payments]
    TenantDetail --> RequestID[Request ID Verification]
    TenantDetail --> DeleteTenant2[Delete Tenant]
    
    Agents --> AgentList[Agents List]
    AgentList --> AgentDetail[Agent Detail]
    AgentDetail --> ResetPassword[Reset Password]
    AgentDetail --> RequestID2[Request ID Verification]
    AgentDetail --> DeleteAgent2[Delete Agent]
    
    Payments --> PaymentList[Payments List]
    PaymentList --> PaymentDetail[Payment Detail]
    PaymentDetail --> VerifyReceipt[Verify Receipt]
    PaymentDetail --> ApprovePayment[Approve]
    PaymentDetail --> RejectPayment[Reject]
    
    Reports --> PaymentReport[Payment Reports]
    Reports --> TenantReport[Tenant Reports]
    Reports --> PropertyReport[Property Reports]
    
    Settings --> Profile[Profile Settings]
    Settings --> Security[Security Settings]
    Settings --> Notifications[Notification Settings]
```

### Agent Dashboard
```mermaid
flowchart TD
    AgentLogin[Agent Login] --> AgentHome[Agent Dashboard]
    AgentHome --> AgentStats[View Statistics]
    AgentHome --> AgentQuickActions[Quick Actions]
    
    AgentStats --> MyTenants[My Tenants]
    AgentStats --> MyProperties[My Properties]
    AgentStats --> PendingPayments[Pending Payments]
    AgentStats --> VacantUnits[Vacant Units]
    
    AgentQuickActions --> AddTenant[+ Add Tenant]
    AgentQuickActions --> ViewPayments[View Payments]
    AgentQuickActions --> RequestID[Request ID]
    
    AgentHome --> AgentSidebar[Navigate via Sidebar]
    AgentSidebar --> AgentDash[Dashboard]
    AgentSidebar --> AgentTenants[Tenants]
    AgentSidebar --> AgentProperties[Properties]
    AgentSidebar --> AgentPayments[Payments]
    
    AgentDash --> Overview[Overview Tab]
    AgentDash --> TenantsTab[Tenants Tab]
    AgentDash --> PendingTab[Pending Verifications]
    AgentDash --> HistoryTab[Payment History]
    
    Overview --> Occupancy[Property Occupancy]
    Overview --> RecentActivity[Recent Tenant Activity]
    
    TenantsTab --> SearchTenants[Search Tenants]
    TenantsTab --> TenantList2[Tenants List]
    TenantList2 --> TenantDetail2[Tenant Detail]
    TenantDetail2 --> ViewPayments3[View Payments]
    TenantDetail2 --> RequestID2[Request ID Verification]
    
    PendingTab --> PendingList[Pending Payments]
    PendingList --> ReviewReceipt2[Review Receipt]
    ReviewReceipt2 --> ApprovePay2[Approve]
    ReviewReceipt2 --> RejectPay2[Reject]
    
    HistoryTab --> PaymentHistory[Payment History Table]
    PaymentHistory --> FilterPayments[Filter by Date/Status]
    PaymentHistory --> ViewReceipt2[View Receipt]
```

### Tenant Dashboard
```mermaid
flowchart TD
    TenantLogin[Tenant Login] --> TenantHome[Tenant Dashboard]
    TenantHome --> TenantStats[View Statistics]
    TenantHome --> TenantQuickActions[Quick Actions]
    
    TenantStats --> CurrentBalance[Current Balance]
    TenantStats --> NextPayment[Next Payment Due]
    TenantStats --> MyUnit[My Unit]
    
    TenantQuickActions --> UploadReceipt[Upload Payment Receipt]
    TenantQuickActions --> BrowseUnits[Browse Units]
    TenantQuickActions --> MakeComplaint[Make Complaint]
    
    TenantHome --> TenantSidebar[Navigate via Top Navbar]
    TenantSidebar --> THome[Home]
    TenantSidebar --> TProperties[Properties]
    TenantSidebar --> TRentManager[Find Rent Manager]
    TenantSidebar --> TBlog[Blog]
    TenantSidebar --> TContact[Contact Us]
    TenantSidebar --> TAbout[About Us]
    TenantSidebar --> TNews[News]
    
    THome --> TenantDashboard2[Dashboard Home]
    TProperties --> BrowseProps[Browse Properties]
    TRentManager --> ViewManagers[View Rent Managers]
    TBlog --> ReadBlog[Read Blog Posts]
    TContact --> ContactForm[Contact Form]
    TAbout --> AboutPage[About Us Page]
    TNews --> NewsPage[News Page]
    
    TenantDashboard2 --> TenantPayments[My Payments]
    TenantDashboard2 --> TenantSettings2[Settings]
    
    TenantPayments --> PaymentHistory2[Payment History]
    PaymentHistory2 --> UploadReceipt2[Upload Receipt]
    UploadReceipt2 --> ReceiptPending2[Pending Approval]
    
    TenantSettings2 --> General[General Info]
    TenantSettings2 --> EditProfile[Edit Profile]
    TenantSettings2 --> Security[Security]
    General --> UploadID2[Upload ID for Verification]
    UploadID2 --> IDPending[Pending Review]
    IDPending --> AdminApproves[Admin Approves]
    AdminApproves --> IDVerified[ID Verified]
    
    BrowseProps --> PropertyGrid[Property Grid]
    PropertyGrid --> UnitGrid[Unit Grid]
    UnitGrid --> UnitDetail2[Unit Details]
    UnitDetail2 --> SubmitRating[Submit Rating]
    UnitDetail2 --> FileComplaint2[File Complaint]
```

## Core System Flows

### Authentication & Authorization Flow
```mermaid
flowchart TD
    A[User] --> B{Authenticated?}
    B -->|No| C[Show Login/Signup]
    C --> D[Enter Credentials]
    D --> E{Valid?}
    E -->|No| F[Show Error]
    F --> D
    E -->|Yes| G{Check Role}
    G -->|admin| H[Admin Dashboard]
    G -->|owner| I[Owner Dashboard]
    G -->|agent| J[Agent Dashboard]
    G -->|tenant| K[Tenant Dashboard]
    
    B -->|Yes| L{Session Valid?}
    L -->|No| C
    L -->|Yes| M{Role-Based Access}
    M --> H
    M --> I
    M --> J
    M --> K
    
    H --> N[Full Access]
    I --> N
    J --> O[Limited Access]
    K --> P[Tenant Access]
```

### Property Lifecycle Flow
```mermaid
flowchart TD
    A[Admin/Owner Creates Property] --> B[Property Status: Active]
    B --> C[Add Units]
    C --> D[Unit Status: Vacant]
    
    D --> E[Tenant Views Property]
    E --> F[Tenant Submits Application]
    F --> G{Admin Reviews}
    G -->|Approve| H[Assign Tenant to Unit]
    G -->|Reject| I[Notify Tenant]
    I --> E
    
    H --> J[Unit Status: Occupied]
    J --> K[Tenant Moves In]
    K --> L[Tenant Makes Payments]
    L --> M[Agent Verifies Payments]
    
    J --> N{Lease Ends?}
    N -->|No| L
    N -->|Yes| O[Unit Status: Vacant]
    O --> D
    
    P[Maintenance Required] --> Q[Unit Status: Maintenance]
    Q --> R[Admin Schedules Repair]
    R --> D
```

### Payment Lifecycle Flow
```mermaid
flowchart TD
    A[Due Date Arrives] --> B[Notify Tenant]
    B --> C[Tenant Uploads Receipt]
    C --> D[Payment Status: Pending]
    D --> E[Notify Admin/Agent]
    
    E --> F{Review Receipt}
    F -->|Valid| G[Payment Status: Paid]
    F -->|Invalid| H[Payment Status: Rejected]
    
    G --> I[Update Balance]
    I --> J[Send Confirmation]
    J --> K[Payment Complete]
    
    H --> L[Notify Tenant]
    L --> M[Tenant Re-uploads]
    M --> C
    
    N[Overdue] --> O[Payment Status: Overdue]
    O --> P[Send Reminder]
    P --> Q[Notify Admin]
    Q --> C
```

### ID Verification Flow
```mermaid
flowchart TD
    A[User Uploads ID] --> B[Store in Uploads Table]
    B --> C[Update User ID URL]
    C --> D[Status: Pending]
    D --> E[Notify Admin/Owner]
    
    E --> F{Admin Action}
    F -->|Approve| G[Status: Approved]
    F -->|Reject| H[Status: Rejected]
    
    G --> I[Grant Full Access]
    I --> J[User Can: Book, Reserve, Pay]
    
    H --> K[Notify User]
    K --> L[User Re-uploads ID]
    L --> A
    
    M[Admin Requests ID] --> N[Send Notification]
    N --> O[User Uploads ID]
    O --> A
```

## System Interactions

### Cross-Role Interactions

```mermaid
flowchart LR
    Admin[Admin/Owner] -->|Creates| Property[Properties]
    Admin -->|Adds| Units[Units]
    Admin -->|Registers| Agent[Agents]
    Admin -->|Verifies| TenantID[Tenant IDs]
    Admin -->|Approves| Payments[Payments]
    
    Agent -->|Manages| AgentTenants[Tenants]
    Agent -->|Verifies| AgentPayments[Payments]
    Agent -->|Requests| AgentID[ID Verification]
    
    Tenant -->|Views| TenantProperties[Properties]
    Tenant -->|Applies for| TenantUnits[Units]
    Tenant -->|Makes| TenantPayments2[Payments]
    Tenant -->|Uploads| TenantID2[ID]
    Tenant -->|Files| Complaints[Complaints]
    Tenant -->|Submits| Ratings[Ratings]
    
    Property -->|Contains| Units
    Units -->|Occupied by| Tenant
    Tenant -->|Pays| Payments
    User -->|Uploads| Uploads[Files]
    
    style Admin fill:#e8f5e9
    style Agent fill:#e0f2f1
    style Tenant fill:#fce4ec
    style Property fill:#e1f5fe
    style Units fill:#e1f5fe
    style Payments fill:#fff3e0
```

## Technology Stack Flow

```mermaid
flowchart TD
    Client[Client Browser] -->|HTTPS| NextJS[Next.js 16 App Router]
    NextJS -->|Server Components| SSR[Server-Side Rendering]
    NextJS -->|Client Components| CSR[Client-Side Rendering]
    
    SSR --> API[API Routes]
    CSR --> API
    
    API -->|Auth| AuthAPI[Authentication API]
    API -->|Data| DataAPI[Data API]
    API -->|Upload| UploadAPI[Upload API]
    
    AuthAPI --> Session[Session Management]
    DataAPI --> DB[(PostgreSQL via Neon)]
    UploadAPI --> DB
    
    Session --> DB
    DB -->|Queries| DataAPI
    DataAPI -->|JSON| API
    API -->|JSON| NextJS
    NextJS -->|HTML/CSS/JS| Client
    
    style Client fill:#e3f2fd
    style NextJS fill:#fff3e0
    style API fill:#f3e5f5
    style DB fill:#e8f5e9
```

## Key Decision Points

| Decision Point | Options | Outcome |
|---------------|---------|---------|
| **User Role** | Admin, Owner, Agent, Tenant | Determines dashboard and permissions |
| **ID Verification** | Pending, Approved, Rejected | Controls access to booking/payment features |
| **Unit Status** | Vacant, Occupied, Maintenance | Determines availability for tenants |
| **Payment Status** | Paid, Pending, Overdue, Partial | Triggers notifications and actions |
| **Complaint Status** | Open, In Progress, Resolved, Closed | Tracks issue resolution |
| **Property Status** | Active, Inactive | Controls visibility to tenants |

## Data Flow Summary

```
User Action → Client Component → API Route → Database Query → Database
                                    ↓
                            Response JSON → State Update → UI Re-render
                                    ↓
                            Notification Trigger → Notify Relevant Users
                                    ↓
                            Audit Log → Record Action
```
