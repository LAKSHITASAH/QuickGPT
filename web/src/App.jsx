import React, { useEffect, useMemo, useRef, useState } from "react";
import { clearSession, getSession, loginUser, signupUser } from "./auth";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function cn(...a) {
  return a.filter(Boolean).join(" ");
}

function LogoIcon() {
  return (
    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-xl shadow-violet-500/20">
      <span className="text-white font-bold text-lg">Q</span>
    </div>
  );
}

function AuthCard({ onAuthed }) {
  const [tab, setTab] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  function submit(e) {
    e.preventDefault();
    setErr("");
    setOk("");

    try {
      if (tab === "signup") {
        const session = signupUser({ name, email, password: pw });
        setOk("Account created successfully!");
        onAuthed(session);
      } else {
        const session = loginUser({ email, password: pw });
        setOk("Login successful!");
        onAuthed(session);
      }
    } catch (ex) {
      setErr(ex?.message || "Error");
    }
  }

  return (
    <div className="min-h-screen bg-[#07060b] text-white flex items-center justify-center px-4">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-1/4 -right-40 h-[520px] w-[520px] rounded-full bg-indigo-500/15 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-7 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <LogoIcon />
          <h1 className="mt-4 text-2xl font-semibold">
            <span className="text-violet-400">User</span> Login
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Welcome back. Please continue.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setErr("");
              setOk("");
            }}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm transition",
              tab === "login"
                ? "border-violet-400/30 bg-violet-500/10"
                : "border-white/10 bg-white/5 hover:bg-white/8"
            )}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => {
              setTab("signup");
              setErr("");
              setOk("");
            }}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm transition",
              tab === "signup"
                ? "border-violet-400/30 bg-violet-500/10"
                : "border-white/10 bg-white/5 hover:bg-white/8"
            )}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          {tab === "signup" && (
            <div>
              <label className="text-xs text-white/70">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500/30"
                placeholder="Type here"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-white/70">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500/30"
              placeholder="Type here"
              type="email"
            />
          </div>

          <div>
            <label className="text-xs text-white/70">Password</label>
            <input
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500/30"
              placeholder="Type here"
              type="password"
            />
          </div>

          {err && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {err}
            </div>
          )}
          {ok && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              {ok}
            </div>
          )}

          <button
            className="w-full rounded-xl py-3 font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 transition"
            type="submit"
          >
            {tab === "signup" ? "Create account" : "Login"}
          </button>

          <div className="text-center text-xs text-white/60">
            {tab === "login" ? (
              <>
                Create an account?{" "}
                <button
                  type="button"
                  className="text-violet-400 hover:underline"
                  onClick={() => setTab("signup")}
                >
                  click here
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-violet-400 hover:underline"
                  onClick={() => setTab("login")}
                >
                  click here
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Bubble({ role, children, images, onOpenImage }) {
  const isUser = role === "user";
  return (
    <div className={cn("w-full flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm md:text-[15px] leading-relaxed",
          isUser
            ? "bg-violet-500/20 border border-violet-400/20 text-white"
            : "bg-white/5 border border-white/10 text-white"
        )}
      >
        {/* Image thumbnails inside bubble */}
        {Array.isArray(images) && images.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onOpenImage?.(images, idx)}
                className="group relative h-20 w-20 rounded-xl overflow-hidden border border-white/10 bg-white/5"
                title="Open image"
              >
                <img
                  src={img.dataUrl}
                  alt={img.name || "image"}
                  className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-black/20" />
              </button>
            ))}
          </div>
        )}

        <div className="prose prose-invert max-w-none prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-code:text-violet-200">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {String(children)}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(() => getSession());
  const [dark, setDark] = useState(true);

  const [chats, setChats] = useState(() => [
    {
      id: crypto.randomUUID(),
      title: "New Chat",
      updatedAt: Date.now(),
      messages: [{ role: "assistant", content: "Hi 👋 Ask me anything." }],
    },
  ]);
  const [activeId, setActiveId] = useState(chats[0].id);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeId),
    [chats, activeId]
  );
  const [search, setSearch] = useState("");
  const filteredChats = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => c.title.toLowerCase().includes(q));
  }, [chats, search]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [attachments, setAttachments] = useState([]);

  const fileRef = useRef(null);
  const endRef = useRef(null);

  // ✅ Lightbox state now supports multi-image navigation
  // { images: [{name,dataUrl}, ...], index: number } | null
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages?.length, loading]);

  const lightboxImages = lightbox?.images || [];
  const lightboxIndex = lightbox?.index ?? 0;
  const lightboxCurrent = lightboxImages[lightboxIndex] || null;

  function goPrev() {
    if (!lightbox) return;
    setLightbox((prev) => {
      if (!prev) return prev;
      const n = prev.images?.length || 0;
      if (n <= 1) return prev;
      const nextIndex = Math.max(0, prev.index - 1);
      return { ...prev, index: nextIndex };
    });
  }

  function goNext() {
    if (!lightbox) return;
    setLightbox((prev) => {
      if (!prev) return prev;
      const n = prev.images?.length || 0;
      if (n <= 1) return prev;
      const nextIndex = Math.min(n - 1, prev.index + 1);
      return { ...prev, index: nextIndex };
    });
  }

  // ✅ close on ESC + navigate with ArrowLeft/ArrowRight
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    if (lightbox) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox]);

  function newChat() {
    const c = {
      id: crypto.randomUUID(),
      title: "New Chat",
      updatedAt: Date.now(),
      messages: [{ role: "assistant", content: "Ask me anything." }],
    };
    setChats((prev) => [c, ...prev]);
    setActiveId(c.id);
    setAttachments([]);
  }

  function updateActiveChat(updater) {
    setChats((prev) => prev.map((c) => (c.id === activeId ? updater(c) : c)));
  }

  function deleteChat(id) {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id);

      if (id === activeId) {
        if (next.length > 0) setActiveId(next[0].id);
        else {
          const c = {
            id: crypto.randomUUID(),
            title: "New Chat",
            updatedAt: Date.now(),
            messages: [{ role: "assistant", content: "Hi 👋 Ask me anything." }],
          };
          setActiveId(c.id);
          return [c];
        }
      }
      return next;
    });
  }

  async function handlePickImages(e) {
    // ✅ supports adding MANY images (already multiple)
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const readAsDataUrl = (file) =>
      new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(file);
      });

    const loaded = [];
    for (const f of files) {
      try {
        const dataUrl = await readAsDataUrl(f);
        loaded.push({ name: f.name, dataUrl });
      } catch {}
    }

    setAttachments((prev) => [...prev, ...loaded]);
    e.target.value = "";
  }

  function removeAttachment(i) {
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
  }

  function clearAttachments() {
    setAttachments([]);
  }

  function toApiMessages(messages) {
    return (messages || []).map((m) => {
      const atts = m.attachments || [];
      if (atts.length > 0) {
        const parts = [];
        parts.push({ type: "text", text: m.content || "Describe this image." });
        for (const a of atts) {
          parts.push({ type: "image_url", image_url: { url: a.dataUrl } });
        }
        return { role: m.role, content: parts };
      }
      return { role: m.role, content: m.content };
    });
  }

  async function send() {
    const text = input.trim();
    const hasPics = attachments.length > 0;

    if ((!text && !hasPics) || loading || !activeChat) return;

    const uiText = text || (hasPics ? "Describe this image." : "");
    const userMsg = { role: "user", content: uiText, attachments: attachments };

    setInput("");
    setLoading(true);

    updateActiveChat((c) => ({
      ...c,
      updatedAt: Date.now(),
      title:
        c.title === "New Chat"
          ? text
            ? text.slice(0, 28)
            : "Image chat"
          : c.title,
      messages: [...c.messages, userMsg],
    }));

    setAttachments([]);

    try {
      const nextMessagesInternal = [...activeChat.messages, userMsg];
      const nextMessagesForApi = toApiMessages(nextMessagesInternal);

      // ✅ FIXED: single-line URL string (no newline)
      const res = await fetch("http://localhost:8080/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessagesForApi }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t);
      }

      updateActiveChat((c) => ({
        ...c,
        updatedAt: Date.now(),
        messages: [...c.messages, { role: "assistant", content: "" }],
      }));

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const chunk of parts) {
          const lines = chunk.split("\n");
          const eventLine = lines.find((l) => l.startsWith("event:"));
          const dataLine = lines.find((l) => l.startsWith("data:"));

          const ev = eventLine ? eventLine.replace("event:", "").trim() : "";
          const data = dataLine
            ? JSON.parse(dataLine.replace("data:", "").trim())
            : null;

          if (ev === "delta" && data?.text) {
            updateActiveChat((c) => {
              const msgs = [...c.messages];
              const last = msgs[msgs.length - 1];
              msgs[msgs.length - 1] = {
                ...last,
                content: (last.content || "") + data.text,
              };
              return { ...c, updatedAt: Date.now(), messages: msgs };
            });
          }

          if (ev === "error") throw new Error(data?.message || "Stream error");
        }
      }
    } catch (e) {
      updateActiveChat((c) => ({
        ...c,
        updatedAt: Date.now(),
        messages: [
          ...c.messages,
          {
            role: "assistant",
            content:
              "⚠️ Backend not running / not connected.\n\n" +
              (e?.message || ""),
          },
        ],
      }));
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return <AuthCard onAuthed={(s) => setSession(s)} />;
  }

  return (
    <div
      className={cn(
        "h-screen w-screen overflow-hidden",
        dark ? "bg-[#07060b]" : "bg-zinc-50"
      )}
    >
      <div className={cn("pointer-events-none fixed inset-0", dark ? "" : "hidden")}>
        <div className="absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-1/4 -right-40 h-[520px] w-[520px] rounded-full bg-indigo-500/15 blur-[120px]" />
      </div>

      {/* ✅ Lightbox (with left/right navigation for multiple images) */}
      {lightbox && lightboxCurrent && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={() => setLightbox(null)}
        >
          <div
            className="relative max-w-5xl w-full"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 h-10 w-10 rounded-full bg-black/70 border border-white/10 text-white flex items-center justify-center hover:bg-black/80"
              title="Close"
            >
              ✕
            </button>

            {/* Left arrow */}
            {lightboxImages.length > 1 && (
              <button
                type="button"
                onClick={goPrev}
                disabled={lightboxIndex === 0}
                className={cn(
                  "absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full border flex items-center justify-center text-white",
                  "bg-black/60 border-white/10 hover:bg-black/75",
                  lightboxIndex === 0 ? "opacity-30 cursor-not-allowed" : ""
                )}
                title="Previous (←)"
              >
                ←
              </button>
            )}

            {/* Right arrow */}
            {lightboxImages.length > 1 && (
              <button
                type="button"
                onClick={goNext}
                disabled={lightboxIndex === lightboxImages.length - 1}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full border flex items-center justify-center text-white",
                  "bg-black/60 border-white/10 hover:bg-black/75",
                  lightboxIndex === lightboxImages.length - 1
                    ? "opacity-30 cursor-not-allowed"
                    : ""
                )}
                title="Next (→)"
              >
                →
              </button>
            )}

            <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40">
              <img
                src={lightboxCurrent.dataUrl}
                alt={lightboxCurrent.name || "image"}
                className="w-full max-h-[82vh] object-contain bg-black"
              />
            </div>

            <div className="mt-3 text-center text-xs text-white/70">
              {lightboxCurrent.name ? lightboxCurrent.name : "Image"}{" "}
              {lightboxImages.length > 1 && (
                <>
                  • {lightboxIndex + 1}/{lightboxImages.length} • Use ← → to
                  navigate
                </>
              )}
              {" • Press ESC to close"}
            </div>
          </div>
        </div>
      )}

      <div className={cn("h-full w-full flex", dark ? "text-white" : "text-zinc-900")}>
        <aside
          className={cn(
            "w-[320px] hidden md:flex flex-col border-r",
            dark ? "border-white/10 bg-white/[0.03]" : "border-zinc-200 bg-white"
          )}
        >
          <div className="p-5 flex items-center gap-3">
            <LogoIcon />
            <div className="leading-tight">
              <div className="font-semibold text-lg">QuickGPT</div>
              <div className={cn("text-xs", dark ? "text-white/60" : "text-zinc-500")}>
                Intelligent AI Assistant
              </div>
            </div>
          </div>

          <div className="px-5">
            <button
              onClick={newChat}
              className={cn(
                "w-full rounded-xl py-3 font-medium flex items-center justify-center gap-2 shadow-lg",
                "bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95"
              )}
            >
              + New Chat
            </button>

            <div
              className={cn(
                "mt-4 rounded-xl border px-3 py-2 flex items-center gap-2",
                dark ? "border-white/10 bg-white/5" : "border-zinc-200 bg-zinc-50"
              )}
            >
              <span className={cn("text-xs", dark ? "text-white/60" : "text-zinc-500")}>
                🔎
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(
                  "w-full bg-transparent outline-none text-sm",
                  dark ? "placeholder:text-white/40" : "placeholder:text-zinc-400"
                )}
                placeholder="Search conversations"
              />
            </div>
          </div>

          <div className="px-5 mt-5">
            <div className={cn("text-sm font-semibold mb-3", dark ? "text-white/80" : "text-zinc-700")}>
              Recent Chats
            </div>

            <div className="space-y-2">
              {filteredChats.map((c) => (
                <div key={c.id} className="relative">
                  <button
                    onClick={() => setActiveId(c.id)}
                    className={cn(
                      "w-full text-left rounded-xl px-3 py-3 border transition pr-10",
                      c.id === activeId
                        ? "border-violet-400/30 bg-violet-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/7"
                    )}
                  >
                    <div className="text-sm font-medium">{c.title}</div>
                    <div className={cn("text-xs mt-1", dark ? "text-white/50" : "text-zinc-500")}>
                      {Math.max(1, Math.round((Date.now() - c.updatedAt) / 60000))} minutes ago
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(c.id);
                    }}
                    className={cn(
                      "absolute right-2 top-2 h-8 w-8 rounded-lg border flex items-center justify-center",
                      "border-white/10 bg-white/5 hover:bg-white/10 text-white/70"
                    )}
                    title="Delete chat"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto p-5 space-y-3">
            <div className={cn("rounded-xl border p-3", dark ? "border-white/10 bg-white/5" : "border-zinc-200 bg-white")}>
              <div className="text-sm font-medium">Logged in as</div>
              <div className={cn("text-xs mt-1", dark ? "text-white/70" : "text-zinc-600")}>
                {session.name} • {session.email}
              </div>
            </div>

            <button
              onClick={() => setDark(!dark)}
              className="w-full rounded-xl py-3 font-medium border border-white/10 bg-white/5 hover:bg-white/10"
            >
              Toggle Theme
            </button>

            <button
              onClick={() => {
                clearSession();
                setSession(null);
              }}
              className="w-full rounded-xl py-3 font-medium border border-white/10 bg-white/5 hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col">
          <header
            className={cn(
              "h-14 flex items-center justify-between px-4 border-b",
              dark ? "border-white/10 bg-white/[0.02]" : "border-zinc-200 bg-white"
            )}
          >
            <div className="font-semibold">Chat</div>
            <button
              onClick={newChat}
              className={cn(
                "md:hidden rounded-xl px-3 py-2 text-sm border",
                dark ? "border-white/10 bg-white/5" : "border-zinc-200 bg-zinc-50"
              )}
            >
              + New chat
            </button>
          </header>

          <section className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-4xl px-4 py-8">
              {activeChat?.messages?.length === 1 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <LogoIcon />
                  <div className="mt-4 text-sm text-white/70">
                    QuickGPT • Intelligent AI Assistant
                  </div>
                  <div className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-white">
                    Ask me anything.
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {activeChat?.messages?.map((m, i) => (
                  <Bubble
                    key={i}
                    role={m.role}
                    images={m.attachments}
                    onOpenImage={(imgs, idx) => setLightbox({ images: imgs, index: idx })}
                  >
                    {m.content}
                  </Bubble>
                ))}
                {loading && (
                  <Bubble role="assistant">
                    <span className="text-white/60">Thinking…</span>
                  </Bubble>
                )}
                <div ref={endRef} />
              </div>
            </div>
          </section>

          <footer
            className={cn(
              "border-t",
              dark ? "border-white/10 bg-white/[0.02]" : "border-zinc-200 bg-white"
            )}
          >
            <div className="mx-auto w-full max-w-4xl px-4 py-4">
              {attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachments.map((a, idx) => (
                    <div
                      key={idx}
                      className="group relative h-16 w-16 rounded-xl overflow-hidden border border-white/10 bg-white/5"
                      title={a.name}
                    >
                      <button
                        type="button"
                        onClick={() => setLightbox({ images: attachments, index: idx })}
                        className="h-full w-full"
                        title="Open image"
                      >
                        <img
                          src={a.dataUrl}
                          alt={a.name}
                          className="h-full w-full object-cover"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white text-xs hidden group-hover:flex items-center justify-center"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={clearAttachments}
                    className="h-16 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white/80"
                    title="Remove all"
                  >
                    Clear
                  </button>
                </div>
              )}

              <div
                className={cn(
                  "rounded-2xl border flex items-center gap-3 px-3 py-3",
                  dark ? "border-violet-400/20 bg-violet-500/10" : "border-zinc-200 bg-zinc-50"
                )}
              >
                <button
                  className={cn(
                    "text-sm px-3 py-2 rounded-xl border",
                    dark
                      ? "border-white/10 bg-white/5 text-white/90"
                      : "border-zinc-200 bg-white text-zinc-800"
                  )}
                  type="button"
                  title="Text mode"
                >
                  Text ▾
                </button>

                <button
                  className={cn(
                    "text-sm px-3 py-2 rounded-xl border",
                    dark
                      ? "border-white/10 bg-white/5 text-white/90 hover:bg-white/10"
                      : "border-zinc-200 bg-white text-zinc-800"
                  )}
                  type="button"
                  title="Attach images"
                  onClick={() => fileRef.current?.click()}
                >
                  🖼
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePickImages}
                  className="hidden"
                />

                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                  placeholder={
                    attachments.length > 0
                      ? "Describe these images… (or ask a question)"
                      : "Type your prompt here..."
                  }
                  className={cn(
                    "flex-1 bg-transparent outline-none text-sm md:text-base",
                    dark ? "placeholder:text-white/40" : "placeholder:text-zinc-400"
                  )}
                />

                <button
                  onClick={send}
                  disabled={loading || (!input.trim() && attachments.length === 0)}
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center transition",
                    loading || (!input.trim() && attachments.length === 0)
                      ? "bg-white/10 text-white/30"
                      : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-95"
                  )}
                  title="Send"
                >
                  ➤
                </button>
              </div>

              <div className={cn("mt-2 text-xs", dark ? "text-white/40" : "text-zinc-500")}>
                Enter to send • Click images to preview • Use ← → in preview • After login/signup you are redirected automatically ✅
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}