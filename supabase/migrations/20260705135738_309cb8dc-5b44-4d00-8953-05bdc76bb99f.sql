
-- =========================================================================
-- ZakaPay MVP canonical schema
-- =========================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================================
-- ENUMS
-- =========================================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'merchant');

CREATE TYPE public.split_method AS ENUM ('contributor', 'multi_card');

CREATE TYPE public.session_state AS ENUM (
  'created', 'awaiting_method', 'collecting', 'processing',
  'authorized', 'captured', 'completed', 'expired', 'failed', 'canceled', 'refunded'
);

CREATE TYPE public.contributor_state AS ENUM (
  'invited', 'viewed', 'authorizing', 'authorized', 'captured', 'failed', 'expired', 'refunded'
);

CREATE TYPE public.card_allocation_state AS ENUM (
  'pending', 'authorizing', 'authorized', 'captured', 'failed', 'voided'
);

CREATE TYPE public.payment_state AS ENUM (
  'pending', 'authorizing', 'authorized', 'captured', 'failed', 'voided', 'refunded'
);

CREATE TYPE public.payment_source_type AS ENUM ('contributor', 'card_allocation');

CREATE TYPE public.refund_state AS ENUM ('pending', 'succeeded', 'failed');

CREATE TYPE public.notification_channel AS ENUM ('email', 'sms');

CREATE TYPE public.notification_state AS ENUM ('queued', 'sent', 'failed');

CREATE TYPE public.merchant_status AS ENUM ('pending', 'active', 'suspended');

