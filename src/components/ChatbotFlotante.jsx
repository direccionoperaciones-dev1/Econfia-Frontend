// src/components/ChatbotFlotante.jsx
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Phone, Loader2 } from "lucide-react";
import soporteService from "../services/soporteService";

const WHATSAPP_NUMBER = "573054226582";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20ECONFIA`;
const CHATBOT_BEAR_IMAGE = "/img/chatbot-oso-econfia.png";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Sugerencias para usuarios autenticados
const SUGERENCIAS_USUARIO = [
	"¿Qué listas debo consultar según mi sector?",
	"¿Qué son las listas restrictivas?",
	"¿Qué es SARLAFT?",
	"¿Cómo descargo mi PDF?"
];

// Sugerencias para visitantes sin sesión
const SUGERENCIAS_NO_USUARIO = [
	"¿Qué son las listas restrictivas?",
	"¿Qué es ECONFIA?",
	"¿Qué es una PEP?",
	"¿Cuáles son los planes?"
];

// Quita acentos y normaliza para comparar de forma flexible
const normalizar = (texto) =>
	String(texto || "")
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "");

// Render ligero de formato (negritas y viñetas) para que las respuestas de la IA
// se vean bonitas en la burbuja, sin los "palitos" de tabla ni los asteriscos.
const renderInline = (text) =>
	String(text).split(/(\*\*[^*]+\*\*)/g).map((p, i) => {
		const m = p.match(/^\*\*([^*]+)\*\*$/);
		return m ? <strong key={i}>{m[1]}</strong> : <React.Fragment key={i}>{p}</React.Fragment>;
	});

const renderMarkdownLite = (texto) => {
	const lineas = String(texto || "").split("\n");
	const out = [];
	let items = [];
	const flush = (key) => {
		if (items.length) {
			out.push(<ul key={`ul-${key}`} className="list-disc pl-4 space-y-0.5 my-1">{items}</ul>);
			items = [];
		}
	};
	lineas.forEach((linea, i) => {
		const sinPalitos = linea.replace(/\|/g, " ").trimEnd();
		const t = sinPalitos.trim();
		if (!t) { flush(i); return; }
		if (/^[-\s]+$/.test(t)) return;               // separador de tabla "---" -> se ignora
		const vineta = t.match(/^[-*]\s+(.*)/);
		if (vineta) { items.push(<li key={`li-${i}`}>{renderInline(vineta[1])}</li>); return; }
		flush(i);
		const titulo = t.match(/^#{1,6}\s+(.*)/);
		if (titulo) { out.push(<p key={i} className="font-bold mt-1">{renderInline(titulo[1])}</p>); return; }
		out.push(<p key={i} className="my-0.5">{renderInline(t)}</p>);
	});
	flush("end");
	return out;
};

// Base de conocimientos para respuestas automáticas
const KNOWLEDGE_BASE = [
	// ── Ayuda / general ───────────────────────────────────────────────
	{
		palabras_clave: ["que puedo preguntar", "preguntas", "ayuda", "opciones", "temas", "que sabes", "que haces"],
		respuesta: "Soy el asistente de ECONFIA. Puedo explicarte temas de cumplimiento como:\n• Listas restrictivas (qué son, para qué sirven, por qué importan)\n• Tipos de listas: OFAC, ONU, Unión Europea, Interpol, Lista Clinton\n• SARLAFT / SAGRILAFT y LA/FT\n• Debida diligencia (KYC) y PEP\n• Antecedentes: Procuraduría, Contraloría, Policía, Rama Judicial\n\nTambién te ayudo con planes, reportes PDF, consultas masivas, errores y soporte. ¿Sobre qué tema quieres saber?"
	},
	// ── LISTAS RESTRICTIVAS ───────────────────────────────────────────
	{
		palabras_clave: ["que son las listas restrictivas", "que es una lista restrictiva", "lista restrictiva", "listas restrictivas", "listas de control", "listas vinculantes"],
		respuesta: "Las listas restrictivas son bases de datos —nacionales e internacionales— donde figuran personas y empresas señaladas por estar relacionadas con delitos como lavado de activos, financiación del terrorismo, narcotráfico, corrupción o sanciones económicas.\n\nConsultarlas permite saber si alguien con quien vas a hacer negocios representa un riesgo legal o reputacional. En ECONFIA validamos a una persona o empresa contra muchas de estas listas al mismo tiempo."
	},
	{
		palabras_clave: ["para que sirven las listas", "para que sirve una lista restrictiva", "para que sirven", "utilidad de las listas", "para que funcionan las listas", "para que funcionan"],
		respuesta: "Las listas restrictivas sirven para:\n• Prevenir el lavado de activos y la financiación del terrorismo (LA/FT).\n• Evitar vincular a tu empresa con personas sancionadas o investigadas.\n• Cumplir la ley (SARLAFT/SAGRILAFT) y exigencias de bancos y aliados.\n• Proteger tu reputación y evitar multas o bloqueos.\n\nEn pocas palabras: te ayudan a 'conocer con quién haces negocios' antes de firmar."
	},
	{
		palabras_clave: ["por que son importantes", "importancia de las listas", "por que importan", "por que es importante consultar", "riesgo de no consultar"],
		respuesta: "Son importantes porque vincularte con una persona o empresa en una lista restrictiva puede traer:\n• Sanciones y multas de los entes de control.\n• Bloqueo de cuentas o pérdida de relaciones bancarias.\n• Daño reputacional difícil de recuperar.\n• Responsabilidad legal por no hacer la debida diligencia.\n\nConsultarlas es una medida preventiva: detectas el riesgo antes de que se convierta en un problema."
	},
	{
		palabras_clave: ["tipos de listas", "que listas existen", "cuales listas", "ofac", "onu", "union europea", "interpol", "lista clinton", "clinton", "lista vinculante", "lista informativa"],
		respuesta: "Existen muchas listas; las principales son:\n• OFAC (Lista Clinton) – Tesoro de EE. UU., sanciones económicas.\n• ONU – Consejo de Seguridad, terrorismo y sanciones.\n• Unión Europea – sanciones de la UE.\n• Interpol – personas buscadas internacionalmente.\n• Listas nacionales: Procuraduría, Contraloría, Policía, Rama Judicial.\n\nSe dividen en vinculantes (de obligatorio cumplimiento) e informativas (de gestión de riesgo). ECONFIA consulta tanto listas nacionales como internacionales."
	},
	// ── SARLAFT / LAFT ────────────────────────────────────────────────
	{
		palabras_clave: ["sarlaft", "sagrilaft", "laft", "la/ft", "lavado de activos", "financiacion del terrorismo", "que es el lavado"],
		respuesta: "SARLAFT (y SAGRILAFT para el sector real) es el Sistema de Administración del Riesgo de Lavado de Activos y Financiación del Terrorismo. Obliga a las empresas a identificar a sus clientes, evaluar riesgos y reportar operaciones sospechosas.\n\nLavado de activos = dar apariencia legal a dinero de origen ilícito. Consultar listas restrictivas y hacer debida diligencia son pasos clave para cumplir SARLAFT/SAGRILAFT."
	},
	// ── DEBIDA DILIGENCIA / KYC ───────────────────────────────────────
	{
		palabras_clave: ["debida diligencia", "kyc", "conoce a tu cliente", "conocer al cliente", "verificacion de identidad", "validar identidad"],
		respuesta: "La debida diligencia (o KYC, 'Conoce a tu Cliente') es el proceso de verificar la identidad y los antecedentes de una persona o empresa antes de hacer negocios con ella.\n\nIncluye: validar el documento, confirmar que está vivo/activo, revisar listas restrictivas y antecedentes. ECONFIA automatiza este proceso consultando decenas de fuentes oficiales en una sola búsqueda."
	},
	// ── PEP ───────────────────────────────────────────────────────────
	{
		palabras_clave: ["pep", "persona expuesta", "personas expuestas politicamente", "politicamente expuesta"],
		respuesta: "Una PEP es una Persona Expuesta Políticamente: alguien que ocupa o ocupó un cargo público relevante (y sus allegados). No es algo negativo en sí mismo, pero implica mayor riesgo de corrupción o conflicto de interés, por lo que la ley exige una debida diligencia reforzada antes de vincularla."
	},
	// ── ANTECEDENTES / FUENTES ────────────────────────────────────────
	{
		palabras_clave: ["antecedentes", "procuraduria", "contraloria", "policia", "rama judicial", "que fuentes", "que consulta econfia", "fuentes oficiales"],
		respuesta: "ECONFIA consulta antecedentes y registros en fuentes oficiales como:\n• Procuraduría (antecedentes disciplinarios)\n• Contraloría (responsabilidad fiscal)\n• Policía (antecedentes judiciales)\n• Rama Judicial (procesos)\n• Registraduría/ADRES (identidad y afiliación)\n• Listas restrictivas nacionales e internacionales.\n\nTodo en una sola consulta consolidada en un reporte."
	},
	// ── ECONFIA / producto ────────────────────────────────────────────
	{
		palabras_clave: ["que es econfia", "econfia", "plataforma", "para que sirve econfia", "que hace econfia"],
		respuesta: "ECONFIA es una plataforma de validación de identidad, antecedentes y listas restrictivas en Colombia. Consulta registros de Registraduría, ADRES, Policía, Procuraduría, Contraloría, Rama Judicial y listas nacionales e internacionales, de forma rápida, segura y consolidada en un reporte."
	},
	{
		palabras_clave: ["como me registro", "crear cuenta", "registrarme", "registro", "abrir cuenta"],
		respuesta: "Para registrarte haz clic en 'Crear cuenta' en la página principal e ingresa tu correo y datos básicos. Al verificar tu correo podrás adquirir un plan y empezar a consultar."
	},
	{
		palabras_clave: ["precio", "costo", "pagar", "tarifa", "plan", "planes", "cuanto cuesta", "valor"],
		respuesta: "Tenemos planes flexibles:\n• Por consulta: pagas solo por lo que usas.\n• Plan mensual: consultas según tu paquete.\n\nPara precios exactos o un asesor, escríbenos por WhatsApp al +57 305 422 6582."
	},
	{
		palabras_clave: ["mas informacion", "mas info", "asesor", "contactar", "hablar", "whatsapp", "telefono"],
		respuesta: "Con gusto. Escríbenos por WhatsApp al +57 305 422 6582 y un asesor te responderá de inmediato."
	},
	{
		palabras_clave: ["api", "integracion", "conectar", "sistema", "webhook"],
		respuesta: "Sí, ofrecemos integración por API REST y webhooks para conectar ECONFIA con tus sistemas. ¿Quieres que un asesor te comparta la documentación?"
	},
	{
		palabras_clave: ["seguridad", "datos", "privacidad", "encriptacion", "habeas data"],
		respuesta: "Protegemos tu información con cifrado, controles de acceso y cumplimiento de la normativa de tratamiento de datos (Habeas Data). Tus consultas y reportes son confidenciales."
	},
	{
		palabras_clave: ["error", "bug", "no funciona", "problema", "falla", "no carga"],
		respuesta: "Lamento el inconveniente. Cuéntame qué consulta hiciste y qué mensaje aparece. Si lo prefieres, puedo abrir un ticket con soporte técnico para que un agente lo revise."
	},
	{
		palabras_clave: ["factura", "recibo", "comprobante", "facturacion"],
		respuesta: "Las facturas se envían por email. Si no la recibiste, puedo conectarte con el equipo de facturación."
	},
	{
		palabras_clave: ["pdf", "reporte", "descargar", "informe", "consolidado"],
		respuesta: "Puedes descargar el reporte PDF desde la vista de resultados o desde la ficha de la consulta. Si el botón falla, dime qué consulta hiciste y qué error aparece."
	},
	{
		palabras_clave: ["masiva", "masivas", "excel", "lote", "archivo", "varios", "plantilla"],
		respuesta: "Las consultas masivas procesan muchos registros desde un archivo (plantilla Excel). Puedo orientarte con la plantilla, los errores de carga o el estado del procesamiento."
	},
	{
		palabras_clave: ["validacion", "busqueda", "consulta", "resultado", "como consulto"],
		respuesta: "Para consultar, ingresa el documento de la persona o empresa y elige las fuentes/listas a revisar. ECONFIA te entrega un reporte consolidado. ¿Quieres saber cómo interpretar los resultados?"
	},
];

// Saludos simples
const SALUDOS = ["hola", "buenas", "buenos dias", "buenas tardes", "buenas noches", "hey", "que tal"];

// Respuesta genérica de ayuda (cuando no hay match ni IA disponible)
const RESPUESTA_GENERICA = "Buena pregunta. Puedo ayudarte con temas como: qué son las listas restrictivas y para qué sirven, SARLAFT/SAGRILAFT, debida diligencia (KYC), PEP, antecedentes (Procuraduría, Contraloría, Policía, Rama Judicial), o con planes, reportes y soporte. ¿Sobre cuál quieres que te explique? También puedes hablar con un asesor por WhatsApp.";

export default function ChatbotFlotante() {
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState([
		{
			id: 1,
			texto: "Hola. Soy el asistente de ECONFIA 🐻‍❄️\n\nPuedo explicarte sobre listas restrictivas, SARLAFT, debida diligencia, PEP y antecedentes, además de ayudarte con planes, reportes, consultas o soporte técnico. ¿Qué quieres saber?",
			sender: "bot",
			timestamp: new Date()
		}
	]);
	const [inputValue, setInputValue] = useState("");
	const [isEscalated, setIsEscalated] = useState(false);
	const [ticketPk, setTicketPk] = useState(null);
	const [ticketCode, setTicketCode] = useState(null);
	const [isSending, setIsSending] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const messagesEndRef = useRef(null);

	// Detectar si hay sesión activa
	useEffect(() => {
		const token = localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("access");
		setIsAuthenticated(!!token);
	}, [isOpen]);

	const sugerencias = isAuthenticated ? SUGERENCIAS_USUARIO : SUGERENCIAS_NO_USUARIO;

	// Auto-scroll al último mensaje
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Función para encontrar respuesta automática.
	// Normaliza (sin acentos) y elige la entrada con MÁS coincidencias de palabras
	// clave, para acertar aunque la pregunta esté escrita de forma distinta.
	// Busca en la base de conocimientos. Devuelve { respuesta, puntaje } para que
	// quien llama decida: si puntaje=0 (sin match claro) y hay sesión, se consulta la IA.
	const buscarEnKB = (texto) => {
		const t = normalizar(texto);

		// Saludo simple (match fuerte, no necesita IA)
		if (SALUDOS.some((s) => t === s || t.startsWith(s + " ")) && t.length <= 25) {
			return {
				puntaje: 10,
				respuesta: "¡Hola! Soy el asistente de ECONFIA. Puedo explicarte sobre listas restrictivas, SARLAFT, debida diligencia, PEP, antecedentes y también ayudarte con planes, reportes o soporte. ¿Qué necesitas saber?",
			};
		}

		let mejor = null;
		let mejorPuntaje = 0;

		for (const kb of KNOWLEDGE_BASE) {
			let puntaje = 0;
			for (const palabra of kb.palabras_clave) {
				const p = normalizar(palabra);
				if (!p) continue;
				if (t.includes(p)) {
					// Frases largas valen más que palabras sueltas
					puntaje += p.includes(" ") ? 3 : 1;
				}
			}
			if (puntaje > mejorPuntaje) {
				mejorPuntaje = puntaje;
				mejor = kb;
			}
		}

		if (mejor && mejorPuntaje > 0) return { puntaje: mejorPuntaje, respuesta: mejor.respuesta };

		return { puntaje: 0, respuesta: RESPUESTA_GENERICA };
	};

	// Consulta a la IA (Gemini) por el backend. Solo usuarios con sesión.
	const preguntarIA = async (texto) => {
		const token = localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("access");
		const historial = messages.slice(-8).map((m) => ({
			rol: m.sender === "user" ? "user" : "assistant",
			texto: m.texto,
		}));
		const res = await fetch(`${API_URL}/api/chatbot/`, {
			method: "POST",
			headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
			body: JSON.stringify({ mensaje: texto, historial }),
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok) {
			// Si el backend manda detalle de Gemini, lo mostramos para diagnosticar.
			if (data.detalle) throw new Error(`${data.error || "IA no disponible"} (${data.detalle})`);
			throw new Error(data.error || "IA no disponible");
		}
		return data.respuesta;
	};

	// Enviar mensaje del usuario
	const handleSendMessage = async () => {
		const texto = inputValue.trim();
		if (!texto || isSending) return;

		const newUserMessage = {
			id: messages.length + 1,
			texto,
			sender: "user",
			timestamp: new Date()
		};

		setMessages(prev => [...prev, newUserMessage]);
		setInputValue("");

		if (isEscalated && ticketPk) {
			setIsSending(true);
			try {
				await soporteService.agregarMensaje(ticketPk, texto);
			} catch (error) {
				setMessages(prev => [
					...prev,
					{
						id: Date.now(),
						texto: "No fue posible enviar el mensaje al ticket. Intenta nuevamente en unos segundos.",
						sender: "bot",
						timestamp: new Date()
					}
				]);
			} finally {
				setIsSending(false);
			}
		} else {
			const kb = buscarEnKB(texto);
			// Solo usamos la base de conocimientos cuando el match es FUERTE (una frase
			// completa, puntaje >= 3). Palabras sueltas (consulta/listas/fuentes) NO cuentan
			// como match fuerte y se delegan a la IA para una respuesta real y adaptada.
			const matchFuerte = kb.puntaje >= 3;
			if (matchFuerte || !isAuthenticated) {
				setTimeout(() => {
					setMessages(prev => [...prev, {
						id: Date.now(), texto: kb.respuesta, sender: "bot", timestamp: new Date(),
					}]);
				}, 400);
			} else {
				// Sin match fuerte y con sesión: preguntar a la IA.
				setIsSending(true);
				try {
					const respuestaIA = await preguntarIA(texto);
					setMessages(prev => [...prev, {
						id: Date.now(), texto: respuestaIA, sender: "bot", timestamp: new Date(),
					}]);
				} catch (e) {
					// Fallback: si el error es de cara al usuario (ej. límite diario) lo mostramos;
					// si no, la respuesta genérica de ayuda (NO un match débil equivocado).
					const esMensajeUsuario = e && e.message && e.message !== "IA no disponible";
					setMessages(prev => [...prev, {
						id: Date.now(),
						texto: esMensajeUsuario ? e.message : RESPUESTA_GENERICA,
						sender: "bot", timestamp: new Date(),
					}]);
				} finally {
					setIsSending(false);
				}
			}
		}
	};

	// Escalar a soporte técnico
	const handleEscalar = async () => {
		if (isSending) return;
		setIsSending(true);

		const descripcion = messages
			.map((msg) => `${msg.sender === "user" ? "Usuario" : "Asistente"}: ${msg.texto}`)
			.join("\n");

		try {
			const ticket = await soporteService.crearTicket(
				"Soporte técnico solicitado desde el chat",
				descripcion || "El usuario solicitó soporte técnico desde el chat.",
				"tecnico",
				"media"
			);

			setTicketPk(ticket.id);
			setTicketCode(ticket.ticket_id);
			setIsEscalated(true);

			setMessages(prev => [
				...prev,
				{
					id: Date.now(),
					texto: `Ticket creado: ${ticket.ticket_id}\n\nUn agente de soporte podrá ver esta conversación y responder desde el panel administrativo.`,
					sender: "bot",
					timestamp: new Date()
				}
			]);
		} catch (error) {
			setMessages(prev => [
				...prev,
				{
					id: Date.now(),
					texto: "No fue posible crear el ticket. Verifica que hayas iniciado sesión e intenta nuevamente.",
					sender: "bot",
					timestamp: new Date()
				}
			]);
		} finally {
			setIsSending(false);
		}
	};

	// Abrir WhatsApp
	const handleWhatsApp = () => {
		window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
	};

	// Cerrar chat
	const handleClose = () => {
		setIsOpen(false);
	};

	return (
		<div className="fixed bottom-4 right-4 z-50">
			{/* Botón flotante */}
			<AnimatePresence>
				{!isOpen && (
					<motion.button
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						exit={{ scale: 0 }}
						whileHover={{ scale: 1.1 }}
						onClick={() => setIsOpen(true)}
						className="w-14 h-14 rounded-full bg-gradient-to-br from-brand to-brand-2 shadow-2xl flex items-center justify-center text-white hover:shadow-brand/50 transition-all"
					>
						<div className="relative w-10 h-10 flex items-center justify-center">
							<img
								src={CHATBOT_BEAR_IMAGE}
								alt="Oso polar"
								className="w-10 h-10 rounded-full object-cover object-center drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
								onError={(e) => {
									e.currentTarget.style.display = "none";
								}}
							/>
							<span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-950/80 border border-white/15 flex items-center justify-center">
								<MessageCircle size={14} className="text-brand" />
							</span>
						</div>
					</motion.button>
				)}
			</AnimatePresence>

			{/* Ventana del chat */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, scale: 0.8, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.8, y: 20 }}
						className="absolute bottom-20 right-0 w-[92vw] max-w-sm h-[70vh] max-h-[560px] bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl shadow-2xl border border-brand/20 flex flex-col overflow-hidden"
					>
						{/* Header */}
						<div className="bg-gradient-to-r from-brand to-brand-2 px-4 py-4 flex items-center justify-between">
							<div className="flex items-center gap-3 min-w-0">
								<div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden">
									<img
										src={CHATBOT_BEAR_IMAGE}
										alt="Oso polar"
										className="w-10 h-10 object-cover object-center"
										onError={(e) => {
											e.currentTarget.style.display = "none";
										}}
									/>
								</div>
								<div className="min-w-0">
									<h3 className="font-bold text-white leading-tight">Soporte ECONFIA</h3>
									<p className="text-xs text-white/85">
										{isEscalated ? `Ticket: ${ticketCode}` : (isAuthenticated ? "Asistente con IA" : "Respuestas automáticas")}
									</p>
								</div>
							</div>
							<button
								onClick={handleClose}
								className="text-white hover:bg-white/20 p-1 rounded-full transition"
							>
								<X size={20} />
							</button>
						</div>

						{/* Mensajes */}
						<div className="flex-1 overflow-y-auto p-4 space-y-3">
							{messages.map((msg) => (
								<motion.div
									key={msg.id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
								>
									<div
										className={`max-w-xs px-4 py-2 rounded-lg text-sm whitespace-pre-line ${
											msg.sender === "user"
												? "bg-brand text-white rounded-br-none"
												: "bg-slate-700 text-brand rounded-bl-none border border-brand/30"
										}`}
									>
										{msg.sender === "user"
											? msg.texto
											: <div className="leading-snug">{renderMarkdownLite(msg.texto)}</div>}
										<div className="text-xs mt-1 opacity-70">
											{msg.timestamp.toLocaleTimeString("es-CO", {
												hour: "2-digit",
												minute: "2-digit"
											})}
										</div>
									</div>
								</motion.div>
							))}
							<div ref={messagesEndRef} />
						</div>

						{/* Sugerencias */}
						{!isEscalated && messages.length <= 2 && (
							<div className="px-4 pb-3">
								<p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand/70">
									Puedes preguntar
								</p>
								<div className="flex flex-wrap gap-2">
									{sugerencias.map((pregunta) => (
										<button
											key={pregunta}
											type="button"
											onClick={() => setInputValue(pregunta)}
											className="rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-xs text-brand transition hover:bg-brand/20"
										>
											{pregunta}
										</button>
									))}
								</div>
							</div>
						)}

						{/* Botones de acción */}
						{!isEscalated && (
							<div className="px-4 py-3 border-t border-brand/20 space-y-2">
								{/* WhatsApp — siempre visible */}
								<button
									onClick={handleWhatsApp}
									className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600/20 border border-green-500/50 text-green-300 rounded-lg hover:bg-green-600/30 transition text-sm font-semibold"
								>
									{/* Ícono WhatsApp SVG */}
									<svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
										<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
									</svg>
									Contactar por WhatsApp
								</button>

								{/* Soporte técnico — solo para usuarios con sesión */}
								{isAuthenticated && (
									<button
										onClick={handleEscalar}
										disabled={isSending}
										className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-600/20 border border-orange-500/50 text-orange-300 rounded-lg hover:bg-orange-600/30 transition text-sm font-semibold"
									>
										{isSending ? <Loader2 size={16} className="animate-spin" /> : <Phone size={16} />}
										Hablar con soporte técnico
									</button>
								)}
							</div>
						)}

						{/* Input */}
						<div className="px-4 py-3 border-t border-brand/20 bg-slate-950">
							<div className="flex gap-2">
								<input
									type="text"
									value={inputValue}
									onChange={(e) => setInputValue(e.target.value)}
									onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
									placeholder="Escribe tu pregunta..."
									className="flex-1 bg-slate-800 text-white rounded-lg px-3 py-2 text-sm outline-none border border-brand/30 focus:border-brand/80 transition placeholder-gray-500"
								/>
								<button
									onClick={handleSendMessage}
									disabled={isSending || !inputValue.trim()}
									className="bg-brand hover:opacity-90 text-white rounded-lg px-3 py-2 transition"
								>
									{isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
								</button>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
