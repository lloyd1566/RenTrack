-- RentTrack Complete Supabase Schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'owner', 'agent', 'tenant')),
  phone TEXT,
  payment_pin_hash TEXT,
  payment_pin_set_at TIMESTAMPTZ,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  verification_expires_at TIMESTAMPTZ,
  address TEXT,
  login_otp TEXT,
  login_otp_expires_at TIMESTAMPTZ,
  languages TEXT,
  hobbies TEXT,
  about_me TEXT,
  gender TEXT,
  birthdate DATE,
  country TEXT,
  experience TEXT DEFAULT '0 Years',
  avatar_url TEXT,
  id_verification_url TEXT,
  id_verification_status TEXT DEFAULT 'pending' CHECK (id_verification_status IN ('pending', 'approved', 'rejected')),
  profile_visibility BOOLEAN DEFAULT TRUE,
  show_email BOOLEAN DEFAULT FALSE,
  show_phone BOOLEAN DEFAULT FALSE,
  allow_messages BOOLEAN DEFAULT TRUE,
  data_sharing BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  is_online BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uploads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('avatar', 'id_verification', 'property', 'unit', 'receipt')),
  data BYTEA NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('house', 'condominium')),
  units INTEGER DEFAULT 0,
  occupied_units INTEGER DEFAULT 0,
  monthly_revenue DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT REFERENCES users(id),
  image_url TEXT,
  image_urls JSONB DEFAULT '[]'::jsonb,
  agent_id TEXT REFERENCES users(id),
  features JSONB DEFAULT '[]'::jsonb,
  condition TEXT,
  availability_status TEXT DEFAULT 'Available'
);

CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  floor INTEGER,
  status TEXT DEFAULT 'vacant' CHECK (status IN ('occupied', 'vacant', 'maintenance')),
  rent_amount DECIMAL(10,2) DEFAULT 0,
  tenant_name TEXT,
  tenant_id TEXT,
  lease_end DATE,
  image_url TEXT,
  image_urls JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  occupation TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  unit_id TEXT REFERENCES units(id),
  property_name TEXT,
  unit_number TEXT,
  contract_start DATE,
  contract_end DATE,
  rent_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  assignment_status TEXT DEFAULT '' CHECK (assignment_status IN ('', 'pending', 'confirmed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS move_out_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_name TEXT,
  unit_id TEXT,
  property_name TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  tenant_name TEXT,
  unit_id TEXT,
  property_name TEXT,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  amount_due DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) DEFAULT 0,
  payment_date DATE,
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue', 'partial')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'upload_receipt')),
  payment_method_note TEXT,
  bank_name TEXT,
  account_number TEXT,
  account_holder TEXT,
  card_last4 TEXT,
  card_expiry TEXT,
  gcash_number TEXT,
  gcash_name TEXT,
  receipt_url TEXT,
  notes TEXT,
  verified_by TEXT REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'system' CHECK (type IN ('payment', 'tenant', 'property', 'system', 'id_verification')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_applications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT NOT NULL CHECK (address IN ('Cebu', 'Manila', 'Davao', 'Butuan')),
  gender TEXT,
  birthdate DATE,
  resume_data BYTEA,
  resume_name TEXT,
  resume_mime_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_verification_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('property', 'unit', 'support')),
  target_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('property', 'unit', 'support')),
  target_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to TEXT REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  response_text TEXT,
  response_by TEXT,
  response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  attachment_url TEXT,
  attachment_type TEXT CHECK (attachment_type IN ('image', 'audio')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  property_id TEXT REFERENCES properties(id),
  sender_name TEXT,
  sender_email TEXT,
  sender_phone TEXT,
  agent_id TEXT,
  agent_name TEXT,
  reply_text TEXT,
  reply_token TEXT,
  replied_at TIMESTAMPTZ,
  visitor_reply TEXT,
  visitor_replied_at TIMESTAMPTZ,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION exec_sql(sql text, params text[] DEFAULT '{}')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql USING params;
END;
$$;
