// src/pages/PoliticaCookies.jsx
// BORRADOR estándar — revisar/ajustar con el área legal antes de publicar.
import LegalShell from "./LegalShell";

export default function PoliticaCookies() {
  return (
    <LegalShell
      eyebrow="Uso de cookies"
      title="Politica de Cookies"
      intro="Esta politica explica que son las cookies, cuales utiliza ECONFIA, con que finalidad y como puedes gestionarlas, en cumplimiento de la Ley 1581 de 2012 y demas normas aplicables en Colombia."
      updatedAt="22 de octubre de 2026"
    >
      <section>
        <h2>1. Que son las cookies</h2>
        <p>
          Las cookies son pequenos archivos de texto que un sitio web guarda en tu
          dispositivo cuando lo visitas. Sirven para que la plataforma funcione, para
          recordar tus preferencias y, si lo autorizas, para analizar como se usa el
          servicio y mejorarlo.
        </p>
      </section>

      <section>
        <h2>2. Tipos de cookies que usamos</h2>
        <h3>2.1 Cookies esenciales (siempre activas)</h3>
        <p>
          Necesarias para el funcionamiento basico: inicio de sesion, seguridad,
          mantenimiento de la sesion y recordar tu eleccion sobre cookies. Sin ellas la
          plataforma no puede operar, por lo que no requieren consentimiento.
        </p>
        <h3>2.2 Cookies de analisis (requieren tu consentimiento)</h3>
        <p>
          Nos ayudan a entender de forma agregada como se usa la plataforma (paginas
          visitadas, errores, rendimiento) para mejorarla. Solo se activan si las
          aceptas en el banner de cookies.
        </p>
      </section>

      <section>
        <h2>3. Como gestionar tu consentimiento</h2>
        <p>
          Al ingresar por primera vez te mostramos un banner donde puedes
          <strong> aceptar todas las cookies</strong> o seguir
          <strong> solo con las esenciales</strong>. Tu eleccion se guarda en tu
          navegador. Puedes cambiarla en cualquier momento borrando los datos del sitio
          en tu navegador, o desde la configuracion de cookies cuando este disponible.
        </p>
        <p>
          Tambien puedes bloquear o eliminar las cookies desde la configuracion de tu
          navegador (Chrome, Firefox, Safari, Edge). Ten en cuenta que desactivar las
          cookies esenciales puede impedir el correcto funcionamiento de la plataforma.
        </p>
      </section>

      <section>
        <h2>4. Cookies de terceros</h2>
        <p>
          Algunos servicios integrados (por ejemplo, medicion de uso o funcionalidades
          embebidas) pueden instalar sus propias cookies. Estas se rigen tambien por las
          politicas de privacidad de esos terceros. ECONFIA audita periodicamente los
          SDK y servicios de terceros que utiliza.
        </p>
      </section>

      <section>
        <h2>5. Contacto</h2>
        <p>
          Para dudas sobre esta politica o el ejercicio de tus derechos sobre datos
          personales, escribenos a{" "}
          <a href="mailto:noreply@econfia.co">noreply@econfia.co</a> o consulta nuestra{" "}
          <a href="/politica-privacidad">Politica de Privacidad</a>.
        </p>
      </section>
    </LegalShell>
  );
}
