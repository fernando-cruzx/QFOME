"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";

type UserProfile = {
  name: string;
  email: string;
  phone?: string;
  passwordHash?: string;
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const hashPassword = async (password: string) => {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("Hash de senha indisponivel neste ambiente.");
  }

  const encoded = new TextEncoder().encode(password);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const readStoredUser = (): UserProfile | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const saved = localStorage.getItem("qfome-user");
  if (!saved) {
    return null;
  }

  try {
    const parsed = JSON.parse(saved) as UserProfile;
    if (!parsed?.name || !parsed?.email) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export default function EntrarPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [feedback, setFeedback] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const storedUser = readStoredUser();
    if (!storedUser) {
      setFeedback("Nenhuma conta cadastrada. Crie sua conta para continuar.");
      setTab("signup");
      return;
    }

    if (normalizeEmail(storedUser.email) !== normalizeEmail(loginEmail)) {
      setFeedback("E-mail nao encontrado. Tente novamente ou crie uma nova conta.");
      return;
    }

    if (!loginPassword.trim()) {
      setFeedback("Informe sua senha para entrar.");
      return;
    }

    if (!storedUser.passwordHash) {
      setFeedback("Conta antiga detectada. Crie uma nova conta para ativar login com senha segura.");
      setTab("signup");
      return;
    }

    try {
      const incomingHash = await hashPassword(loginPassword.trim());
      if (incomingHash !== storedUser.passwordHash) {
        setFeedback("Credenciais invalidas. Verifique e-mail e senha.");
        return;
      }

      localStorage.setItem("qfome-user", JSON.stringify(storedUser));
      window.dispatchEvent(new Event("qfome-user-changed"));
      setFeedback("Login realizado. Redirecionando para sua area de cliente...");
      router.push("/cliente");
    } catch {
      setFeedback("Nao foi possivel validar sua senha neste navegador.");
    }
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setFeedback("Preencha nome, e-mail e senha para criar sua conta.");
      return;
    }

    if (signupPassword.trim().length < 6) {
      setFeedback("Use uma senha com pelo menos 6 caracteres.");
      return;
    }

    try {
      const passwordHash = await hashPassword(signupPassword.trim());

      const newUser: UserProfile = {
        name: signupName.trim(),
        email: normalizeEmail(signupEmail),
        phone: signupPhone.trim(),
        passwordHash,
      };

      localStorage.setItem("qfome-user", JSON.stringify(newUser));
      window.dispatchEvent(new Event("qfome-user-changed"));
      setFeedback("Conta criada com sucesso. Redirecionando para sua area de cliente...");
      router.push("/cliente");
    } catch {
      setFeedback("Nao foi possivel criar sua senha neste navegador.");
    }
  };

  return (
    <div className="qfome-shell min-h-screen pb-16 text-[var(--qfome-ink)]">
      <main className="mx-auto w-full max-w-xl px-4 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-[#f0cabd] bg-white px-4 py-2 text-sm font-bold text-[#6a3b32] transition hover:bg-[#fff0e8]"
        >
          <ArrowLeft size={16} />
          Voltar para a home
        </Link>

        <section className="mt-5 rounded-[2rem] border border-[var(--qfome-outline)] bg-[var(--qfome-surface)] p-4 shadow-[0_16px_35px_rgba(121,66,34,0.11)] sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a5e52]">Acesso</p>
          <h1 className="font-display mt-2 text-4xl leading-[0.9] text-[#7d141e] sm:text-6xl">
            Entrar ou criar conta
          </h1>
          <p className="mt-3 text-sm text-[#8a5b50]">
            Faca login para acompanhar pedidos ou crie sua conta para receber ofertas.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-[#efcabc] bg-white p-1">
            <button
              type="button"
              onClick={() => setTab("login")}
              className={`rounded-xl px-3 py-2 text-sm font-black uppercase tracking-[0.1em] transition ${
                tab === "login"
                  ? "bg-[#d72638] text-white"
                  : "text-[#7f473b] hover:bg-[#fff2eb]"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setTab("signup")}
              className={`rounded-xl px-3 py-2 text-sm font-black uppercase tracking-[0.1em] transition ${
                tab === "signup"
                  ? "bg-[#d72638] text-white"
                  : "text-[#7f473b] hover:bg-[#fff2eb]"
              }`}
            >
              Criar conta
            </button>
          </div>

          {tab === "login" ? (
            <form className="mt-5 space-y-3" onSubmit={handleLogin}>
              <label className="flex items-center gap-2 rounded-2xl border border-[#efcabc] bg-white px-3 py-3">
                <Mail size={16} className="text-[#8b5145]" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(event) => {
                    setLoginEmail(event.target.value);
                    setFeedback("");
                  }}
                  placeholder="Seu e-mail"
                  className="w-full bg-transparent text-sm font-semibold text-[#542a24] outline-none placeholder:text-[#b98476]"
                />
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-[#efcabc] bg-white px-3 py-3">
                <LockKeyhole size={16} className="text-[#8b5145]" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(event) => {
                    setLoginPassword(event.target.value);
                    setFeedback("");
                  }}
                  placeholder="Sua senha"
                  className="w-full bg-transparent text-sm font-semibold text-[#542a24] outline-none placeholder:text-[#b98476]"
                />
              </label>
              <div className="flex justify-end">
                <Link
                  href="/recuperar-acesso"
                  className="text-xs font-black uppercase tracking-[0.08em] text-[#c72035] transition hover:text-[#a81a2a]"
                >
                  Esqueceu seu login?
                </Link>
              </div>
              <button
                type="submit"
                className="w-full rounded-2xl bg-[#d72638] px-4 py-3 text-sm font-black uppercase tracking-[0.1em] text-white transition hover:bg-[#a81a2a]"
              >
                Entrar na conta
              </button>
            </form>
          ) : (
            <form className="mt-5 space-y-3" onSubmit={handleSignup}>
              <label className="flex items-center gap-2 rounded-2xl border border-[#efcabc] bg-white px-3 py-3">
                <UserRound size={16} className="text-[#8b5145]" />
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={(event) => {
                    setSignupName(event.target.value);
                    setFeedback("");
                  }}
                  placeholder="Nome completo"
                  className="w-full bg-transparent text-sm font-semibold text-[#542a24] outline-none placeholder:text-[#b98476]"
                />
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-[#efcabc] bg-white px-3 py-3">
                <Mail size={16} className="text-[#8b5145]" />
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(event) => {
                    setSignupEmail(event.target.value);
                    setFeedback("");
                  }}
                  placeholder="Seu melhor e-mail"
                  className="w-full bg-transparent text-sm font-semibold text-[#542a24] outline-none placeholder:text-[#b98476]"
                />
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-[#efcabc] bg-white px-3 py-3">
                <Phone size={16} className="text-[#8b5145]" />
                <input
                  type="tel"
                  value={signupPhone}
                  onChange={(event) => {
                    setSignupPhone(event.target.value);
                    setFeedback("");
                  }}
                  placeholder="Telefone (opcional)"
                  className="w-full bg-transparent text-sm font-semibold text-[#542a24] outline-none placeholder:text-[#b98476]"
                />
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-[#efcabc] bg-white px-3 py-3">
                <LockKeyhole size={16} className="text-[#8b5145]" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={signupPassword}
                  onChange={(event) => {
                    setSignupPassword(event.target.value);
                    setFeedback("");
                  }}
                  placeholder="Crie uma senha"
                  className="w-full bg-transparent text-sm font-semibold text-[#542a24] outline-none placeholder:text-[#b98476]"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-2xl bg-[#d72638] px-4 py-3 text-sm font-black uppercase tracking-[0.1em] text-white transition hover:bg-[#a81a2a]"
              >
                Criar conta
              </button>
            </form>
          )}

          {feedback ? (
            <p className="mt-4 rounded-xl border border-[#efcabc] bg-[#fff4ef] px-3 py-2 text-xs font-semibold text-[#7b3f34]">
              {feedback}
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