-- =========================================================================
-- user_roles
-- =========================================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  merchant_id UUID, -- optional scope for merchant role (set after merchant row exists)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, merchant_id)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role (security definer, avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.current_merchant_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT merchant_id FROM public.user_roles
   WHERE user_id = auth.uid() AND role = 'merchant' AND merchant_id IS NOT NULL
   LIMIT 1;
$$;

CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- =========================================================================
-- Shared updated_at trigger
-- =========================================================================
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========================================================================
-- merchants
-- =========================================================================
CREATE TABLE public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  status public.merchant_status NOT NULL DEFAULT 'pending',
  stripe_account_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX merchants_by_status ON public.merchants (status);
CREATE INDEX merchants_by_owner ON public.merchants (owner_user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchants TO authenticated;
GRANT ALL ON public.merchants TO service_role;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchants read own" ON public.merchants FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "merchants insert own" ON public.merchants FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "merchants update own" ON public.merchants FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER merchants_updated_at BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================================
-- merchant_settings
-- =========================================================================
CREATE TABLE public.merchant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL UNIQUE REFERENCES public.merchants(id) ON DELETE CASCADE,
  brand_color TEXT NOT NULL DEFAULT '#0071E3',
  logo_url TEXT,
  session_ttl_seconds INTEGER NOT NULL DEFAULT 3600,
  contributor_split_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  multi_card_split_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  refund_window_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchant_settings TO authenticated;
GRANT ALL ON public.merchant_settings TO service_role;
ALTER TABLE public.merchant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings by owner" ON public.merchant_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id
                   AND (m.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id
                   AND (m.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE TRIGGER merchant_settings_updated_at BEFORE UPDATE ON public.merchant_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================================
-- split_sessions
-- =========================================================================
CREATE TABLE public.split_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  external_transaction_id TEXT UNIQUE,
  order_reference TEXT,
  total_amount_cents BIGINT NOT NULL CHECK (total_amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  method public.split_method,
  state public.session_state NOT NULL DEFAULT 'created',
  initiator_email TEXT,
  initiator_name TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX split_sessions_by_merchant ON public.split_sessions (merchant_id);
CREATE INDEX split_sessions_by_state ON public.split_sessions (state);
CREATE INDEX split_sessions_by_method ON public.split_sessions (method);
CREATE INDEX split_sessions_by_created ON public.split_sessions (created_at DESC);
CREATE INDEX split_sessions_by_expires ON public.split_sessions (expires_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.split_sessions TO authenticated;
GRANT ALL ON public.split_sessions TO service_role;
ALTER TABLE public.split_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions by merchant owner" ON public.split_sessions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id
                   AND (m.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id
                   AND (m.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE TRIGGER split_sessions_updated_at BEFORE UPDATE ON public.split_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================================
-- contributors
-- =========================================================================
CREATE TABLE public.contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.split_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  share_amount_cents BIGINT NOT NULL CHECK (share_amount_cents > 0),
  state public.contributor_state NOT NULL DEFAULT 'invited',
  invite_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  is_initiator BOOLEAN NOT NULL DEFAULT FALSE,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX contributors_by_session ON public.contributors (session_id);
CREATE INDEX contributors_by_email ON public.contributors (email);
CREATE INDEX contributors_by_state ON public.contributors (state);
CREATE INDEX contributors_by_expires ON public.contributors (expires_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contributors TO authenticated;
GRANT ALL ON public.contributors TO service_role;
ALTER TABLE public.contributors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contributors by merchant owner" ON public.contributors FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.split_sessions s JOIN public.merchants m ON m.id = s.merchant_id
                  WHERE s.id = session_id
                    AND (m.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.split_sessions s JOIN public.merchants m ON m.id = s.merchant_id
                  WHERE s.id = session_id
                    AND (m.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE TRIGGER contributors_updated_at BEFORE UPDATE ON public.contributors
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================================
-- card_allocations
-- =========================================================================
CREATE TABLE public.card_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.split_sessions(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  card_label TEXT,
  last4 TEXT,
  state public.card_allocation_state NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, sequence)
);
CREATE INDEX card_allocations_by_session ON public.card_allocations (session_id);
CREATE INDEX card_allocations_by_state ON public.card_allocations (state);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_allocations TO authenticated;
GRANT ALL ON public.card_allocations TO service_role;
ALTER TABLE public.card_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "card allocations by merchant owner" ON public.card_allocations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.split_sessions s JOIN public.merchants m ON m.id = s.merchant_id
                  WHERE s.id = session_id
                    AND (m.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.split_sessions s JOIN public.merchants m ON m.id = s.merchant_id
                  WHERE s.id = session_id
                    AND (m.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE TRIGGER card_allocations_updated_at BEFORE UPDATE ON public.card_allocations
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================================
-- payments (append-only)
-- =========================================================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.split_sessions(id) ON DELETE CASCADE,
  source_type public.payment_source_type NOT NULL,
  source_id UUID NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  state public.payment_state NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT UNIQUE,
  idempotency_key TEXT UNIQUE,
  failure_reason TEXT,
  authorized_at TIMESTAMPTZ,
  captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX payments_by_session ON public.payments (session_id);
CREATE INDEX payments_by_source ON public.payments (source_type, source_id);
CREATE INDEX payments_by_state ON public.payments (state);
CREATE INDEX payments_by_created ON public.payments (created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments by merchant owner" ON public.payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.split_sessions s JOIN public.merchants m ON m.id = s.merchant_id
                  WHERE s.id = session_id
                    AND (m.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "payments insert by merchant owner" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.split_sessions s JOIN public.merchants m ON m.id = s.merchant_id
                  WHERE s.id = session_id
                    AND (m.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "payments update by merchant owner" ON public.payments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.split_sessions s JOIN public.merchants m ON m.id = s.merchant_id
                  WHERE s.id = session_id
                    AND (m.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.split_sessions s JOIN public.merchants m ON m.id = s.merchant_id
                  WHERE s.id = session_id
                    AND (m.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- Append-only guard: only state, timestamps, failure_reason, stripe_payment_intent_id may change
CREATE OR REPLACE FUNCTION public.tg_payments_append_only()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.session_id <> OLD.session_id OR NEW.source_type <> OLD.source_type
     OR NEW.source_id <> OLD.source_id OR NEW.amount_cents <> OLD.amount_cents
     OR NEW.currency <> OLD.currency OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key
     OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'payments are append-only: immutable fields cannot be modified';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER payments_append_only BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_payments_append_only();

-- =========================================================================
-- refunds (append-only)
-- =========================================================================
CREATE TABLE public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.split_sessions(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  reason TEXT,
  state public.refund_state NOT NULL DEFAULT 'pending',
  stripe_refund_id TEXT UNIQUE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX refunds_by_session ON public.refunds (session_id);
CREATE INDEX refunds_by_merchant ON public.refunds (merchant_id);
CREATE INDEX refunds_by_state ON public.refunds (state);
CREATE INDEX refunds_by_created ON public.refunds (created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.refunds TO authenticated;
GRANT ALL ON public.refunds TO service_role;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "refunds by merchant owner" ON public.refunds FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id
                   AND (m.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "refunds insert by merchant owner" ON public.refunds FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id
                   AND (m.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "refunds update by merchant owner" ON public.refunds FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id
                   AND (m.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id
                   AND (m.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE OR REPLACE FUNCTION public.tg_refunds_append_only()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.payment_id <> OLD.payment_id OR NEW.session_id <> OLD.session_id
     OR NEW.merchant_id <> OLD.merchant_id OR NEW.amount_cents <> OLD.amount_cents
     OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'refunds are append-only: immutable fields cannot be modified';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER refunds_append_only BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.tg_refunds_append_only();

-- =========================================================================
-- notifications
-- =========================================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.split_sessions(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  channel public.notification_channel NOT NULL DEFAULT 'email',
  template TEXT NOT NULL,
  recipient TEXT NOT NULL,
  state public.notification_state NOT NULL DEFAULT 'queued',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_by_recipient ON public.notifications (recipient);
CREATE INDEX notifications_by_state ON public.notifications (state);
CREATE INDEX notifications_by_template ON public.notifications (template);
CREATE INDEX notifications_by_created ON public.notifications (created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications by merchant owner" ON public.notifications FOR ALL TO authenticated
  USING (merchant_id IS NULL OR EXISTS (
    SELECT 1 FROM public.merchants m WHERE m.id = merchant_id
      AND (m.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (merchant_id IS NULL OR EXISTS (
    SELECT 1 FROM public.merchants m WHERE m.id = merchant_id
      AND (m.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- =========================================================================
-- audit_events (append-only)
-- =========================================================================
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.split_sessions(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL DEFAULT 'system',
  actor_id TEXT,
  from_state TEXT,
  to_state TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_by_entity ON public.audit_events (entity_type, entity_id);
CREATE INDEX audit_by_session ON public.audit_events (session_id);
CREATE INDEX audit_by_event_type ON public.audit_events (event_type);
CREATE INDEX audit_by_created ON public.audit_events (created_at DESC);

GRANT SELECT, INSERT ON public.audit_events TO authenticated;
GRANT ALL ON public.audit_events TO service_role;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit read by merchant owner" ON public.audit_events FOR SELECT TO authenticated
  USING (merchant_id IS NULL OR EXISTS (
    SELECT 1 FROM public.merchants m WHERE m.id = merchant_id
      AND (m.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "audit insert by merchant owner" ON public.audit_events FOR INSERT TO authenticated
  WITH CHECK (merchant_id IS NULL OR EXISTS (
    SELECT 1 FROM public.merchants m WHERE m.id = merchant_id
      AND (m.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE OR REPLACE FUNCTION public.tg_audit_no_update()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'audit_events are append-only'; END;
$$;
CREATE TRIGGER audit_no_update BEFORE UPDATE OR DELETE ON public.audit_events
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit_no_update();

-- =========================================================================
-- webhook_events
-- =========================================================================
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX webhook_by_processed ON public.webhook_events (processed);
CREATE INDEX webhook_by_type ON public.webhook_events (event_type);
CREATE INDEX webhook_by_received ON public.webhook_events (received_at DESC);

GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies: service role only.

-- =========================================================================
-- feature_flags
-- =========================================================================
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production',
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, environment)
);
CREATE INDEX feature_flags_by_env ON public.feature_flags (environment);

GRANT SELECT ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flags readable" ON public.feature_flags FOR SELECT TO authenticated USING (TRUE);

CREATE TRIGGER feature_flags_updated_at BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================================
-- Realtime
-- =========================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.split_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contributors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.card_allocations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
