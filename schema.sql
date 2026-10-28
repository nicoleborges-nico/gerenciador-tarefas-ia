CREATE DATABASE IF NOT EXISTS gerenciador_tarefas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gerenciador_tarefas;

CREATE TABLE IF NOT EXISTS tarefas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT NULL,
  status ENUM('pendente', 'concluida') NOT NULL DEFAULT 'pendente',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
);

-- Dados de exemplo 
INSERT INTO tarefas (titulo, descricao) VALUES
  ('Estudar JavaScript assíncrono', 'Revisar Promises e async/await'),
  ('Finalizar README do projeto', 'Adicionar prints e instruções de instalação'),
  ('Enviar currículo para 3 vagas de estágio', NULL);
