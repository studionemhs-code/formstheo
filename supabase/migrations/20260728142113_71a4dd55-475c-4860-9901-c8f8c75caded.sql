DROP POLICY IF EXISTS "Anyone can submit a quote request" ON public.quote_requests;
CREATE POLICY "Anyone can submit a quote request"
ON public.quote_requests FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'novo'
  AND char_length(btrim(customer_name)) BETWEEN 1 AND 200
  AND char_length(btrim(whatsapp)) BETWEEN 8 AND 20
  AND char_length(btrim(cep)) BETWEEN 8 AND 12
);