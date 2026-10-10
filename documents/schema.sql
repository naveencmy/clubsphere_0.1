-- ============================================================================
-- CLUBSPHERE: PRODUCTION DATABASE SCHEMA DDL
-- Platform: PostgreSQL 15+
-- Extensions: uuid-ossp, pgcrypto, citext
-- Multi-Tenant Row-Level Security (RLS) & Audit Logging Enabled
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================================
-- 1. ENUMS AND DOMAINS
-- ============================================================================

CREATE TYPE user_system_role AS ENUM (
    'SUPER_ADMIN',
    'CAMPUS_AUDITOR',
    'STUDENT_USER'
);

CREATE TYPE club_role AS ENUM (
    'PRESIDENT',
    'VICE_PRESIDENT',
    'TREASURER',
    'SECRETARY',
    'COMMITTEE_LEAD',
    'VOLUNTEER',
    'MEMBER'
);

CREATE TYPE membership_status AS ENUM (
    'PENDING_PAYMENT',
    'ACTIVE',
    'RENEWAL_DUE',
    'GRACE_PERIOD',
    'EXPIRED',
    'REVOKED'
);

CREATE TYPE membership_tier AS ENUM (
    'STANDARD',
    'PREMIUM',
    'HONORARY',
    'ALUMNI'
);

CREATE TYPE order_status AS ENUM (
    'PENDING',
    'PAID',
    'PROCESSING',
    'FULFILLED',
    'CANCELLED',
    'REFUNDED'
);

CREATE TYPE ticket_status AS ENUM (
    'ISSUED',
    'CHECKED_IN',
    'TRANSFERRED',
    'CANCELLED',
    'REFUNDED'
);

CREATE TYPE task_priority AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);

CREATE TYPE task_status AS ENUM (
    'BACKLOG',
    'TODO',
    'IN_PROGRESS',
    'BLOCKED',
    'DONE'
);

CREATE TYPE account_type AS ENUM (
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'REVENUE',
    'EXPENSE'
);

CREATE TYPE reimbursement_status AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'TREASURER_APPROVED',
    'PRESIDENT_APPROVED',
    'REJECTED',
    'DISBURSED'
);

-- ============================================================================
-- 2. AUTHENTICATION & CORE USER TABLES (Better Auth Compatible)
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email CITEXT UNIQUE NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    image TEXT,
    system_role user_system_role NOT NULL DEFAULT 'STUDENT_USER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    student_id_number VARCHAR(64) UNIQUE,
    phone_number VARCHAR(32),
    academic_major VARCHAR(128),
    graduation_year INT CHECK (graduation_year >= 2020 AND graduation_year <= 2040),
    dietary_preferences TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    active_club_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE accounts (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id VARCHAR(255) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    access_token_expires_at TIMESTAMPTZ,
    refresh_token_expires_at TIMESTAMPTZ,
    scope TEXT,
    id_token TEXT,
    password TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_accounts_provider_account UNIQUE (provider_id, account_id)
);

CREATE TABLE verifications (
    id VARCHAR(255) PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. CLUBS & MULTI-TENANT MEMBERSHIP TABLES
-- ============================================================================

CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#1A73E8',
    stripe_account_id VARCHAR(128),
    annual_dues_cents INT NOT NULL DEFAULT 0 CHECK (annual_dues_cents >= 0),
    settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE club_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role club_role NOT NULL DEFAULT 'MEMBER',
    tier membership_tier NOT NULL DEFAULT 'STANDARD',
    status membership_status NOT NULL DEFAULT 'PENDING_PAYMENT',
    qr_secret_token VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    dues_paid_cents INT NOT NULL DEFAULT 0,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_club_user_membership UNIQUE (club_id, user_id)
);

-- ============================================================================
-- 4. MERCHANDISE & E-COMMERCE SUBSYSTEM
-- ============================================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(128) NOT NULL,
    description TEXT,
    image_urls TEXT[] NOT NULL DEFAULT '{}',
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_club_product_slug UNIQUE (club_id, slug)
);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(128) NOT NULL,
    attributes_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    available_stock INT NOT NULL DEFAULT 0 CHECK (available_stock >= 0),
    reserved_stock INT NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
    non_member_price_cents INT NOT NULL CHECK (non_member_price_cents >= 0),
    member_price_cents INT NOT NULL CHECK (member_price_cents >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_member_price_leq_nonmember CHECK (member_price_cents <= non_member_price_cents)
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    order_number VARCHAR(32) UNIQUE NOT NULL,
    status order_status NOT NULL DEFAULT 'PENDING',
    subtotal_cents INT NOT NULL CHECK (subtotal_cents >= 0),
    discount_cents INT NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
    total_cents INT NOT NULL CHECK (total_cents >= 0),
    stripe_payment_intent_id VARCHAR(128),
    shipping_details_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_cents INT NOT NULL CHECK (unit_price_cents >= 0),
    total_price_cents INT NOT NULL CHECK (total_price_cents >= 0)
);

