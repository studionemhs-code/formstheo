// Catálogo dos produtos Theotokos (imagens hospedadas no CDN atual)
export type Product = { id: string; label: string; image: string };

export const CHAIN_MODELS: Product[] = [
  { id: "modelo-1", label: "Modelo 1", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/698c822fa758c7296a1f7f69-1770816461270.jpeg" },
  { id: "modelo-2", label: "Modelo 2", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69cc0e13dee9c10ba6c28e96-1774980666421.jpeg" },
  { id: "modelo-3", label: "Modelo 3", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69ea5422b7882619549865a1-1776965037869.jpeg" },
  { id: "modelo-4", label: "Modelo 4", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/698c823d2a64d7c2fa4c757c-1770816109245.jpg" },
  { id: "modelo-5", label: "Modelo 5", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/698c8236f7dbcc6feeb9fbf2-1770816148660.jpg" },
  { id: "modelo-7", label: "Modelo 7", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69319624cbd1b0b516b507db-1764857417411.jpg" },
];

export const MARIAN_MEDALS: Product[] = [
  { id: "fatima", label: "N.S. de Fátima", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/6987a44d7fa455aee0387420-1777317420599.jpeg" },
  { id: "fatima-italiana", label: "N.S. de Fátima (italiana)", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/6a15e9de0268b4f33646a385-1779821552081.jpeg" },
  { id: "mae-rainha", label: "Mãe Rainha", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/68112088d06298e1f9938d11-1745952923963.jpg" },
  { id: "rainha-paz", label: "N.S. Rainha da Paz", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/65d2713c5fa0d2d307bf77fd-1708290912046.jpeg" },
  { id: "rosa-mistica", label: "N.S. Rosa Mística", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/66c6a89b0b40528d56f21abe-1724295376506.jpg" },
  { id: "perpetuo-socorro", label: "N.S. do Perpétuo Socorro", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/6635881bf0743613b098be8e-1714784355157.jpeg" },
  { id: "carmo", label: "N.S. do Carmo", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/6987a455c9c84ee8da7164eb-1770499516893.jpeg" },
  { id: "guadalupe", label: "N.S. de Guadalupe", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/698b259630e7478ac7063e47-1770726859512.jpg" },
  { id: "lourdes", label: "N.S. de Lourdes", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69d6a1b1db4fe3e61bd5aa0c-1775673802415.jpeg" },
  { id: "desatadora", label: "N.S. Desatadora dos Nós", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69d6a1ccee55e69822f679e3-1775673834598.jpeg" },
];

export const INOX_MEDALS: Product[] = [
  { id: "aparecida-inox", label: "N.S. Aparecida (Inox)", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/65d0c73ac8f38084235c487a-1709778624816.jpg" },
  { id: "sao-jose-inox", label: "São José (Inox)", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/6987a5c73989db42414cdb4f-1770497843588.jpeg" },
  { id: "la-salette-inox", label: "N.S. de La Salette (Inox)", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/6722344ff767e718a9b8c33c-1730294899984.jpg" },
  { id: "gracas-p-inox", label: "N.S. das Graças P (Inox)", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/683f5b96cd40a3d0f04de756-1748982722357.jpg" },
  { id: "sao-miguel-inox", label: "São Miguel Arcanjo (Inox)", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/683f5bcaa5c1a870f1d59294-1748982758622.jpg" },
  { id: "gracas-m-inox", label: "N.S. das Graças M (Inox)", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69ea55f1cb2daf15b259f460-1776965147469.jpeg" },
  { id: "mini-cadeado-inox", label: "Mini cadeado (Inox)", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69fa485cf69858156cbc99a9-1778010254274.jpeg" },
];

export const SAINT_MEDALS: Product[] = [
  { id: "expedito", label: "Santo Expedito", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/65d0d444ceb9afc0f42c6b53-1708184744353.jpeg" },
  { id: "francisco-antonio", label: "São Francisco / Santo Antônio", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/65e097a7014077a2b2eb10a9-1709217728973.jpg" },
  { id: "sao-bento", label: "Medalha de São Bento", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/677ebb9850f5698745e78e5a-1736358892236.jpg" },
  { id: "sagrada-familia", label: "Sagrada Família / Divino E. Santo", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69aac3fe51eb4d636e118af3-1772799012161.jpeg" },
  { id: "cruz-santos", label: "Cruz de todos os Santos (3cm)", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69d6a18e9ad5aed90fa8157a-1775673767017.jpeg" },
];

export const PENDANTS: Product[] = [
  { id: "aparecida-moldura", label: "N.S. Aparecida Moldurado", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/65d0c73ac8f38084235c487a-1708291211640.jpeg" },
  { id: "cadeado-tradicional", label: "Cadeado Tradicional", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/65d271ff3359907f680ebf6e-1708291285094.jpeg" },
  { id: "cadeado-coracao", label: "Cadeado de Coração", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/686bc5e9053291c070df2c70-1751893503981.jpg" },
  { id: "coroa-01", label: "Coroa 01", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/668f380bf7825547a83480dd-1720662269853.jpg" },
  { id: "coroa-02", label: "Coroa 02", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/668f39439bef98bbb92e4cce-1720662391923.jpg" },
  { id: "rosa-vermelha", label: "Rosa Vermelha", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/686bc4e8b88526299b1cbb3f-1751893440247.jpg" },
  { id: "relicario-aparecida", label: "Relicário N.S. Aparecida", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/66401b19ae2d07bbbf7f2b34-1715477304689.jpg" },
  { id: "pingente-sao-bento", label: "Pingente de São Bento", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/6797ede5b4d7c1f94423d564-1738010127393.jpg" },
  { id: "aparecida-pedrinhas", label: "N.S. Aparecida (pedrinhas)", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69d6a07be2383ab7b508d3a1-1775673593706.jpeg" },
  { id: "aparecida-coracao", label: "N.S. Aparecida moldura coração", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69d6a0fb43bacdd80175ffb7-1775673689251.jpeg" },
  { id: "pingente-gracas", label: "Pingente N.S. das Graças", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/69d6a15bd6fd59ed626e21fd-1775673723319.jpeg" },
];

export const MEDALLIONS: Product[] = [
  { id: "medalhao-miguel", label: "Medalhão de São Miguel Arcanjo", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/65e0962f4fabd1f10ede67e2-1709218645554.jpg" },
  { id: "medalhao-bento", label: "Medalhão de São Bento", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/68142f61e739e915beebcd63-1746153339658.jpg" },
];

export const SCAPULARS: Product[] = [
  { id: "escapulario-claro", label: "Escapulário G (Claro)", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/684e18a3ae2680eab17b818b-1749949147906.jpg" },
  { id: "escapulario-escuro", label: "Escapulário G (Escuro)", image: "https://uploads.whatsform.com/65d0c75786cae29aadd13e0f/695d06ece7b2d68183652558-1767704442454.jpg" },
];

// Substitua pelo número real do WhatsApp da loja (somente dígitos, com DDI e DDD)
export const STORE_WHATSAPP = "5583998473528";
