-- Civic Issue Platform: V1__init.sql
-- Database: MySQL 8/9, InnoDB, utf8mb4, collation utf8mb4_0900_ai_ci

-- 1. users
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(15) UNIQUE NULL,
    email VARCHAR(190) UNIQUE NULL,
    password_hash VARCHAR(100) NULL,
    role ENUM('CITIZEN', 'NGO', 'ADMIN') NOT NULL,
    name VARCHAR(120) NULL,
    status ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    verification_status ENUM('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'UNVERIFIED',
    verified_at DATETIME NULL,
    verified_by BIGINT NULL,
    last_login_at DATETIME NULL,
    avatar_url VARCHAR(500) NULL,
    bio VARCHAR(300) NULL,
    deleted_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role),
    INDEX idx_users_status (status),
    INDEX idx_users_verification (verification_status),
    CONSTRAINT fk_users_verified_by FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. otp_sessions
CREATE TABLE IF NOT EXISTS otp_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(15) NOT NULL,
    code_hash VARCHAR(100) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    consumed_at DATETIME NULL,
    ip VARCHAR(45) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_otp_phone_created (phone, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. user_sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    refresh_token_hash VARCHAR(100) NOT NULL,
    last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    revoked_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sessions_user_revoked_seen (user_id, revoked_at, last_seen_at),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. site_visits
CREATE TABLE IF NOT EXISTS site_visits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    visit_date DATE NOT NULL UNIQUE,
    count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. categories
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    base_priority INT NOT NULL DEFAULT 50,
    expected_resolution_hours INT NOT NULL DEFAULT 48,
    typical_budget_min DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    typical_budget_max DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 6. ngos
CREATE TABLE IF NOT EXISTS ngos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    registration_number VARCHAR(100) NOT NULL,
    description TEXT NULL,
    logo_url VARCHAR(500) NULL,
    contact_phone VARCHAR(20) NULL,
    service_center POINT NOT NULL SRID 4326,
    service_radius_km DECIMAL(6,2) NOT NULL DEFAULT 15.00,
    area_label VARCHAR(100) NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    rank_score DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    total_completed INT NOT NULL DEFAULT 0,
    avg_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    avg_resolution_hours DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    abandonment_count INT NOT NULL DEFAULT 0,
    rejection_count INT NOT NULL DEFAULT 0,
    deleted_at DATETIME NULL,
    deactivated_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    SPATIAL INDEX idx_ngos_service_center (service_center),
    INDEX idx_ngos_verified (verified),
    INDEX idx_ngos_rank (rank_score),
    CONSTRAINT fk_ngos_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 7. helpers
CREATE TABLE IF NOT EXISTS helpers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ngo_id BIGINT NOT NULL,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    home_location POINT NOT NULL SRID 4326,
    area_label VARCHAR(100) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    photo_url VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    SPATIAL INDEX idx_helpers_home_location (home_location),
    INDEX idx_helpers_ngo (ngo_id),
    INDEX idx_helpers_active (active),
    CONSTRAINT fk_helpers_ngo FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 8. requests
CREATE TABLE IF NOT EXISTS requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    citizen_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    ai_suggested_category_id BIGINT NULL,
    input_type ENUM('PHOTO', 'GEOTAGGED_PHOTO', 'VOICE', 'IVR') NOT NULL,
    source ENUM('WEB', 'IVR') NOT NULL DEFAULT 'WEB',
    description TEXT NULL,
    ai_summary VARCHAR(500) NULL,
    location POINT NOT NULL SRID 4326,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    address_text VARCHAR(300) NULL,
    status ENUM(
        'SUBMITTED', 'SCREENING', 'OPEN', 'NEEDS_ADMIN_REVIEW', 'REJECTED_FAKE',
        'CLAIMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED',
        'REJECTED_BY_NGO', 'ADMIN_IN_PROGRESS'
    ) NOT NULL DEFAULT 'SUBMITTED',
    cluster_id BIGINT NULL,
    is_cluster_parent BOOLEAN NOT NULL DEFAULT FALSE,
    ai_genuine_score DECIMAL(4,3) NULL,
    ai_priority_score DECIMAL(5,2) NULL,
    final_priority DECIMAL(5,2) NULL,
    ai_budget_min DECIMAL(12,2) NULL,
    ai_budget_max DECIMAL(12,2) NULL,
    ai_budget_reasoning VARCHAR(500) NULL,
    approved_budget DECIMAL(12,2) NULL,
    ai_easy BOOLEAN NOT NULL DEFAULT FALSE,
    screening_flags JSON NULL,
    escalated_at DATETIME NULL,
    voice_url VARCHAR(500) NULL,
    handled_by_admin_id BIGINT NULL,
    closed_at DATETIME NULL,
    caller_phone_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    SPATIAL INDEX idx_requests_location (location),
    INDEX idx_requests_status_category (status, category_id),
    INDEX idx_requests_citizen_created (citizen_id, created_at),
    INDEX idx_requests_status_escalated (status, escalated_at),
    INDEX idx_requests_cluster (cluster_id),
    INDEX idx_requests_final_priority (final_priority),
    INDEX idx_requests_lat_lng (status, latitude, longitude),
    CONSTRAINT fk_requests_citizen FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_requests_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_requests_ai_category FOREIGN KEY (ai_suggested_category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_requests_handled_by_admin FOREIGN KEY (handled_by_admin_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 9. request_clusters
CREATE TABLE IF NOT EXISTS request_clusters (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT NOT NULL,
    parent_request_id BIGINT NOT NULL,
    size INT NOT NULL DEFAULT 1,
    center POINT NOT NULL SRID 4326,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    SPATIAL INDEX idx_clusters_center (center),
    INDEX idx_clusters_category (category_id),
    CONSTRAINT fk_clusters_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_clusters_parent FOREIGN KEY (parent_request_id) REFERENCES requests(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Link requests.cluster_id to request_clusters
ALTER TABLE requests
    ADD CONSTRAINT fk_requests_cluster FOREIGN KEY (cluster_id) REFERENCES request_clusters(id) ON DELETE RESTRICT;

-- 10. request_photos
CREATE TABLE IF NOT EXISTS request_photos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT NOT NULL,
    uploaded_by BIGINT NOT NULL,
    kind ENUM('CITIZEN', 'BEFORE', 'AFTER') NOT NULL,
    assignment_id BIGINT NULL,
    url VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    exif_lat DECIMAL(9,6) NULL,
    exif_lng DECIMAL(9,6) NULL,
    exif_taken_at DATETIME NULL,
    sha256 CHAR(64) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_photos_sha256 (sha256),
    INDEX idx_photos_request_kind (request_id, kind),
    CONSTRAINT fk_photos_request FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE RESTRICT,
    CONSTRAINT fk_photos_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 11. request_status_history
CREATE TABLE IF NOT EXISTS request_status_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT NOT NULL,
    from_status VARCHAR(50) NULL,
    to_status VARCHAR(50) NOT NULL,
    actor_id BIGINT NULL,
    actor_role VARCHAR(50) NULL,
    note VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_history_request_created (request_id, created_at),
    CONSTRAINT fk_history_request FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE RESTRICT,
    CONSTRAINT fk_history_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 12. ai_analyses
CREATE TABLE IF NOT EXISTS ai_analyses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT NOT NULL,
    task ENUM('GENUINENESS', 'CATEGORY', 'PRIORITY', 'BUDGET', 'SUMMARY', 'EASY_TAG', 'TRANSCRIBE') NOT NULL,
    model VARCHAR(100) NOT NULL,
    input_hash VARCHAR(100) NULL,
    output_json JSON NULL,
    latency_ms INT NULL,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ai_request (request_id),
    CONSTRAINT fk_ai_request FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 13. ngo_claims
CREATE TABLE IF NOT EXISTS ngo_claims (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT NOT NULL,
    ngo_id BIGINT NOT NULL,
    status ENUM('ACTIVE', 'COMPLETED', 'RELEASED_BY_ADMIN', 'ABANDONED', 'CLOSED') NOT NULL,
    approved_budget DECIMAL(12,2) NULL,
    claimed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    released_by_admin_at DATETIME NULL,
    released_by BIGINT NULL,
    release_reason VARCHAR(300) NULL,
    active_key BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_active_key (active_key),
    INDEX idx_claims_ngo_status (ngo_id, status),
    INDEX idx_claims_request (request_id),
    CONSTRAINT fk_claims_request FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE RESTRICT,
    CONSTRAINT fk_claims_ngo FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE RESTRICT,
    CONSTRAINT fk_claims_released_by FOREIGN KEY (released_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 14. assignments
CREATE TABLE IF NOT EXISTS assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    helper_id BIGINT NOT NULL,
    status ENUM('ASSIGNED', 'IN_PROGRESS', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'ASSIGNED',
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME NULL,
    finished_at DATETIME NULL,
    note VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_assignments_claim (claim_id),
    INDEX idx_assignments_helper_status (helper_id, status),
    CONSTRAINT fk_assignments_claim FOREIGN KEY (claim_id) REFERENCES ngo_claims(id) ON DELETE RESTRICT,
    CONSTRAINT fk_assignments_helper FOREIGN KEY (helper_id) REFERENCES helpers(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Link request_photos.assignment_id to assignments
ALTER TABLE request_photos
    ADD CONSTRAINT fk_photos_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE RESTRICT;

-- 15. ngo_rejections
CREATE TABLE IF NOT EXISTS ngo_rejections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT NOT NULL,
    ngo_id BIGINT NOT NULL,
    reason VARCHAR(300) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_req_ngo (request_id, ngo_id),
    CONSTRAINT fk_rejections_request FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE RESTRICT,
    CONSTRAINT fk_rejections_ngo FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 16. daily_limits
CREATE TABLE IF NOT EXISTS daily_limits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ngo_id BIGINT NOT NULL,
    limit_date DATE NOT NULL,
    claim_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_ngo_date (ngo_id, limit_date),
    CONSTRAINT fk_daily_limits_ngo FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 17. volunteer_actions
CREATE TABLE IF NOT EXISTS volunteer_actions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    volunteer_id BIGINT NOT NULL,
    request_id BIGINT NOT NULL,
    outcome ENUM('CALLED_NO_ANSWER', 'CALLED_RESOLVED', 'COORDINATING', 'ESCALATED', 'RESOLVED_WITH_PROOF') NOT NULL,
    notes VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_volunteer_actions_vol_created (volunteer_id, created_at),
    INDEX idx_volunteer_actions_req (request_id),
    CONSTRAINT fk_vol_actions_volunteer FOREIGN KEY (volunteer_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_vol_actions_request FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 18. verification_requests
CREATE TABLE IF NOT EXISTS verification_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    motivation VARCHAR(500) NULL,
    reviewed_by BIGINT NULL,
    reviewed_at DATETIME NULL,
    review_note VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_verif_user_status (user_id, status),
    CONSTRAINT fk_verif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_verif_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 19. ratings
CREATE TABLE IF NOT EXISTS ratings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT NOT NULL,
    citizen_id BIGINT NOT NULL,
    ngo_id BIGINT NOT NULL,
    stars TINYINT NOT NULL,
    comment VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_rating_req_citizen (request_id, citizen_id),
    INDEX idx_ratings_ngo (ngo_id),
    CONSTRAINT fk_ratings_request FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ratings_citizen FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ratings_ngo FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 20. reward_rules
CREATE TABLE IF NOT EXISTS reward_rules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(60) NOT NULL UNIQUE,
    points INT NOT NULL,
    daily_cap_points INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 21. reward_ledger
CREATE TABLE IF NOT EXISTS reward_ledger (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    points INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    request_id BIGINT NULL,
    granted_by BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rewards_user_created (user_id, created_at),
    CONSTRAINT fk_rewards_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_rewards_request FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE RESTRICT,
    CONSTRAINT fk_rewards_granted_by FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 22. notifications
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type ENUM('STATUS_CHANGE', 'CLAIM', 'ASSIGNMENT', 'ESCALATION', 'RATING', 'VERIFICATION', 'REWARD', 'SYSTEM') NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    request_id BIGINT NULL,
    read_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_user_read (user_id, read_at),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_notifications_request FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 23. audit_log
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_id BIGINT NULL,
    actor_role VARCHAR(50) NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id BIGINT NULL,
    before_json JSON NULL,
    after_json JSON NULL,
    ip VARCHAR(45) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_actor_created (actor_id, created_at),
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
