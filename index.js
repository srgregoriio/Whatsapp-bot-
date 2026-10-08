const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");

async function iniciarBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection }) => {
    if (connection === "open") {
      console.log("✅ BOT CONECTADO A WHATSAPP");
    }

    if (connection === "close") {
      console.log("❌ Conexión cerrada");

      setTimeout(() => {
        iniciarBot();
      }, 5000);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    const texto =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (!texto.startsWith("#")) return;

    if (texto.toLowerCase() === "#menu") {
      await sock.sendMessage(jid, {
        text:
`╭━━━〔 🤖 BOT 〕━━━╮
┃
┃ #menu
┃ #del
┃ #kick
┃
╰━━━━━━━━━━━━━━╯`
      });
    }

    if (texto.toLowerCase() === "#del") {
      const citado =
        msg.message.extendedTextMessage?.contextInfo?.stanzaId;

      const participante =
        msg.message.extendedTextMessage?.contextInfo?.participant;

      if (!citado) {
        await sock.sendMessage(jid, {
          text: "❌ Responde al mensaje que quieres borrar."
        });
        return;
      }

      try {
        await sock.sendMessage(jid, {
          delete: {
            remoteJid: jid,
            fromMe: false,
            id: citado,
            participant: participante
          }
        });
      } catch (error) {
        await sock.sendMessage(jid, {
          text: "❌ No pude borrar ese mensaje. El bot debe tener permisos de administrador."
        });
      }
    }
  });
}

iniciarBot();
