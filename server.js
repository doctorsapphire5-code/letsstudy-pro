"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();

/* =========================
   CONFIGURATION
========================= */

const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.7-flash";

/*
  Optional:
  If your frontend is hosted separately, put its URL here.

  Example:
  FRONTEND_URL=https://let-s-study-pro-course.web.app
*/
const FRONTEND_URL = process.env.FRONTEND_URL || "*";


/* =========================
   CHECK API KEY
========================= */

if (!GEMINI_API_KEY) {
  console.error(
    "ERROR: GEMINI_API_KEY is missing from your .env file."
  );

  process.exit(1);
}


/* =========================
   GEMINI CLIENT
========================= */

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY
});


/* =========================
   MIDDLEWARE
========================= */

app.use(
  cors({
    origin: FRONTEND_URL === "*" ? true : FRONTEND_URL
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));


/* =========================
   STATIC FRONTEND
========================= */

app.use(express.static(path.join(__dirname, "public")));


/* =========================
   HOME
========================= */

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "ai-search.html")
  );
});


/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "LetsStudy Pro AI",
    status: "online",
    model: GEMINI_MODEL,
    timestamp: new Date().toISOString()
  });
});


/* =========================
   AI SEARCH
========================= */

app.post("/api/search", async (req, res) => {

  try {

    const query =
      typeof req.body?.query === "string"
        ? req.body.query.trim()
        : "";


    /* Validate question */

    if (!query) {

      return res.status(400).json({
        success: false,
        error: "Please enter a question."
      });

    }


    /* Prevent extremely large requests */

    if (query.length > 2000) {

      return res.status(400).json({
        success: false,
        error: "Question is too long. Please keep it under 2000 characters."
      });

    }


    console.log(
      `[AI SEARCH] ${new Date().toISOString()}`
    );

    console.log(
      `[QUERY] ${query}`
    );


    /* =========================
       AI SYSTEM INSTRUCTION
    ========================= */

    const systemInstruction = `
You are LetsStudy Pro AI, an educational assistant.

Your job is to help students understand academic topics clearly.

Rules:

1. Give accurate educational explanations.
2. Explain difficult concepts in simple language.
3. Use examples when useful.
4. For mathematics, show the working steps.
5. For science, explain concepts logically.
6. For programming, provide correct and safe code.
7. For exam questions, focus on learning and understanding.
8. Do not pretend to know information you are uncertain about.
9. If a question is ambiguous, explain the likely interpretation.
10. Keep answers structured and easy to read.
11. Use headings and bullet points when helpful.
12. Do not include unnecessary introductions.
13. Support students from beginner to advanced level.
14. You may answer in English or Kiswahili depending on the user's question.

You are part of LetsStudy Pro, a global learning platform.
`;


    /* =========================
       USER PROMPT
    ========================= */

    const prompt = `
Student question:

${query}

Provide the best educational answer.

If appropriate, include:

- Short definition
- Explanation
- Example
- Key points
- Exam tip

Do not make the answer unnecessarily long.
`;


    /* =========================
       GEMINI REQUEST
    ========================= */

    const response =
      await ai.models.generateContent({

        model: GEMINI_MODEL,

        contents: prompt,

        config: {

          systemInstruction,

          temperature: 0.4,

          maxOutputTokens: 1500

        }

      });


    /* =========================
       GET AI TEXT
    ========================= */

    const answer =
      response?.text?.trim();


    if (!answer) {

      console.error(
        "Gemini returned an empty response."
      );

      return res.status(502).json({
        success: false,
        error: "AI did not return an answer."
      });

    }


    /* =========================
       RELATED RESOURCES
    ========================= */

    /*
      At this stage resources are empty.

      Later we can connect Firestore and search:

      courses
      notes
      videos
      pastPapers
      resources
      questions

      and return matching documents here.
    */

    const resources = [];


    /* =========================
       RESPONSE
    ========================= */

    return res.json({

      success: true,

      query,

      answer,

      resources,

      model: GEMINI_MODEL,

      timestamp: new Date().toISOString()

    });


  } catch (error) {

    console.error(
      "[AI SEARCH ERROR]"
    );

    console.error(error);


    let message =
      "Unable to generate an AI answer. Please try again.";


    /* Gemini/API errors */

    if (
      error?.message &&
      error.message.length < 500
    ) {
      message = error.message;
    }


    return res.status(500).json({

      success: false,

      error: message

    });

  }

});


/* =========================
   404 API HANDLER
========================= */

app.use("/api", (req, res) => {

  res.status(404).json({

    success: false,

    error: "API endpoint not found."

  });

});


/* =========================
   GLOBAL ERROR HANDLER
========================= */

app.use((error, req, res, next) => {

  console.error(
    "[SERVER ERROR]",
    error
  );


  if (res.headersSent) {

    return next(error);

  }


  res.status(500).json({

    success: false,

    error: "Internal server error."

  });

});


/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {

  console.log("");
  console.log("==================================");
  console.log("     LETSSTUDY PRO AI SERVER");
  console.log("==================================");
  console.log("");
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`AI Search: http://localhost:${PORT}/api/search`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Model: ${GEMINI_MODEL}`);
  console.log("");
  console.log("AI server is ready.");
  console.log("");

});