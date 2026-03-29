CREATE TYPE public.request_status AS ENUM ('queued', 'completed', 'error');

CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_device_id ON public.sessions (device_id);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sessions are publicly readable" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Sessions can be created by anyone" ON public.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Sessions can be updated by anyone" ON public.sessions FOR UPDATE USING (true);

CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  mode TEXT NOT NULL,
  pillar TEXT,
  sub TEXT,
  locale TEXT NOT NULL DEFAULT 'en',
  input TEXT NOT NULL,
  response TEXT,
  provider TEXT,
  status request_status NOT NULL DEFAULT 'queued',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_requests_mode_created ON public.requests (mode, created_at);
CREATE INDEX idx_requests_status_created ON public.requests (status, created_at);
CREATE INDEX idx_requests_session_created ON public.requests (session_id, created_at);
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Requests are publicly readable" ON public.requests FOR SELECT USING (true);
CREATE POLICY "Requests can be created by anyone" ON public.requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Requests can be updated by anyone" ON public.requests FOR UPDATE USING (true);

CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_feedback_request ON public.feedback (request_id);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Feedback is publicly readable" ON public.feedback FOR SELECT USING (true);
CREATE POLICY "Feedback can be created by anyone" ON public.feedback FOR INSERT WITH CHECK (true);

CREATE TABLE public.taleem_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pillar TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_taleem_pillar_created ON public.taleem_resources (pillar, created_at);
ALTER TABLE public.taleem_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Taleem resources are publicly readable" ON public.taleem_resources FOR SELECT USING (true);
CREATE POLICY "Taleem resources can be created by anyone" ON public.taleem_resources FOR INSERT WITH CHECK (true);

CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT NOT NULL,
  event_type TEXT NOT NULL,
  request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
  metadata TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_event_type_created ON public.audit_events (event_type, created_at);
CREATE INDEX idx_audit_created ON public.audit_events (created_at);
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audit events are publicly readable" ON public.audit_events FOR SELECT USING (true);
CREATE POLICY "Audit events can be created by anyone" ON public.audit_events FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();