require("dotenv").config();
const path = require("path");
const express = require("express");
const pool = require("./db");

const app = express();
app.use(express.json());
app.use("/imagens", express.static(path.join(__dirname, "imagens")));
// ---------- Front-end ----------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ---------- CRUD de tarefas ----------

// Listar todas
app.get("/tarefas", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, titulo, descricao, status, criado_em FROM tarefas ORDER BY status ASC, criado_em DESC",
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar tarefas." });
  }
});

// Criar
app.post("/tarefas", async (req, res) => {
  const { titulo, descricao } = req.body;
  if (!titulo || !titulo.trim()) {
    return res.status(400).json({ erro: "O título é obrigatório." });
  }
  try {
    const [result] = await pool.execute(
      "INSERT INTO tarefas (titulo, descricao) VALUES (?, ?)",
      [titulo.trim(), descricao || null],
    );
    res.status(201).json({
      id: result.insertId,
      titulo: titulo.trim(),
      descricao: descricao || null,
      status: "pendente",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao criar tarefa." });
  }
});

// Atualizar (título, descrição e/ou status)
app.put("/tarefas/:id", async (req, res) => {
  const { titulo, descricao, status } = req.body;
  if (status && !["pendente", "concluida"].includes(status)) {
    return res.status(400).json({ erro: "Status inválido." });
  }
  try {
    const [result] = await pool.execute(
      `UPDATE tarefas
          SET titulo = COALESCE(?, titulo),
              descricao = COALESCE(?, descricao),
              status = COALESCE(?, status)
        WHERE id = ?`,
      [titulo ?? null, descricao ?? null, status ?? null, req.params.id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Tarefa não encontrada." });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao atualizar tarefa." });
  }
});

// Excluir
app.delete("/tarefas/:id", async (req, res) => {
  try {
    const [result] = await pool.execute("DELETE FROM tarefas WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Tarefa não encontrada." });
    }
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao excluir tarefa." });
  }
});

// ---------- Resumo com IA ----------
app.post("/resumo", async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res
      .status(500)
      .json({ erro: "GEMINI_API_KEY não configurada no .env." });
  }

  try {
    const [pendentes] = await pool.query(
      "SELECT titulo, descricao FROM tarefas WHERE status = 'pendente' ORDER BY criado_em ASC",
    );

    if (pendentes.length === 0) {
      return res.json({
        resumo: "Você não tem tarefas pendentes. Aproveite o dia! 🎉",
      });
    }

    const lista = pendentes
      .map(
        (t, i) =>
          `${i + 1}. ${t.titulo}${t.descricao ? ` — ${t.descricao}` : ""}`,
      )
      .join("\n");

    // Modelo principal
    const modelos = [process.env.AI_MODEL || "gemini-3.8-flash"];
    if (process.env.AI_MODEL_FALLBACK)
      modelos.push(process.env.AI_MODEL_FALLBACK);

    const prompt =
      "Você é um assistente de produtividade. Com base nas tarefas pendentes abaixo, " +
      "sugira uma ordem de prioridade e um plano curto para o dia. " +
      "Responda em português, de forma objetiva, em no máximo 8 linhas.\n\n" +
      lista;

    let texto = null;

    for (const modelo of modelos) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;

      // Até 3 tentativas por modelo, com espera crescente
      for (let tentativa = 1; tentativa <= 3; tentativa++) {
        const resposta = await fetch(url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        if (resposta.ok) {
          const dados = await resposta.json();
          texto = dados.candidates?.[0]?.content?.parts?.[0]?.text || null;
          break;
        }

        const detalhe = await resposta.text();
        console.error(
          `Erro da API de IA (${modelo}, tentativa ${tentativa}):`,
          detalhe,
        );

        // Só vale tentar de novo em erros temporários (limite ou sobrecarga)
        if (![429, 500, 503].includes(resposta.status)) break;
        await new Promise((r) => setTimeout(r, tentativa * 2000));
      }

      if (texto) break;
    }

    if (!texto) {
      return res.status(503).json({
        erro: "A IA está sobrecarregada no momento. Tente novamente em alguns minutos.",
      });
    }

    res.json({ resumo: texto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao gerar resumo." });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`),
);
