-- FAQs
CREATE TABLE IF NOT EXISTS faqs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_ar  VARCHAR(500) NOT NULL,
  question_en  VARCHAR(500) NULL,
  answer_ar    TEXT NOT NULL,
  answer_en    TEXT NULL,
  sort_order   INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faqs_sort_order ON faqs (sort_order);
CREATE INDEX IF NOT EXISTS idx_faqs_is_published ON faqs (is_published);

-- Contact messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(200) NOT NULL,
  phone      VARCHAR(50) NULL,
  type       VARCHAR(30) NOT NULL DEFAULT 'general',
  subject    VARCHAR(200) NULL,
  message    TEXT NOT NULL,
  status     VARCHAR(20) NOT NULL DEFAULT 'new',
  ip         VARCHAR(50) NULL,
  user_id    UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages (status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages (created_at DESC);
