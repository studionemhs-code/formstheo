-- =========== ROLES ===========
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- =========== SHARED TRIGGER ===========
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========== PRODUCTS ===========
CREATE TYPE public.product_category AS ENUM
  ('chain','marian','inox','saint','pendant','medallion','scapular');

CREATE TABLE public.products (
  id text PRIMARY KEY,
  category public.product_category NOT NULL,
  label text NOT NULL,
  image text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads active products" ON public.products
  FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update products" ON public.products
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete products" ON public.products
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========== SITE SETTINGS ===========
CREATE TABLE public.site_settings (
  id int PRIMARY KEY DEFAULT 1,
  whatsapp text NOT NULL DEFAULT '5583998473528',
  brand_name text NOT NULL DEFAULT 'Loja Theotokos',
  hero_title text NOT NULL DEFAULT 'Monte sua cadeiazinha devocional',
  hero_subtitle text NOT NULL DEFAULT 'Escolha modelo, medalhas e receba seu orçamento pelo WhatsApp.',
  primary_color text NOT NULL DEFAULT '#6b21a8',
  accent_color text NOT NULL DEFAULT '#a855f7',
  logo_url text,
  message_template text NOT NULL DEFAULT 'Olá! Gostaria de um orçamento.

*Nome:* {{name}}
*WhatsApp:* {{whatsapp}}
*Endereço:* {{address}}

{{items}}

{{notes}}',
  step_labels jsonb NOT NULL DEFAULT '["Seus dados","Cadeiazinhas","Medalhões","Escapulários","Revisar & Enviar"]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (id = 1)
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads settings" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update settings" ON public.site_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert settings" ON public.site_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_site_settings_updated BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_settings (id) VALUES (1);

-- =========== QUOTE REQUESTS: admin access ===========
GRANT SELECT, UPDATE, DELETE ON public.quote_requests TO authenticated;

CREATE POLICY "Admins read quote requests" ON public.quote_requests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update quote requests" ON public.quote_requests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete quote requests" ON public.quote_requests
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =========== SEED PRODUCTS ===========
INSERT INTO public.products (id, category, label, image, sort_order) VALUES
('modelo-1','chain','Modelo 1','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/698c822fa758c7296a1f7f69-1770816461270.jpeg',1),
('modelo-2','chain','Modelo 2','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69cc0e13dee9c10ba6c28e96-1774980666421.jpeg',2),
('modelo-3','chain','Modelo 3','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69ea5422b7882619549865a1-1776965037869.jpeg',3),
('modelo-4','chain','Modelo 4','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/698c823d2a64d7c2fa4c757c-1770816109245.jpg',4),
('modelo-5','chain','Modelo 5','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/698c8236f7dbcc6feeb9fbf2-1770816148660.jpg',5),
('modelo-7','chain','Modelo 7','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69319624cbd1b0b516b507db-1764857417411.jpg',6),
('fatima','marian','N.S. de Fátima','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/6987a44d7fa455aee0387420-1777317420599.jpeg',1),
('fatima-italiana','marian','N.S. de Fátima (italiana)','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/6a15e9de0268b4f33646a385-1779821552081.jpeg',2),
('mae-rainha','marian','Mãe Rainha','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/68112088d06298e1f9938d11-1745952923963.jpg',3),
('rainha-paz','marian','N.S. Rainha da Paz','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/65d2713c5fa0d2d307bf77fd-1708290912046.jpeg',4),
('rosa-mistica','marian','N.S. Rosa Mística','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/66c6a89b0b40528d56f21abe-1724295376506.jpg',5),
('perpetuo-socorro','marian','N.S. do Perpétuo Socorro','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/6635881bf0743613b098be8e-1714784355157.jpeg',6),
('carmo','marian','N.S. do Carmo','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/6987a455c9c84ee8da7164eb-1770499516893.jpeg',7),
('guadalupe','marian','N.S. de Guadalupe','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/698b259630e7478ac7063e47-1770726859512.jpg',8),
('lourdes','marian','N.S. de Lourdes','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69d6a1b1db4fe3e61bd5aa0c-1775673802415.jpeg',9),
('desatadora','marian','N.S. Desatadora dos Nós','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69d6a1ccee55e69822f679e3-1775673834598.jpeg',10),
('aparecida-inox','inox','N.S. Aparecida (Inox)','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/65d0c73ac8f38084235c487a-1709778624816.jpg',1),
('sao-jose-inox','inox','São José (Inox)','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/6987a5c73989db42414cdb4f-1770497843588.jpeg',2),
('la-salette-inox','inox','N.S. de La Salette (Inox)','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/6722344ff767e718a9b8c33c-1730294899984.jpg',3),
('gracas-p-inox','inox','N.S. das Graças P (Inox)','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/683f5b96cd40a3d0f04de756-1748982722357.jpg',4),
('sao-miguel-inox','inox','São Miguel Arcanjo (Inox)','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/683f5bcaa5c1a870f1d59294-1748982758622.jpg',5),
('gracas-m-inox','inox','N.S. das Graças M (Inox)','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69ea55f1cb2daf15b259f460-1776965147469.jpeg',6),
('mini-cadeado-inox','inox','Mini cadeado (Inox)','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69fa485cf69858156cbc99a9-1778010254274.jpeg',7),
('expedito','saint','Santo Expedito','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/65d0d444ceb9afc0f42c6b53-1708184744353.jpeg',1),
('francisco-antonio','saint','São Francisco / Santo Antônio','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/65e097a7014077a2b2eb10a9-1709217728973.jpg',2),
('sao-bento','saint','Medalha de São Bento','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/677ebb9850f5698745e78e5a-1736358892236.jpg',3),
('sagrada-familia','saint','Sagrada Família / Divino E. Santo','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69aac3fe51eb4d636e118af3-1772799012161.jpeg',4),
('cruz-santos','saint','Cruz de todos os Santos (3cm)','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69d6a18e9ad5aed90fa8157a-1775673767017.jpeg',5),
('aparecida-moldura','pendant','N.S. Aparecida Moldurado','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/65d0c73ac8f38084235c487a-1708291211640.jpeg',1),
('cadeado-tradicional','pendant','Cadeado Tradicional','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/65d271ff3359907f680ebf6e-1708291285094.jpeg',2),
('cadeado-coracao','pendant','Cadeado de Coração','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/686bc5e9053291c070df2c70-1751893503981.jpg',3),
('coroa-01','pendant','Coroa 01','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/668f380bf7825547a83480dd-1720662269853.jpg',4),
('coroa-02','pendant','Coroa 02','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/668f39439bef98bbb92e4cce-1720662391923.jpg',5),
('rosa-vermelha','pendant','Rosa Vermelha','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/686bc4e8b88526299b1cbb3f-1751893440247.jpg',6),
('relicario-aparecida','pendant','Relicário N.S. Aparecida','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/66401b19ae2d07bbbf7f2b34-1715477304689.jpg',7),
('pingente-sao-bento','pendant','Pingente de São Bento','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/6797ede5b4d7c1f94423d564-1738010127393.jpg',8),
('aparecida-pedrinhas','pendant','N.S. Aparecida (pedrinhas)','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69d6a07be2383ab7b508d3a1-1775673593706.jpeg',9),
('aparecida-coracao','pendant','N.S. Aparecida moldura coração','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69d6a0fb43bacdd80175ffb7-1775673689251.jpeg',10),
('pingente-gracas','pendant','Pingente N.S. das Graças','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69d6a15bd6fd59ed626e21fd-1775673723319.jpeg',11),
('medalhao-miguel','medallion','Medalhão de São Miguel Arcanjo','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/65e0962f4fabd1f10ede67e2-1709218645554.jpg',1),
('medalhao-bento','medallion','Medalhão de São Bento','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/68142f61e739e915beebcd63-1746153339658.jpg',2),
('escapulario-claro','scapular','Escapulário G (Claro)','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/684e18a3ae2680eab17b818b-1749949147906.jpg',1),
('escapulario-escuro','scapular','Escapulário G (Escuro)','https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/695d06ece7b2d68183652558-1767704442454.jpg',2);