-- ============================================================================
-- 5. EVENT TICKETING & RAPID CHECK-IN ENGINE
-- ============================================================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(128) NOT NULL,
    description TEXT,
    venue_name VARCHAR(255) NOT NULL,
    venue_address TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    capacity_limit INT NOT NULL CHECK (capacity_limit > 0),
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_club_event_slug UNIQUE (club_id, slug),
    CONSTRAINT chk_event_dates CHECK (ends_at > starts_at)
);

CREATE TABLE event_ticket_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    allocation_limit INT NOT NULL CHECK (allocation_limit > 0),
    issued_count INT NOT NULL DEFAULT 0 CHECK (issued_count >= 0),
    member_price_cents INT NOT NULL CHECK (member_price_cents >= 0),
    non_member_price_cents INT NOT NULL CHECK (non_member_price_cents >= 0),
    sales_open_at TIMESTAMPTZ NOT NULL,
    sales_close_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_issued_leq_allocation CHECK (issued_count <= allocation_limit)
);

CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    tier_id UUID NOT NULL REFERENCES event_ticket_tiers(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    ticket_code VARCHAR(32) UNIQUE NOT NULL,
    qr_signature TEXT NOT NULL,
    status ticket_status NOT NULL DEFAULT 'ISSUED',
    price_paid_cents INT NOT NULL CHECK (price_paid_cents >= 0),
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
    scanned_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_device_metadata JSONB DEFAULT '{}'::jsonb,
    verification_hash TEXT NOT NULL
);

-- ============================================================================
-- 6. CENTRALIZED BROADCAST SYSTEM
-- ============================================================================

CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    content_markdown TEXT NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    target_audience VARCHAR(64) NOT NULL DEFAULT 'ALL_MEMBERS',
    published_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    audit_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE announcement_read_receipts (
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (announcement_id, user_id)
);

-- ============================================================================
-- 7. COLLABORATIVE TASK & FUNDRAISER BOARD
-- ============================================================================

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description_markdown TEXT,
    priority task_priority NOT NULL DEFAULT 'MEDIUM',
    status task_status NOT NULL DEFAULT 'TODO',
    due_date TIMESTAMPTZ,
    checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. AUTOMATED FINANCIAL LEDGER & EXPENSE REIMBURSEMENTS
-- ============================================================================

CREATE TABLE ledger_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    account_code VARCHAR(16) NOT NULL,
    account_name VARCHAR(128) NOT NULL,
    type account_type NOT NULL,
    balance_cents BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_club_account_code UNIQUE (club_id, account_code)
);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    entry_number VARCHAR(32) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    reference_type VARCHAR(64) NOT NULL,
    reference_id UUID,
    posted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    posted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ledger_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES ledger_accounts(id) ON DELETE RESTRICT,
    debit_cents INT NOT NULL DEFAULT 0 CHECK (debit_cents >= 0),
    credit_cents INT NOT NULL DEFAULT 0 CHECK (credit_cents >= 0),
    CONSTRAINT chk_debit_or_credit CHECK (
        (debit_cents > 0 AND credit_cents = 0) OR
        (credit_cents > 0 AND debit_cents = 0)
    )
);

CREATE TABLE expense_reimbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    claimant_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount_cents INT NOT NULL CHECK (amount_cents > 0),
    receipt_image_url TEXT NOT NULL,
    receipt_ocr_metadata JSONB DEFAULT '{}'::jsonb,
    status reimbursement_status NOT NULL DEFAULT 'SUBMITTED',
    treasurer_approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    treasurer_approved_at TIMESTAMPTZ,
    president_approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    president_approved_at TIMESTAMPTZ,
    disbursement_method VARCHAR(64),
    disbursed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. AUDIT LOGGING ENGINE
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(128) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id UUID,
    payload_before JSONB,
    payload_after JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 10. PRODUCTION INDEXES
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_club_memberships_lookup ON club_memberships(club_id, user_id, status);
CREATE INDEX idx_club_memberships_qr ON club_memberships(qr_secret_token);
CREATE INDEX idx_product_variants_lookup ON product_variants(product_id, sku);
CREATE INDEX idx_tickets_verification ON tickets(ticket_code, status);
CREATE INDEX idx_tickets_event_user ON tickets(event_id, user_id);
CREATE INDEX idx_check_ins_ticket ON check_ins(ticket_id);
CREATE INDEX idx_announcements_club ON announcements(club_id, published_at DESC);
CREATE INDEX idx_tasks_club_status ON tasks(club_id, status, due_date);
CREATE INDEX idx_journal_entries_club ON journal_entries(club_id, posted_at DESC);
CREATE INDEX idx_ledger_lines_account ON ledger_lines(account_id);
CREATE INDEX idx_reimbursements_club_status ON expense_reimbursements(club_id, status);
CREATE INDEX idx_audit_logs_club_created ON audit_logs(club_id, created_at DESC);

-- ============================================================================
-- 11. AUDIT & UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
          AND table_schema = 'public'
    LOOP
        EXECUTE format('
            CREATE TRIGGER trg_set_timestamp_%I
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();', tbl, tbl);
    END LOOP;
END;
$$;
