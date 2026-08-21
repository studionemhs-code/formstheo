
CREATE TABLE public.share_link (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(9), 'hex'),
  active boolean NOT NULL DEFAULT true,
  message text NOT NULL DEFAULT 'Olá! Aproveite para solicitar seu orçamento no nosso formulário: {url}',
  visits integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.share_link TO authenticated;
GRANT ALL ON public.share_link TO service_role;

ALTER TABLE public.share_link ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read share link" ON public.share_link
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update share link" ON public.share_link
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER share_link_updated_at
  BEFORE UPDATE ON public.share_link
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed the single row
INSERT INTO public.share_link (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;
