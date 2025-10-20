import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  Table,
  Badge,
  Toast,
  ToastContainer as RBToastContainer,
} from "react-bootstrap";

/* ------------------- ÍCONES SVG ------------------- */
const icons = {
  plus: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
};

/* ------------------- DADOS MOCK ------------------- */
let MOCK_USERS = [
  {
    id: 1,
    name: "Dr. João Silva",
    email: "profissional@email.com",
    password: "123",
    role: "profissional",
    status: "active",
  },
];

let MOCK_PATIENTS = [
  {
    id: 1,
    name: "Jaeffson Sabino",
    cpf: "123.456.789-00",
    observations: "Hipertenso",
    createdAt: "2025-10-18",
    status: "Ativo",
  },
];

let MOCK_RECORDS = [
  {
    id: 1,
    patientId: 1,
    professionalId: 1,
    referenceDate: "2025-10-18",
    observation: "Pressão controlada",
    status: "Atendido",
  },
];

/* ------------------- TOAST SYSTEM ------------------- */
function useToasts() {
  const [toasts, setToasts] = useState([]);

  const add = (message, variant = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, variant }]);
  };

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return { toasts, add, remove };
}

/* ------------------- LOGIN SCREEN ------------------- */
function LoginScreen({ onLogin, setUsers, addToast, addLog }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleAuth = (e) => {
    e.preventDefault();
    setError("");

    if (isLogin) {
      const user = MOCK_USERS.find(
        (u) => u.email === email && u.password === password
      );
      if (user) {
        onLogin({ ...user, token: `fake-jwt-token-for-${user.id}` });
      } else {
        setError("Credenciais inválidas.");
      }
    } else {
      if (MOCK_USERS.some((u) => u.email === email)) {
        setError("Este e-mail já está em uso.");
        return;
      }
      const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        role: "profissional",
        status: "pending",
      };
      setUsers((prev) => [...prev, newUser]);
      addToast(
        "Cadastro realizado com sucesso! Aguarde aprovação do administrador.",
        "success"
      );
      addLog("Novo Usuário", `${name} cadastrou-se e aguarda aprovação.`);
      setIsLogin(true);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div
        className="card shadow-lg p-4"
        style={{ width: "100%", maxWidth: 400 }}
      >
        <h3 className="text-center text-primary fw-bold mb-1">SysMed</h3>
        <p className="text-center text-muted mb-4">
          Gestão de Pacientes e Medicações
        </p>

        <Form onSubmit={handleAuth}>
          {!isLogin && (
            <Form.Group className="mb-3">
              <Form.Label>Nome Completo</Form.Label>
              <Form.Control
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Senha</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          {error && <div className="text-danger small mb-2">{error}</div>}

          <div className="d-grid gap-2 mb-3">
            <Button variant="primary" type="submit">
              {isLogin ? "Entrar" : "Cadastrar"}
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="link"
              className="p-0"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin
                ? "Não tem uma conta? Cadastre-se"
                : "Já tem uma conta? Faça login"}
            </Button>
          </div>
        </Form>

        <div className="text-center text-muted small mt-4">Versão 1.0.0</div>
      </div>
    </div>
  );
}

/* ------------------- DASHBOARD ------------------- */
function Dashboard({ user, addToast }) {
  return (
    <Container fluid className="p-4">
      <Row className="mb-3 align-items-center">
        <Col>
          <h4>Bem-vindo, {user.name}</h4>
        </Col>
        <Col className="text-end">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => addToast("Sessão encerrada.")}
          >
            Sair
          </Button>
        </Col>
      </Row>

      <Row>
        <Col md={4}>
          <div className="card p-3">
            <h5>Pacientes</h5>
            <ul className="list-group list-group-flush">
              {MOCK_PATIENTS.map((p) => (
                <li key={p.id} className="list-group-item">
                  {p.name} <Badge bg="success">{p.status}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </Col>

        <Col md={8}>
          <div className="card p-3">
            <h5>Registros Recentes</h5>
            <Table bordered hover size="sm">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Data</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RECORDS.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {MOCK_PATIENTS.find((p) => p.id === r.patientId)?.name}
                    </td>
                    <td>{r.referenceDate}</td>
                    <td>
                      <Badge bg="primary">{r.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

/* ------------------- APP ROOT ------------------- */
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(MOCK_USERS);
  const { toasts, add, remove } = useToasts();

  const addLog = (title, msg) => console.log(`[LOG] ${title}: ${msg}`);

  if (!currentUser) {
    return (
      <>
        <LoginScreen
          onLogin={(u) => setCurrentUser(u)}
          setUsers={setUsers}
          addToast={(m) => add(m, "success")}
          addLog={addLog}
        />
        <RBToastContainer position="top-end" className="p-3">
          {toasts.map((t) => (
            <Toast
              key={t.id}
              onClose={() => remove(t.id)}
              show
              delay={3000}
              autohide
              bg={t.variant === "success" ? "success" : "danger"}
            >
              <Toast.Header>
                <strong className="me-auto">
                  {t.variant === "success" ? "Sucesso" : "Erro"}
                </strong>
              </Toast.Header>
              <Toast.Body className="text-white">{t.message}</Toast.Body>
            </Toast>
          ))}
        </RBToastContainer>
      </>
    );
  }

  return (
    <>
      <Dashboard user={currentUser} addToast={(m) => add(m, "success")} />
      <RBToastContainer position="top-end" className="p-3">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            onClose={() => remove(t.id)}
            show
            delay={3000}
            autohide
            bg={t.variant === "success" ? "success" : "danger"}
          >
            <Toast.Header>
              <strong className="me-auto">
                {t.variant === "success" ? "Sucesso" : "Erro"}
              </strong>
            </Toast.Header>
            <Toast.Body className="text-white">{t.message}</Toast.Body>
          </Toast>
        ))}
      </RBToastContainer>
    </>
  );
}
