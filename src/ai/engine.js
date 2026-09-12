const { GoogleGenAI } = require("@google/genai");
const Groq = require("groq-sdk");

const { SYSTEM_PROMPT } = require("./prompts");
const { getModule } = require("./modules");
const { getLogic } = require("./module-logic");
const { models } = require("./models");

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

/* =======================================================
   GROQ
======================================================= */

const groq =
  process.env.GROQ_API_KEY
    ? new Groq({
        apiKey: process.env.GROQ_API_KEY
      })
    : null;

const GROQ_MODEL =
  process.env.GROQ_MODEL ||
  "openai/gpt-oss-20b";


/* =======================================================
   HISTORY
======================================================= */

function buildHistory(history = []) {
  if (!Array.isArray(history)) return [];

  return history
    .filter(item =>
      item &&
      (
        item.role === "user" ||
        item.role === "assistant" ||
        item.role === "model"
      ) &&
      typeof item.content === "string" &&
      item.content.trim()
    )
    .map(item => ({
      role:
        item.role === "assistant"
          ? "model"
          : item.role,
      parts: [
        {
          text: item.content.trim()
        }
      ]
    }));
}


/* =======================================================
   AI RESPONSE
======================================================= */

async function generateResponse({
  message,
  module = "chat",
  instructions = "",
  history = []
}) {

  if (!message || !message.trim()) {
    throw new Error("Message is required");
  }

  const selectedModule = getModule(module);
  const specializedLogic = getLogic(module);
  const conversation = buildHistory(history);

  conversation.push({
    role: "user",
    parts: [
      {
        text: message.trim()
      }
    ]
  });


  /* =====================================================
     GROQ
     Added without removing Gemini
  ===================================================== */

  if (groq) {

    try {

      console.log(
        `Trying Groq model: ${GROQ_MODEL}`
      );

      const groqMessages = [

        {
          role: "system",

          content: `
${SYSTEM_PROMPT}

CURRENT MODULE:
${selectedModule.name}

MODULE INSTRUCTIONS:
${selectedModule.instructions}

SPECIALIZED MODULE LOGIC:
${specializedLogic}

ADDITIONAL INSTRUCTIONS:
${instructions}
`
        },

        ...conversation.map(item => ({

          role:
            item.role === "model"
              ? "assistant"
              : item.role,

          content:
            item.parts
              ?.map(part => part.text || "")
              .join("") || ""

        }))

      ];


      const groqResponse =
        await groq.chat.completions.create({

          model: GROQ_MODEL,

          messages: groqMessages,

          temperature: 0.4,

          max_completion_tokens: 1500

        });


      const groqAnswer =
        groqResponse
          ?.choices?.[0]
          ?.message
          ?.content
          ?.trim();


      if (groqAnswer) {

        console.log(
          `Success with Groq: ${GROQ_MODEL}`
        );

        return groqAnswer;

      }

    } catch (groqError) {

      console.error(
        "Groq failed:",
        groqError.message ||
        groqError
      );

      console.log(
        "Continuing with existing Gemini..."
      );

    }

  }


  /* =====================================================
     EXISTING GEMINI SYSTEM
     KEPT INTACT
  ===================================================== */

  let lastError = null;

  for (const model of models) {

    try {

      console.log(
        `Trying model: ${model}`
      );

      console.log(
        `Module: ${module}`
      );

      console.log(
        `History messages: ${
          conversation.length - 1
        }`
      );


      const response =
        await ai.models.generateContent({

          model,

          contents: conversation,

          config: {

            systemInstruction: `
${SYSTEM_PROMPT}

CURRENT MODULE:
${selectedModule.name}

MODULE INSTRUCTIONS:
${selectedModule.instructions}

SPECIALIZED MODULE LOGIC:
${specializedLogic}

ADDITIONAL INSTRUCTIONS:
${instructions}
`

          }

        });


      console.log(
        `Success with: ${model}`
      );


      return response.text || "";


    } catch (error) {

      lastError = error;

      const errorText =
        String(
          error.message ||
          error
        );


      console.error(
        `Model failed: ${model}`
      );

      console.error(
        errorText
      );


      if (
        !errorText.includes("503") &&
        !errorText.includes("UNAVAILABLE")
      ) {

        throw error;

      }

    }

  }


  throw (
    lastError ||
    new Error(
      "All Gemini models are unavailable"
    )
  );

}


/* =======================================================
   EXPORT
======================================================= */

module.exports = {
  generateResponse
};