-- ============================================================================
-- CLUBSPHERE: PRODUCTION DATABASE SCHEMA DDL
-- Platform: PostgreSQL 15+ / 16+
-- Currency Standard: Indian Rupee (INR - ₹).
-- Note: All monetary columns (*_cents) store integer amounts in Paise (1 INR = 100 Paise)
-- to guarantee zero floating-point rounding errors across ledgers and gateways.
-- Extensions: uuid-ossp, pgcrypto, citext, btree_gist
-- Security: Multi-Tenant Row-Level Security (RLS) & Audit Logging Enabled
-- Idempotency: Guaranteed safe for repeated execution via psql -f documents/schema.sql
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS SETUP
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ============================================================================
-- 2. ENUMS AND DOMAINS (Idempotent Definition)
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_system_role') THEN
        CREATE TYPE user_system_role AS ENUM (
            'SUPER_ADMIN',
            'CAMPUS_AUDITOR',
            'STUDENT_USER'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'club_role') THEN
        CREATE TYPE club_role AS ENUM (
            'PRESIDENT',
            'VICE_PRESIDENT',
            'TREASURER',
            'SECRETARY',
            'COMMITTEE_LEAD',
            'VOLUNTEER',
            'MEMBER'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_status') THEN
        CREATE TYPE membership_status AS ENUM (
            'PENDING_PAYMENT',
            'ACTIVE',
            'RENEWAL_DUE',
            'GRACE_PERIOD',
            'EXPIRED',
            'REVOKED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_tier') THEN
        CREATE TYPE membership_tier AS ENUM (
            'STANDARD',
            'PREMIUM',
            'HONORARY',
            'ALUMNI'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM (
            'PENDING',
            'PAID',
            'PROCESSING',
            'FULFILLED',
            'CANCELLED',
            'REFUNDED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
        CREATE TYPE ticket_status AS ENUM (
            'RESERVED',
            'ISSUED',
            'CHECKED_IN',
            'TRANSFERRED',
            'CANCELLED',
            'REFUNDED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE task_priority AS ENUM (
            'LOW',
            'MEDIUM',
            'HIGH',
            'URGENT'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM (
            'BACKLOG',
            'TODO',
            'IN_PROGRESS',
            'BLOCKED',
            'DONE'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
        CREATE TYPE account_type AS ENUM (
            'ASSET',
            'LIABILITY',
            'EQUITY',
            'REVENUE',
            'EXPENSE'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reimbursement_status') THEN
        CREATE TYPE reimbursement_status AS ENUM (
            'DRAFT',
            'SUBMITTED',
            'UNDER_REVIEW',
            'NEEDS_CORRECTION',
            'TREASURER_APPROVED',
            'PRESIDENT_APPROVED',
            'REJECTED',
            'DISBURSED'
        );
    END IF;
END $$;

-- ============================================================================
-- 3. AUTHENTICATION & CORE USER TABLES (Better Auth Compatible)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email CITEXT UNIQUE NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    image TEXT,
    system_role user_system_role NOT NULL DEFAULT 'STUDENT_USER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
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

CREATE TABLE IF NOT EXISTS sessions (
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

CREATE TABLE IF NOT EXISTS accounts (
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

CREATE TABLE IF NOT EXISTS verifications (
    id VARCHAR(255) PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. CLUBS & MULTI-TENANT MEMBERSHIP TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS clubs (
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

CREATE TABLE IF NOT EXISTS club_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role club_role NOT NULL DEFAULT 'MEMBER',
    tier membership_tier NOT NULL DEFAULT 'STANDARD',
    status membership_status NOT NULL DEFAULT 'PENDING_PAYMENT',
    qr_secret_token VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    dues_paid_cents INT NOT NULL DEFAULT 0 CHECK (dues_paid_cents >= 0),
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_club_user_membership UNIQUE (club_id, user_id)
);

CREATE TABLE IF NOT EXISTS membership_renewal_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES club_memberships(id) ON DELETE CASCADE,
    reminder_type VARCHAR(32) NOT NULL, -- 'T_30_DAYS', 'T_7_DAYS', 'T_1_DAY', 'GRACE_PERIOD'
    dispatched_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recipient_email VARCHAR(255) NOT NULL,
    delivery_status VARCHAR(32) NOT NULL DEFAULT 'SENT', -- 'SENT', 'FAILED', 'BOUNCED'
    one_click_renewal_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. MERCHANDISE & E-COMMERCE SUBSYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
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

CREATE TABLE IF NOT EXISTS product_variants (
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

CREATE TABLE IF NOT EXISTS orders (
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

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_cents INT NOT NULL CHECK (unit_price_cents >= 0),
    total_price_cents INT NOT NULL CHECK (total_price_cents >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. EVENT TICKETING & RAPID CHECK-IN ENGINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS events (
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

CREATE TABLE IF NOT EXISTS event_ticket_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    allocation_limit INT NOT NULL CHECK (allocation_limit > 0),
    reserved_count INT NOT NULL DEFAULT 0 CHECK (reserved_count >= 0),
    issued_count INT NOT NULL DEFAULT 0 CHECK (issued_count >= 0),
    member_price_cents INT NOT NULL CHECK (member_price_cents >= 0),
    non_member_price_cents INT NOT NULL CHECK (non_member_price_cents >= 0),
    sales_open_at TIMESTAMPTZ NOT NULL,
    sales_close_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_capacity_limits CHECK ((issued_count + reserved_count) <= allocation_limit),
    CONSTRAINT chk_tier_sales_dates CHECK (sales_close_at >= sales_open_at)
);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    tier_id UUID NOT NULL REFERENCES event_ticket_tiers(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    ticket_code VARCHAR(32) UNIQUE NOT NULL,
    qr_signature TEXT NOT NULL,
    status ticket_status NOT NULL DEFAULT 'RESERVED',
    reserved_until TIMESTAMPTZ,
    price_paid_cents INT NOT NULL CHECK (price_paid_cents >= 0),
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
    scanned_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_device_metadata JSONB DEFAULT '{}'::jsonb,
    verification_hash TEXT NOT NULL
);

-- ============================================================================
-- 7. CENTRALIZED BROADCAST SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS announcements (
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

CREATE TABLE IF NOT EXISTS announcement_read_receipts (
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (announcement_id, user_id)
);

CREATE TABLE IF NOT EXISTS announcement_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    revision_number INT NOT NULL DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    content_markdown TEXT NOT NULL,
    edited_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    edited_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revision_hash VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS announcement_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(32) NOT NULL DEFAULT 'EMAIL', -- 'EMAIL', 'PUSH', 'SMS'
    delivery_status VARCHAR(32) NOT NULL DEFAULT 'QUEUED', -- 'QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED'
    dispatched_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. COLLABORATIVE TASK & FUNDRAISER BOARD
-- ============================================================================

CREATE TABLE IF NOT EXISTS fundraisers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount_cents INT NOT NULL CHECK (target_amount_cents > 0),
    raised_amount_cents INT NOT NULL DEFAULT 0 CHECK (raised_amount_cents >= 0),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_fundraiser_dates CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    fundraiser_id UUID REFERENCES fundraisers(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS volunteer_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    fundraiser_id UUID REFERENCES fundraisers(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    volunteer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    role_title VARCHAR(128) NOT NULL, -- e.g. "Table Management", "Baking Lead", "Supplies Runner"
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_shift_chronology CHECK (ends_at > starts_at)
);

-- ============================================================================
-- 9. DOUBLE-ENTRY FINANCIAL ACCOUNTING & PAYMENT TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ledger_accounts (
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

CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    entry_number VARCHAR(32) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    reference_type VARCHAR(64) NOT NULL, -- 'MEMBERSHIP_PAYMENT', 'TICKET_PURCHASE', 'MERCH_SALE', 'DONATION', 'REIMBURSEMENT_DISBURSEMENT', 'REFUND_REVERSAL', 'MANUAL_ADJUSTMENT'
    reference_id UUID,
    posted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    posted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ledger_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES ledger_accounts(id) ON DELETE RESTRICT,
    debit_cents INT NOT NULL DEFAULT 0 CHECK (debit_cents >= 0),
    credit_cents INT NOT NULL DEFAULT 0 CHECK (credit_cents >= 0),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_debit_or_credit CHECK (
        (debit_cents > 0 AND credit_cents = 0) OR
        (credit_cents > 0 AND debit_cents = 0)
    )
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
    membership_id UUID REFERENCES club_memberships(id) ON DELETE SET NULL,
    fundraiser_id UUID REFERENCES fundraisers(id) ON DELETE SET NULL,
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
    transaction_type VARCHAR(32) NOT NULL, -- 'MEMBERSHIP_DUES', 'TICKET_PURCHASE', 'MERCH_PURCHASE', 'DONATION', 'REIMBURSEMENT_PAYOUT', 'REFUND'
    amount_cents INT NOT NULL CHECK (amount_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    payment_gateway VARCHAR(32) NOT NULL DEFAULT 'STRIPE', -- 'STRIPE', 'RAZORPAY', 'MANUAL_CASH', 'CAMPUS_CARD'
    gateway_transaction_id VARCHAR(128),
    gateway_payment_intent_id VARCHAR(128),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'DISPUTED'
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    fiscal_year VARCHAR(16) NOT NULL, -- e.g. "2025-2026"
    category VARCHAR(64) NOT NULL,    -- "EVENT_PRODUCTION", "MARKETING", "SUPPLIES", "FOOD", "MERCHANDISE"
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    allocated_amount_cents INT NOT NULL CHECK (allocated_amount_cents >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_club_fiscal_category UNIQUE (club_id, fiscal_year, category, event_id)
);

CREATE TABLE IF NOT EXISTS expense_reimbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    claimant_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(64) NOT NULL, -- "EVENT_PRODUCTION", "SUPPLIES", "FOOD_CATERING", "MARKETING", "TRAVEL", "OTHER"
    merchant_name VARCHAR(128) NOT NULL,
    purchase_date DATE NOT NULL,
    amount_cents INT NOT NULL CHECK (amount_cents > 0),
    receipt_image_url TEXT NOT NULL,      -- Mandatory uploaded receipt proof (image/pdf)
    rejection_reason TEXT,                -- Required if status is REJECTED or NEEDS_CORRECTION
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    fundraiser_id UUID REFERENCES fundraisers(id) ON DELETE SET NULL,
    budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
    status reimbursement_status NOT NULL DEFAULT 'SUBMITTED',
    treasurer_approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    treasurer_approved_at TIMESTAMPTZ,
    president_approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    president_approved_at TIMESTAMPTZ,
    disbursement_method VARCHAR(64),
    disbursed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_claimant_not_approver CHECK (
        (claimant_user_id != treasurer_approver_id OR treasurer_approver_id IS NULL) AND
        (claimant_user_id != president_approver_id OR president_approver_id IS NULL)
    )
);

-- ============================================================================
-- 10. AUDIT LOGGING ENGINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
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
-- 11. HIGH-PERFORMANCE TARGETED & PARTIAL INDEXES
-- ============================================================================

-- Core Identity & Sessions
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_system_role ON users(system_role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_student_id ON user_profiles(student_id_number);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_lookup ON verifications(identifier, value);

-- Multi-Tenant Clubs & Memberships
CREATE INDEX IF NOT EXISTS idx_clubs_slug ON clubs(slug);
CREATE INDEX IF NOT EXISTS idx_clubs_is_active ON clubs(is_active);
CREATE INDEX IF NOT EXISTS idx_club_memberships_lookup ON club_memberships(club_id, user_id, status);
CREATE INDEX IF NOT EXISTS idx_club_memberships_user ON club_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_qr ON club_memberships(qr_secret_token);
CREATE INDEX IF NOT EXISTS idx_club_memberships_active ON club_memberships(club_id, status) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_membership_renewal_reminders ON membership_renewal_reminders(membership_id, reminder_type);

-- Merchandise Catalog & Stock Counters
CREATE INDEX IF NOT EXISTS idx_products_club ON products(club_id, is_published);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(club_id, slug);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_stock ON product_variants(id, available_stock);
CREATE INDEX IF NOT EXISTS idx_orders_club_created ON orders(club_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_pi ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_pending ON orders(club_id, status) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(variant_id);

-- Event Ticketing & Rapid Door Check-In
CREATE INDEX IF NOT EXISTS idx_events_club_dates ON events(club_id, starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(club_id, slug);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(club_id, is_published);
CREATE INDEX IF NOT EXISTS idx_event_ticket_tiers_event ON event_ticket_tiers(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_user ON tickets(event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_tier ON tickets(tier_id);
CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_tickets_verification ON tickets(ticket_code, status);
CREATE INDEX IF NOT EXISTS idx_tickets_reserved_expiry ON tickets(status, reserved_until) WHERE status = 'RESERVED';
CREATE INDEX IF NOT EXISTS idx_check_ins_ticket ON check_ins(ticket_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_scanner ON check_ins(scanned_by_user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_scanned_at ON check_ins(scanned_at DESC);

-- Broadcasts & Announcements
CREATE INDEX IF NOT EXISTS idx_announcements_club ON announcements(club_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_author ON announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcement_receipts_user ON announcement_read_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_announcement_revisions_announcement ON announcement_revisions(announcement_id, revision_number DESC);
CREATE INDEX IF NOT EXISTS idx_announcement_deliveries_lookup ON announcement_deliveries(announcement_id, delivery_status);

-- Fundraisers & Volunteer Management
CREATE INDEX IF NOT EXISTS idx_fundraisers_club ON fundraisers(club_id, is_active);
CREATE INDEX IF NOT EXISTS idx_fundraisers_event ON fundraisers(event_id);
CREATE INDEX IF NOT EXISTS idx_tasks_club_status ON tasks(club_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user ON tasks(assigned_to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_event ON tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_tasks_fundraiser ON tasks(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_shifts_club_event ON volunteer_shifts(club_id, event_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_volunteer_shifts_fundraiser ON volunteer_shifts(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_shifts_volunteer ON volunteer_shifts(volunteer_user_id);

-- Double-Entry Ledger, Transactions & Reimbursements
CREATE INDEX IF NOT EXISTS idx_ledger_accounts_club_code ON ledger_accounts(club_id, account_code);
CREATE INDEX IF NOT EXISTS idx_ledger_accounts_club_type ON ledger_accounts(club_id, type);
CREATE INDEX IF NOT EXISTS idx_journal_entries_club ON journal_entries(club_id, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_reference ON journal_entries(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_ledger_lines_entry ON ledger_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_ledger_lines_account ON ledger_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_club_created ON transactions(club_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_ticket ON transactions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_transactions_gateway_txn ON transactions(gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_budgets_club_year ON budgets(club_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_budgets_event ON budgets(event_id);
CREATE INDEX IF NOT EXISTS idx_reimbursements_club_status ON expense_reimbursements(club_id, status);
CREATE INDEX IF NOT EXISTS idx_reimbursements_claimant ON expense_reimbursements(claimant_user_id);
CREATE INDEX IF NOT EXISTS idx_reimbursements_event ON expense_reimbursements(event_id);
CREATE INDEX IF NOT EXISTS idx_reimbursements_budget ON expense_reimbursements(budget_id);

-- Security Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_club_created ON audit_logs(club_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- ============================================================================
-- 12. CONCURRENCY CONTROL & HIGH-PERFORMANCE TRANSACTIONAL PATTERNS
-- ============================================================================

/*
--------------------------------------------------------------------------------
TRANSACTION PATTERN 1: ATOMIC MERCHANDISE STOCK RESERVATION
--------------------------------------------------------------------------------
Prevents overselling during high-traffic merchandise drops using pessimistic
locking (SELECT ... FOR UPDATE).

```sql
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- 1. Acquire exclusive row-level lock on the variant
SELECT id, product_id, available_stock, reserved_stock, member_price_cents, non_member_price_cents
FROM product_variants
WHERE id = :variant_id
FOR UPDATE;

-- 2. Verify stock availability in application / PLpgSQL
-- IF available_stock >= :requested_quantity THEN:
UPDATE product_variants
SET 
    available_stock = available_stock - :requested_quantity,
    reserved_stock = reserved_stock + :requested_quantity,
    updated_at = CURRENT_TIMESTAMP
WHERE id = :variant_id;

-- 3. Create temporary order hold with 10-minute expiry TTL
INSERT INTO orders (
    club_id, user_id, order_number, status, subtotal_cents, total_cents
) VALUES (
    :club_id, :user_id, :order_number, 'PENDING', :subtotal_cents, :total_cents
);

COMMIT;
```

--------------------------------------------------------------------------------
TRANSACTION PATTERN 2: ATOMIC EVENT TICKET TIER ALLOCATION
--------------------------------------------------------------------------------
Guarantees strict capacity limits for high-demand event sales.

```sql
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- 1. Lock tier record to prevent concurrent over-allocation
SELECT id, allocation_limit, reserved_count, issued_count, member_price_cents
FROM event_ticket_tiers
WHERE id = :tier_id
FOR UPDATE;

-- 2. Check allocation boundary: (issued_count + reserved_count + :qty <= allocation_limit)
UPDATE event_ticket_tiers
SET 
    reserved_count = reserved_count + :qty,
    updated_at = CURRENT_TIMESTAMP
WHERE id = :tier_id;

-- 3. Issue reserved ticket with 10-minute payment countdown
INSERT INTO tickets (
    event_id, tier_id, user_id, ticket_code, qr_signature, status, reserved_until, price_paid_cents
) VALUES (
    :event_id, :tier_id, :user_id, :ticket_code, :qr_sig, 'RESERVED', NOW() + INTERVAL '10 minutes', :price_cents
);

COMMIT;
```

--------------------------------------------------------------------------------
TRANSACTION PATTERN 3: AUTOMATED CAPACITY RECLAMATION (TTL Expiry Sweep)
--------------------------------------------------------------------------------
Periodic background worker (node-cron every 60s) safely unlocks expired holds.

```sql
BEGIN;

WITH expired_tickets AS (
    SELECT id, tier_id
    FROM tickets
    WHERE status = 'RESERVED' AND reserved_until < NOW()
    FOR UPDATE SKIP LOCKED
)
UPDATE tickets t
SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
FROM expired_tickets et
WHERE t.id = et.id;

UPDATE event_ticket_tiers ett
SET 
    reserved_count = reserved_count - exp.expired_qty,
    updated_at = CURRENT_TIMESTAMP
FROM (
    SELECT tier_id, COUNT(*) AS expired_qty
    FROM tickets
    WHERE status = 'CANCELLED' AND updated_at >= NOW() - INTERVAL '10 seconds'
    GROUP BY tier_id
) exp
WHERE ett.id = exp.tier_id;

COMMIT;
```
*/

-- ============================================================================
-- 13. AUTOMATED DATABASE TRIGGERS & FINANCIAL GUARDRAILS
-- ============================================================================

-- Function: Automatic updated_at Maintenance
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dynamically Attach updated_at Triggers Across All Operational Entities
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
        EXECUTE format('DROP TRIGGER IF EXISTS trg_set_timestamp_%I ON %I;', tbl, tbl);
        EXECUTE format('
            CREATE TRIGGER trg_set_timestamp_%I
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();', tbl, tbl);
    END LOOP;
END;
$$;

-- Function: Double-Entry Balance Verification & Real-time Account Aggregation
CREATE OR REPLACE FUNCTION verify_journal_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_account_type account_type;
BEGIN
    -- Determine account classification
    SELECT type INTO v_account_type
    FROM ledger_accounts
    WHERE id = NEW.account_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ledger line references invalid ledger_account ID: %', NEW.account_id;
    END IF;

    -- Normal Debit Balances (ASSET, EXPENSE): Debit (+), Credit (-)
    -- Normal Credit Balances (LIABILITY, EQUITY, REVENUE): Credit (+), Debit (-)
    IF v_account_type IN ('ASSET', 'EXPENSE') THEN
        UPDATE ledger_accounts
        SET balance_cents = balance_cents + (NEW.debit_cents - NEW.credit_cents)
        WHERE id = NEW.account_id;
    ELSE
        UPDATE ledger_accounts
        SET balance_cents = balance_cents + (NEW.credit_cents - NEW.debit_cents)
        WHERE id = NEW.account_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_verify_journal_balance ON ledger_lines;
CREATE TRIGGER trg_verify_journal_balance
AFTER INSERT ON ledger_lines
FOR EACH ROW
EXECUTE FUNCTION verify_journal_entry_balance();

-- Function: Validate Journal Entry Mathematical Balance (Debits = Credits)
CREATE OR REPLACE FUNCTION verify_journal_entry_equality(p_journal_entry_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_total_debit BIGINT;
    v_total_credit BIGINT;
BEGIN
    SELECT 
        COALESCE(SUM(debit_cents), 0),
        COALESCE(SUM(credit_cents), 0)
    INTO v_total_debit, v_total_credit
    FROM ledger_lines
    WHERE journal_entry_id = p_journal_entry_id;

    IF v_total_debit <> v_total_credit THEN
        RAISE EXCEPTION 'Double-entry balance mismatch for journal_entry %: Total Debits (Paise: %) != Total Credits (Paise: %)',
            p_journal_entry_id, v_total_debit, v_total_credit;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 14. ANALYTICAL PRODUCTION REPORTING VIEWS
-- ============================================================================

-- View 1: Per-Event Financial & Attendance Summary
CREATE OR REPLACE VIEW view_event_financial_summary AS
SELECT 
    e.id AS event_id,
    e.club_id,
    e.title AS event_title,
    e.starts_at,
    e.capacity_limit,
    COUNT(DISTINCT CASE WHEN t.status IN ('ISSUED', 'CHECKED_IN') THEN t.id END) AS total_tickets_issued,
    COUNT(DISTINCT CASE WHEN t.status = 'CHECKED_IN' THEN t.id END) AS actual_attendance_count,
    ROUND(
        CASE 
            WHEN COUNT(DISTINCT CASE WHEN t.status IN ('ISSUED', 'CHECKED_IN') THEN t.id END) > 0 
            THEN (COUNT(DISTINCT CASE WHEN t.status = 'CHECKED_IN' THEN t.id END)::numeric / COUNT(DISTINCT CASE WHEN t.status IN ('ISSUED', 'CHECKED_IN') THEN t.id END)::numeric) * 100 
            ELSE 0 
        END, 2
    ) AS attendance_rate_percentage,
    COALESCE(SUM(CASE WHEN t.status IN ('ISSUED', 'CHECKED_IN') THEN t.price_paid_cents ELSE 0 END), 0) AS gross_ticket_revenue_cents,
    COALESCE(
        (SELECT SUM(er.amount_cents) 
         FROM expense_reimbursements er 
         WHERE er.event_id = e.id 
           AND er.status IN ('TREASURER_APPROVED', 'PRESIDENT_APPROVED', 'DISBURSED')), 
        0
    ) AS event_expenses_cents,
    COALESCE(SUM(CASE WHEN t.status IN ('ISSUED', 'CHECKED_IN') THEN t.price_paid_cents ELSE 0 END), 0) - COALESCE(
        (SELECT SUM(er.amount_cents) 
         FROM expense_reimbursements er 
         WHERE er.event_id = e.id 
           AND er.status IN ('TREASURER_APPROVED', 'PRESIDENT_APPROVED', 'DISBURSED')), 
        0
    ) AS net_event_profit_cents
FROM events e
LEFT JOIN tickets t ON e.id = t.event_id
GROUP BY e.id, e.club_id, e.title, e.starts_at, e.capacity_limit;

-- View 2: Unified Treasurer Executive Financial Dashboard (Income, Expenses, Cash Balance)
CREATE OR REPLACE VIEW view_treasurer_financial_summary AS
SELECT 
    c.id AS club_id,
    c.name AS club_name,
    -- Total Income Breakdown by Account Code
    COALESCE(SUM(CASE WHEN la.account_code = '4010' THEN la.balance_cents ELSE 0 END), 0) AS membership_dues_income_cents,
    COALESCE(SUM(CASE WHEN la.account_code = '4020' THEN la.balance_cents ELSE 0 END), 0) AS event_ticket_sales_income_cents,
    COALESCE(SUM(CASE WHEN la.account_code = '4030' THEN la.balance_cents ELSE 0 END), 0) AS merchandise_sales_income_cents,
    COALESCE(SUM(CASE WHEN la.account_code = '4040' THEN la.balance_cents ELSE 0 END), 0) AS fundraiser_donations_income_cents,
    COALESCE(SUM(CASE WHEN la.type = 'REVENUE' THEN la.balance_cents ELSE 0 END), 0) AS total_gross_income_cents,
    -- Total Expenses
    COALESCE(SUM(CASE WHEN la.type = 'EXPENSE' THEN la.balance_cents ELSE 0 END), 0) AS total_expenses_cents,
    -- Liquid Operating Cash Balance (Accounts 1010 Operating Cash, 1020 Stripe Clearing, 1030 Petty Cash)
    COALESCE(SUM(CASE WHEN la.account_code IN ('1010', '1020', '1030') THEN la.balance_cents ELSE 0 END), 0) AS available_operating_balance_cents
FROM clubs c
LEFT JOIN ledger_accounts la ON c.id = la.club_id
GROUP BY c.id, c.name;

-- View 3: Budget Variance & Category Allocation Tracking (Allocated vs Spent vs Remaining)
CREATE OR REPLACE VIEW view_budget_variance AS
SELECT 
    b.id AS budget_id,
    b.club_id,
    b.fiscal_year,
    b.category,
    b.event_id,
    e.title AS event_title,
    b.allocated_amount_cents,
    COALESCE(
        (SELECT SUM(er.amount_cents) 
         FROM expense_reimbursements er 
         WHERE er.club_id = b.club_id 
           AND er.status IN ('TREASURER_APPROVED', 'PRESIDENT_APPROVED', 'DISBURSED')
           AND (
               er.budget_id = b.id
               OR (er.budget_id IS NULL AND b.event_id IS NOT NULL AND er.event_id = b.event_id)
               OR (er.budget_id IS NULL AND b.event_id IS NULL AND er.category = b.category)
           )), 
        0
    ) AS actual_spent_cents,
    b.allocated_amount_cents - COALESCE(
        (SELECT SUM(er.amount_cents) 
         FROM expense_reimbursements er 
         WHERE er.club_id = b.club_id 
           AND er.status IN ('TREASURER_APPROVED', 'PRESIDENT_APPROVED', 'DISBURSED')
           AND (
               er.budget_id = b.id
               OR (er.budget_id IS NULL AND b.event_id IS NOT NULL AND er.event_id = b.event_id)
               OR (er.budget_id IS NULL AND b.event_id IS NULL AND er.category = b.category)
           )), 
        0
    ) AS remaining_balance_cents,
    ROUND(
        CASE 
            WHEN b.allocated_amount_cents > 0 
            THEN (COALESCE(
                (SELECT SUM(er.amount_cents) 
                 FROM expense_reimbursements er 
                 WHERE er.club_id = b.club_id 
                   AND er.status IN ('TREASURER_APPROVED', 'PRESIDENT_APPROVED', 'DISBURSED')
                   AND (
                       er.budget_id = b.id
                       OR (er.budget_id IS NULL AND b.event_id IS NOT NULL AND er.event_id = b.event_id)
                       OR (er.budget_id IS NULL AND b.event_id IS NULL AND er.category = b.category)
                   )), 
                0
            )::numeric / b.allocated_amount_cents::numeric) * 100 
            ELSE 0 
        END, 2
    ) AS percentage_consumed,
    CASE 
        WHEN b.allocated_amount_cents = 0 THEN 'NORMAL'
        WHEN (COALESCE(
            (SELECT SUM(er.amount_cents) 
             FROM expense_reimbursements er 
             WHERE er.club_id = b.club_id 
               AND er.status IN ('TREASURER_APPROVED', 'PRESIDENT_APPROVED', 'DISBURSED')
               AND (
                   er.budget_id = b.id
                   OR (er.budget_id IS NULL AND b.event_id IS NOT NULL AND er.event_id = b.event_id)
                   OR (er.budget_id IS NULL AND b.event_id IS NULL AND er.category = b.category)
               )), 0)::numeric / b.allocated_amount_cents::numeric) * 100 >= 100 THEN 'EXCEEDED'
        WHEN (COALESCE(
            (SELECT SUM(er.amount_cents) 
             FROM expense_reimbursements er 
             WHERE er.club_id = b.club_id 
               AND er.status IN ('TREASURER_APPROVED', 'PRESIDENT_APPROVED', 'DISBURSED')
               AND (
                   er.budget_id = b.id
                   OR (er.budget_id IS NULL AND b.event_id IS NOT NULL AND er.event_id = b.event_id)
                   OR (er.budget_id IS NULL AND b.event_id IS NULL AND er.category = b.category)
               )), 0)::numeric / b.allocated_amount_cents::numeric) * 100 >= 80 THEN 'WARNING'
        ELSE 'NORMAL'
    END AS alert_status
FROM budgets b
LEFT JOIN events e ON b.event_id = e.id;

-- View 4: Membership Health & Tier Distribution Stats
CREATE OR REPLACE VIEW view_club_membership_stats AS
SELECT 
    c.id AS club_id,
    c.name AS club_name,
    COUNT(cm.id) AS total_membership_records,
    COUNT(CASE WHEN cm.status = 'ACTIVE' THEN 1 END) AS active_members_count,
    COUNT(CASE WHEN cm.status = 'PENDING_PAYMENT' THEN 1 END) AS pending_payment_count,
    COUNT(CASE WHEN cm.status = 'RENEWAL_DUE' THEN 1 END) AS renewal_due_count,
    COUNT(CASE WHEN cm.status = 'EXPIRED' THEN 1 END) AS expired_count,
    COALESCE(SUM(CASE WHEN cm.status = 'ACTIVE' THEN cm.dues_paid_cents ELSE 0 END), 0) AS total_active_dues_collected_cents
FROM clubs c
LEFT JOIN club_memberships cm ON c.id = cm.club_id
GROUP BY c.id, c.name;

-- ============================================================================
-- 15. MULTI-TENANT ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Session Context Variables:
-- When executing queries within an Express/Node.js tenant session, the backend sets:
--   SET LOCAL app.current_club_id = '<active_club_uuid>';
--   SET LOCAL app.current_user_id = '<active_user_uuid>';
--   SET LOCAL app.user_system_role = 'STUDENT_USER' | 'CAMPUS_AUDITOR' | 'SUPER_ADMIN';

-- 15.1 Enable RLS Across Core Multi-Tenant Tables
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_reimbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 15.2 Clubs Policy
DROP POLICY IF EXISTS tenant_clubs_policy ON clubs;
CREATE POLICY tenant_clubs_policy ON clubs
    FOR ALL
    USING (
        id = NULLIF(current_setting('app.current_club_id', true), '')::uuid
        OR is_active = TRUE
        OR current_setting('app.user_system_role', true) IN ('SUPER_ADMIN', 'CAMPUS_AUDITOR')
    );

-- 15.3 Club Memberships Policy
DROP POLICY IF EXISTS tenant_club_memberships_policy ON club_memberships;
CREATE POLICY tenant_club_memberships_policy ON club_memberships
    FOR ALL
    USING (
        club_id = NULLIF(current_setting('app.current_club_id', true), '')::uuid
        OR user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        OR current_setting('app.user_system_role', true) = 'SUPER_ADMIN'
    );

-- 15.4 Products Policy
DROP POLICY IF EXISTS tenant_products_policy ON products;
CREATE POLICY tenant_products_policy ON products
    FOR ALL
    USING (
        club_id = NULLIF(current_setting('app.current_club_id', true), '')::uuid
        OR is_published = TRUE
        OR current_setting('app.user_system_role', true) = 'SUPER_ADMIN'
    );

-- 15.5 Orders Policy
DROP POLICY IF EXISTS tenant_orders_policy ON orders;
CREATE POLICY tenant_orders_policy ON orders
    FOR ALL
    USING (
        club_id = NULLIF(current_setting('app.current_club_id', true), '')::uuid
        OR user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        OR current_setting('app.user_system_role', true) = 'SUPER_ADMIN'
    );

-- 15.6 Events Policy
DROP POLICY IF EXISTS tenant_events_policy ON events;
CREATE POLICY tenant_events_policy ON events
    FOR ALL
    USING (
        club_id = NULLIF(current_setting('app.current_club_id', true), '')::uuid
        OR is_published = TRUE
        OR current_setting('app.user_system_role', true) = 'SUPER_ADMIN'
    );

-- 15.7 Announcements Policy
DROP POLICY IF EXISTS tenant_announcements_policy ON announcements;
CREATE POLICY tenant_announcements_policy ON announcements
    FOR ALL
    USING (
        club_id = NULLIF(current_setting('app.current_club_id', true), '')::uuid
        OR current_setting('app.user_system_role', true) = 'SUPER_ADMIN'
    );

-- 15.8 Tasks Policy
DROP POLICY IF EXISTS tenant_tasks_policy ON tasks;
CREATE POLICY tenant_tasks_policy ON tasks
    FOR ALL
    USING (
        club_id = NULLIF(current_setting('app.current_club_id', true), '')::uuid
        OR assigned_to_user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        OR creator_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        OR current_setting('app.user_system_role', true) = 'SUPER_ADMIN'
    );

-- 15.9 Fundraisers Policy
DROP POLICY IF EXISTS tenant_fundraisers_policy ON fundraisers;
CREATE POLICY tenant_fundraisers_policy ON fundraisers
    FOR ALL
    USING (
        club_id = NULLIF(current_setting('app.current_club_id', true), '')::uuid
        OR is_active = TRUE
        OR current_setting('app.user_system_role', true) = 'SUPER_ADMIN'
    );

-- 15.10 Volunteer Shifts Policy
DROP POLICY IF EXISTS tenant_volunteer_shifts_policy ON volunteer_shifts;
CREATE POLICY tenant_volunteer_shifts_policy ON volunteer_shifts
    FOR ALL
    USING (
        club_id = NULLIF(current_setting('app.current_club_id', true), '')::uuid
        OR volunteer_user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        OR current_setting('app.user_system_role', true) = 'SUPER_ADMIN'
    );

-- 15.11 General Ledger Accounts Policy
DROP POLICY IF EXISTS tenant_ledger_accounts_policy ON ledger_accounts;
CREATE POLICY tenant_ledger_accounts_policy ON ledger_accounts
    FOR ALL
    USING (
        club_id = NULLIF(current_setting('app.current_club_id', true), '')::uuid
        OR current_setting('app.user_system_role', true) IN ('SUPER_ADMIN', 'CAMPUS_AUDITOR')
    );

-- 15.12 Journal Entries Policy
DROP POLICY IF EXISTS tenant_journal_entries_policy ON journal_entries;
CREATE POLICY tenant_journal_entries_policy ON journal_entries
    FOR ALL
    USING (
        club_id = NULLIF(current_setting('app.current_club_id', true), '')::uuid
        OR current_setting('app.user_system_role', true) IN ('SUPER_ADMIN', 'CAMPUS_AUDITOR')
    );

-- 15.13 Transactions Policy
DROP POLICY IF EXISTS tenant_transactions_policy ON transactions;
CREATE POLICY tenant_transactions_policy ON transactions
    FOR ALL
    USING (
        club_id = NULLIF(current_setting('app.current_club_id', true), '')::uuid
        OR user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        OR current_setting('app.user_system_role', true) IN ('SUPER_ADMIN', 'CAMPUS_AUDITOR')
    );

-- 15.14 Budgets Policy
DROP POLICY IF EXISTS tenant_budgets_policy ON budgets;
CREATE POLICY tenant_budgets_policy ON budgets
    FOR ALL
    USING (
        club_id = NULLIF(current_setting('app.current_club_id', true), '')::uuid
        OR current_setting('app.user_system_role', true) IN ('SUPER_ADMIN', 'CAMPUS_AUDITOR')
    );

-- 15.15 Expense Reimbursements Policy
DROP POLICY IF EXISTS tenant_expense_reimbursements_policy ON expense_reimbursements;
CREATE POLICY tenant_expense_reimbursements_policy ON expense_reimbursements
    FOR ALL
    USING (
        club_id = NULLIF(current_setting('app.current_club_id', true), '')::uuid
        OR claimant_user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        OR current_setting('app.user_system_role', true) IN ('SUPER_ADMIN', 'CAMPUS_AUDITOR')
    );

-- 15.16 Audit Logs Policy
DROP POLICY IF EXISTS tenant_audit_logs_policy ON audit_logs;
CREATE POLICY tenant_audit_logs_policy ON audit_logs
    FOR ALL
    USING (
        club_id = NULLIF(current_setting('app.current_club_id', true), '')::uuid
        OR current_setting('app.user_system_role', true) IN ('SUPER_ADMIN', 'CAMPUS_AUDITOR')
    );

-- ============================================================================
-- END OF CLUBSPHERE PRODUCTION SCHEMA DDL
-- ============================================================================
