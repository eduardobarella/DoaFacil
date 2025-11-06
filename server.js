import { db } from "./db.js";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";


const app = express();
app.use(express.json());
app.use(cors());

// Teste de conexão com MySQL
try {
  const [result] = await db.query("SELECT 1");
  console.log("✅ Banco conectado com sucesso!");
} catch (err) {
  console.log("❌ Erro ao conectar no banco:", err);
}

// ✅ Buscar doações no banco
app.get("/doacoes", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.id, d.alimento, d.validade, u.nome, u.telefone, u.endereco
      FROM doacoes d
      JOIN usuarios u ON d.usuario_id = u.id
      WHERE d.status = 'disponivel'
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar doações" });
  }
});

// ✅ Cadastro de usuário
app.post("/register", async (req, res) => {
  try {
    const { nome, telefone, endereco, email, senha } = req.body;

    // Criptografar senha
    const hash = await bcrypt.hash(senha, 10);

    await db.query(
      "INSERT INTO usuarios (nome, telefone, endereco, email, senha) VALUES (?, ?, ?, ?, ?)",
      [nome, telefone, endereco, email, hash]
    );

    res.status(201).json({ mensagem: "Usuário cadastrado com sucesso!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao cadastrar usuário" });
  }
});

// ✅ Login do usuário
app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Procurar usuário
    const [rows] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(400).json({ erro: "Usuário não encontrado" });
    }

    const usuario = rows[0];

    // Comparar senha
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: "Senha incorreta" });
    }

    res.json({
      mensagem: "Login realizado com sucesso!",
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    });

  } catch (err) {
    res.status(500).json({ erro: "Erro ao fazer login" });
  }
});

// ✅ Doar: exige usuario_id (usuário logado)
app.post("/doar", async (req, res) => {
  try {
    const { usuario_id, alimento, validade } = req.body;

    if (!usuario_id) {
      return res.status(401).json({ erro: "Faça login para doar." });
    }
    if (!alimento || !validade) {
      return res.status(400).json({ erro: "Informe alimento e validade." });
    }

    await db.query(
      "INSERT INTO doacoes (usuario_id, alimento, validade) VALUES (?, ?, ?)",
      [usuario_id, alimento, validade]
    );

    res.status(201).json({ mensagem: "Doação cadastrada!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao cadastrar doação" });
  }
});



app.listen(3000, () =>
  console.log("Servidor rodando em http://localhost:3000")
);
