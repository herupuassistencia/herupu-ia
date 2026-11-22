-- HERUPU · Organização do catálogo de serviços (categorias e especialidades)
-- Junta serviços repetidos (técnicos e chamados passam para o serviço que fica),
-- cria a área Energia Solar, completa Eletrodomésticos e padroniza os nomes.
-- Nada é apagado: o serviço repetido só fica inativo.
\set ON_ERROR_STOP on
BEGIN;
\o /dev/null
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE FUNCTION pg_temp.slugify(t text) RETURNS text LANGUAGE sql AS $$
  SELECT trim(both '-' from regexp_replace(lower(unaccent(t)), '[^a-z0-9]+', '-', 'g'))
$$;

CREATE FUNCTION pg_temp.cat(s text) RETURNS int LANGUAGE sql AS $$
  SELECT id FROM categorias WHERE slug = s
$$;

-- acha um serviço pelo nome (ignora maiúsculas e acentos)
CREATE FUNCTION pg_temp.esp(n text) RETURNS int LANGUAGE sql AS $$
  SELECT id FROM especialidades
  WHERE lower(unaccent(trim(nome))) = lower(unaccent(trim(n)))
  ORDER BY ativo DESC, id LIMIT 1
$$;

-- técnicos de "origem" também passam a atender "destino"
CREATE FUNCTION pg_temp.copiar(origem text, destino text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE o int := pg_temp.esp(origem); d int := pg_temp.esp(destino);
BEGIN
  IF o IS NULL OR d IS NULL OR o = d THEN RAISE NOTICE 'copiar: pulado (% -> %)', origem, destino; RETURN; END IF;
  INSERT INTO tecnicos_especialidades (tecnico_id, especialidade_id, nivel, certificado)
    SELECT tecnico_id, d, nivel, certificado FROM tecnicos_especialidades WHERE especialidade_id = o
    ON CONFLICT (tecnico_id, especialidade_id) DO NOTHING;
END $$;

-- junta "origem" em "destino": técnicos e chamados vão para o destino; origem fica inativa
CREATE FUNCTION pg_temp.fundir(origem text, destino text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE o int := pg_temp.esp(origem); d int := pg_temp.esp(destino);
BEGIN
  IF o IS NULL OR d IS NULL OR o = d THEN RAISE NOTICE 'fundir: pulado (% -> %)', origem, destino; RETURN; END IF;
  PERFORM pg_temp.copiar(origem, destino);
  UPDATE ordens_servico SET especialidade_id = d WHERE especialidade_id = o;
  DELETE FROM tecnicos_especialidades WHERE especialidade_id = o;
  UPDATE especialidades SET ativo = FALSE WHERE id = o;
  RAISE NOTICE 'juntado: % -> %', origem, destino;
END $$;

-- renomeia (e opcionalmente muda de área); atualiza o slug se ele estiver livre
CREATE FUNCTION pg_temp.ren(antigo text, novo text, nova_cat text DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $$
DECLARE i int := pg_temp.esp(antigo); s text := pg_temp.slugify(novo);
BEGIN
  IF i IS NULL THEN RAISE NOTICE 'renomear: não achei "%"', antigo; RETURN; END IF;
  UPDATE especialidades SET nome = novo,
    categoria_id = COALESCE(pg_temp.cat(nova_cat), categoria_id),
    slug = CASE WHEN EXISTS (SELECT 1 FROM especialidades WHERE slug = s AND id <> i) THEN slug ELSE s END
  WHERE id = i;
END $$;

-- cria um serviço novo se ainda não existir
CREATE FUNCTION pg_temp.novo(n text, c text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF pg_temp.esp(n) IS NOT NULL OR EXISTS (SELECT 1 FROM especialidades WHERE slug = pg_temp.slugify(n)) THEN
    UPDATE especialidades SET ativo = TRUE, categoria_id = pg_temp.cat(c) WHERE id = pg_temp.esp(n);
    RETURN;
  END IF;
  INSERT INTO especialidades (categoria_id, nome, slug, aprovada) VALUES (pg_temp.cat(c), n, pg_temp.slugify(n), TRUE);
END $$;

-- ===== 1. Nova área: Energia Solar =====
UPDATE categorias SET ordem = ordem + 1 WHERE ordem >= 3
  AND NOT EXISTS (SELECT 1 FROM categorias WHERE slug = 'energia-solar');
INSERT INTO categorias (nome, slug, icone, cor, ordem, descricao_curta, ativo)
  SELECT 'Energia Solar', 'energia-solar', 'sunny', '#f59e0b', 3, 'Instalação, manutenção e limpeza de sistemas fotovoltaicos', TRUE
  WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE slug = 'energia-solar');
UPDATE categorias SET ativo = TRUE, ordem = 3 WHERE slug = 'energia-solar';

SELECT pg_temp.ren('Instalação Fotovoltaica', 'Instalação de sistema fotovoltaico', 'energia-solar');
SELECT pg_temp.novo('Manutenção de sistema fotovoltaico', 'energia-solar');
SELECT pg_temp.copiar('Energia solar fotovoltaica', 'Manutenção de sistema fotovoltaico');
SELECT pg_temp.fundir('Energia solar fotovoltaica', 'Instalação de sistema fotovoltaico');
SELECT pg_temp.ren('Limpeza placas solares', 'Limpeza de placas solares', 'energia-solar');
SELECT pg_temp.novo('Inversor solar (troca e reparo)', 'energia-solar');
SELECT pg_temp.novo('Projeto e homologação solar', 'energia-solar');

-- ===== 2. Elétrica =====
SELECT pg_temp.fundir('Quadro de Energia', 'Quadro de Distribuição');
SELECT pg_temp.ren('Quadro de Distribuição', 'Quadro de distribuição');
SELECT pg_temp.ren('Instalação Elétrica', 'Instalação elétrica');
SELECT pg_temp.ren('Instalação Residencial', 'Instalação elétrica residencial');
SELECT pg_temp.ren('Instalação Comercial', 'Instalação elétrica comercial');
SELECT pg_temp.ren('Manutenção Elétrica', 'Manutenção elétrica');
SELECT pg_temp.ren('Padrão de Entrada', 'Padrão de entrada');
SELECT pg_temp.ren('Tomadas e Interruptores', 'Tomadas e interruptores');
SELECT pg_temp.ren('Automação Residencial', 'Automação residencial');

-- ===== 3. Hidráulica =====
SELECT pg_temp.ren('Instalação Hidráulica', 'Instalação hidráulica');
SELECT pg_temp.ren('Caixa D''Água', 'Caixa d''água');
SELECT pg_temp.ren('Bombas Residenciais', 'Bomba d''água residencial');

-- ===== 4. Refrigeração e climatização =====
SELECT pg_temp.ren('Instalação Split', 'Instalação de ar-condicionado split');
SELECT pg_temp.ren('Limpeza Split', 'Limpeza de ar-condicionado split');
SELECT pg_temp.ren('Manutenção Split', 'Manutenção de ar-condicionado split');
SELECT pg_temp.copiar('Ar Condicionado Split', 'Instalação de ar-condicionado split');
SELECT pg_temp.copiar('Ar Condicionado Split', 'Limpeza de ar-condicionado split');
SELECT pg_temp.fundir('Ar Condicionado Split', 'Manutenção de ar-condicionado split');
SELECT pg_temp.ren('Ar Condicionado Inverter', 'Ar-condicionado inverter');
SELECT pg_temp.ren('Ar Condicionado Cassete', 'Ar-condicionado cassete');
SELECT pg_temp.ren('Carga de Gás', 'Carga de gás do ar-condicionado');
SELECT pg_temp.ren('Câmara Fria', 'Câmara fria');
SELECT pg_temp.ren('Geladeira / Freezer', 'Geladeira e freezer comum', 'eletrodomesticos');

-- ===== 5. Eletrodomésticos =====
SELECT pg_temp.ren('Recarga de Gás', 'Recarga de gás da geladeira');
SELECT pg_temp.ren('Diagnóstico de Refrigeração', 'Diagnóstico de geladeira');
SELECT pg_temp.ren('Troca de Compressor', 'Troca de compressor');
SELECT pg_temp.ren('Geladeira Frost Free', 'Geladeira frost free');
SELECT pg_temp.ren('Geladeira Inverter', 'Geladeira inverter');
SELECT pg_temp.ren('Geladeira Comercial', 'Geladeira comercial');
SELECT pg_temp.novo('Máquina de lavar roupa', 'eletrodomesticos');
SELECT pg_temp.novo('Micro-ondas', 'eletrodomesticos');
SELECT pg_temp.novo('Fogão e cooktop', 'eletrodomesticos');
SELECT pg_temp.novo('Lava-louças', 'eletrodomesticos');

-- ===== 6. Segurança eletrônica =====
SELECT pg_temp.fundir('CFTV / Câmeras IP', 'Câmeras IP');
SELECT pg_temp.fundir('CFTV / Câmeras', 'Câmeras Analógicas');
SELECT pg_temp.ren('Câmeras Analógicas', 'Câmeras analógicas (CFTV)');
SELECT pg_temp.fundir('NVR', 'DVR');
SELECT pg_temp.ren('DVR', 'Gravador DVR / NVR');
SELECT pg_temp.ren('Catraca / Leitor Biométrico', 'Catraca e leitor biométrico');
SELECT pg_temp.ren('Monitoramento Remoto', 'Monitoramento remoto');
SELECT pg_temp.ren('Motor de Portão', 'Motor de portão');

-- ===== 7. Informática =====
SELECT pg_temp.ren('Cabeamento Estruturado', 'Cabeamento estruturado');
SELECT pg_temp.ren('Instalação de Software', 'Instalação de programas');
SELECT pg_temp.ren('Manutenção de Computadores', 'Manutenção de computadores');
SELECT pg_temp.ren('Manutenção de Hardware', 'Conserto de peças (hardware)');
SELECT pg_temp.ren('Montagem de Computadores', 'Montagem de computadores');
SELECT pg_temp.ren('Recuperação de Dados', 'Recuperação de dados');
SELECT pg_temp.ren('Remoção de Vírus', 'Remoção de vírus');
SELECT pg_temp.ren('Upgrade de Hardware', 'Upgrade de computador');
SELECT pg_temp.ren('Wi-Fi Empresarial', 'Rede Wi-Fi empresarial');

-- ===== 8. Limpeza e poços =====
SELECT pg_temp.ren('Limpeza caixa d''água', 'Limpeza de caixa d''água');
SELECT pg_temp.ren('Perfuração', 'Perfuração de poço');
SELECT pg_temp.ren('Manutenção e Limpeza', 'Manutenção e limpeza de poço');
SELECT pg_temp.ren('Revestimento e Filtragem', 'Revestimento e filtragem de poço');
SELECT pg_temp.ren('Teste de Vazão e Análise Química', 'Teste de vazão e análise da água');
SELECT pg_temp.ren('Outorga', 'Outorga de uso da água');

\o
-- ===== Resultado =====
SELECT c.ordem, c.nome AS area, count(e.id) AS servicos_ativos
FROM categorias c LEFT JOIN especialidades e ON e.categoria_id = c.id AND e.ativo
WHERE c.ativo GROUP BY c.id ORDER BY c.ordem;
