"use strict";


require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

app.post("/api/search", async (req, res) => {
  try {
    const query = String(req.body?.query || "").trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Query is required"
      });
    }

    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "You are LetsStudy Pro AI. Answer clearly, accurately and helpfully."
        },
        {
          role: "user",
          content: query
        }
      ],
      temperature: 0.4,
      max_completion_tokens: 1200
    });

    const answer =
      response.choices?.[0]?.message?.content || "";

    res.json({
      success: true,
      query,
      answer,
      results: true,
      ai: true
    });

  } catch (error) {
    console.error("GROQ ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message || "AI search failed"
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "LetsStudy Pro AI",
    provider: "Groq"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`LetsStudy AI running on port ${PORT}`);
});
const express = require("express");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const Groq = require("groq-sdk");

const app = express();

/* =========================================================
   CONFIGURATION
========================================================= */

const GROQ_API_KEY =
  process.env.GROQ_API_KEY;

const GROQ_MODEL =
  process.env.GROQ_MODEL ||
  "openai/gpt-oss-20b";

if (!GROQ_API_KEY) {
  console.error("ERROR: GROQ_API_KEY is missing.");
  process.exit(1);
}

const groq =
  new Groq({
    apiKey: GROQ_API_KEY
  });


/* =========================================================
   PESAPAL CONFIGURATION
========================================================= */

const PESAPAL_ENV =
  (process.env.PESAPAL_ENV || "sandbox").toLowerCase();

const PESAPAL_CONSUMER_KEY =
  process.env.PESAPAL_CONSUMER_KEY;

const PESAPAL_CONSUMER_SECRET =
  process.env.PESAPAL_CONSUMER_SECRET;

const PESAPAL_IPN_ID =
  process.env.PESAPAL_IPN_ID;

const PESAPAL_CALLBACK_URL =
  process.env.PESAPAL_CALLBACK_URL ||
  `${FRONTEND_URL}/payment-callback.html`;

const PESAPAL_CANCEL_URL =
  process.env.PESAPAL_CANCEL_URL ||
  `${FRONTEND_URL}/payment.html?cancelled=1`;


const PESAPAL_BASE_URL =
  PESAPAL_ENV === "live"
    ? "https://pay.pesapal.com/v3"
    : "https://cybqa.pesapal.com/pesapalv3";


/* =========================================================
   REQUIRED ENVIRONMENT VARIABLES
========================================================= */

if (!GEMINI_API_KEY) {

  console.error(
    "ERROR: GEMINI_API_KEY is missing."
  );

  process.exit(1);
}


if (!PESAPAL_CONSUMER_KEY) {

  console.error(
    "ERROR: PESAPAL_CONSUMER_KEY is missing."
  );

  process.exit(1);
}


if (!PESAPAL_CONSUMER_SECRET) {

  console.error(
    "ERROR: PESAPAL_CONSUMER_SECRET is missing."
  );

  process.exit(1);
}


if (!PESAPAL_IPN_ID) {

  console.error(
    "ERROR: PESAPAL_IPN_ID is missing."
  );

  process.exit(1);
}


/* =========================================================
   GEMINI
========================================================= */

const ai =
  new GoogleGenAI({
    apiKey: GEMINI_API_KEY
  });


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
  cors({
    origin:
      FRONTEND_URL === "*"
        ? true
        : FRONTEND_URL
  })
);

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.urlencoded({
    extended: true
  })
);


/* =========================================================
   STATIC FRONTEND
========================================================= */

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);


/* =========================================================
   HOME
========================================================= */

app.get("/", (req, res) => {

  const file =
    path.join(
      __dirname,
      "public",
      "search.html"
    );

  res.sendFile(file);

});


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/api/health",
  (req, res) => {

    res.json({

      success: true,

      service:
        "LetsStudy Pro",

      status:
        "online",

      ai:
        "online",

      payments:
        "online",

      pesapal:
        PESAPAL_ENV,

      model:
        GEMINI_MODEL,

      timestamp:
        new Date().toISOString()

    });

  }
);


/* =========================================================
   PESAPAL TOKEN
========================================================= */

let pesapalToken = null;

let pesapalTokenExpiry = 0;


async function getPesapalToken() {

  const now =
    Date.now();


  if (
    pesapalToken &&
    now < pesapalTokenExpiry
  ) {

    return pesapalToken;

  }


  const response =
    await fetch(
      `${PESAPAL_BASE_URL}/api/Auth/RequestToken`,
      {

        method:
          "POST",

        headers: {

          Accept:
            "application/json",

          "Content-Type":
            "application/json"

        },

        body:
          JSON.stringify({

            consumer_key:
              PESAPAL_CONSUMER_KEY,

            consumer_secret:
              PESAPAL_CONSUMER_SECRET

          })

      }
    );


  const data =
    await response.json();


  if (
    !response.ok ||
    !data?.token
  ) {

    console.error(
      "[PESAPAL AUTH ERROR]",
      data
    );

    throw new Error(
      data?.message ||
      data?.error?.message ||
      "Pesapal authentication failed."
    );

  }


  pesapalToken =
    data.token;


  /*
    Pesapal says the token is valid
    for a maximum of 5 minutes.
    Refresh before expiry.
  */

  pesapalTokenExpiry =
    Date.now() +
    (4 * 60 * 1000);


  return pesapalToken;

}


/* =========================================================
   PESAPAL API HELPER
========================================================= */

async function pesapalRequest(
  endpoint,
  options = {}
) {

  const token =
    await getPesapalToken();


  const response =
    await fetch(
      `${PESAPAL_BASE_URL}${endpoint}`,
      {

        ...options,

        headers: {

          Accept:
            "application/json",

          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,

          ...(options.headers || {})

        }

      }
    );


  const text =
    await response.text();


  let data;


  try {

    data =
      JSON.parse(text);

  } catch {

    data = {
      raw: text
    };

  }


  if (!response.ok) {

    console.error(
      "[PESAPAL API ERROR]",
      data
    );

    throw new Error(
      data?.message ||
      data?.error?.message ||
      "Pesapal API request failed."
    );

  }


  return data;

}


/* =========================================================
   CREATE PESAPAL PAYMENT
========================================================= */

app.post(
  "/api/payment/create",
  async (req, res) => {

    try {

      const {

        amount,

        currency =
          "TZS",

        description =
          "LetsStudy Pro Premium",

        email,

        phone,

        firstName =
          "LetsStudy",

        lastName =
          "Customer"

      } = req.body || {};


      /* ---------------------------------
         VALIDATE AMOUNT
      --------------------------------- */

      const numericAmount =
        Number(amount);


      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <= 0
      ) {

        return res.status(400).json({

          success:
            false,

          error:
            "Invalid payment amount."

        });

      }


      /* ---------------------------------
         VALIDATE EMAIL
      --------------------------------- */

      if (!email) {

        return res.status(400).json({

          success:
            false,

          error:
            "Customer email is required."

        });

      }


      /* ---------------------------------
         CURRENCY
      --------------------------------- */

      const cleanCurrency =
        String(currency)
          .trim()
          .toUpperCase();


      if (
        !/^[A-Z]{3}$/.test(
          cleanCurrency
        )
      ) {

        return res.status(400).json({

          success:
            false,

          error:
            "Invalid currency."

        });

      }


      /* ---------------------------------
         UNIQUE MERCHANT REFERENCE
      --------------------------------- */

      const merchantReference =
        `LSP-${Date.now()}-${crypto
          .randomBytes(4)
          .toString("hex")}`;


      /* ---------------------------------
         BILLING ADDRESS
      --------------------------------- */

      const billingAddress = {

        email_address:
          String(email),

        phone_number:
          String(phone || ""),

        country_code:
          "TZ",

        first_name:
          String(
            firstName ||
            "LetsStudy"
          ),

        middle_name:
          "",

        last_name:
          String(
            lastName ||
            "Customer"
          ),

        line_1:
          "LetsStudy Pro",

        line_2:
          "",

        city:
          "",

        state:
          "",

        postal_code:
          "",

        zip_code:
          ""

      };


      /* ---------------------------------
         ORDER
      --------------------------------- */

      const order = {

        id:
          merchantReference,

        currency:
          cleanCurrency,

        amount:
          numericAmount,

        description:
          String(description)
            .substring(0, 100),

        callback_url:
          PESAPAL_CALLBACK_URL,

        redirect_mode:
          "TOP_WINDOW",

        cancellation_url:
          PESAPAL_CANCEL_URL,

        notification_id:
          PESAPAL_IPN_ID,

        billing_address:
          billingAddress

      };


      console.log(
        "[PESAPAL ORDER]",
        merchantReference
      );


      /* ---------------------------------
         SUBMIT ORDER
      --------------------------------- */

      const data =
        await pesapalRequest(
          "/api/Transactions/SubmitOrderRequest",
          {

            method:
              "POST",

            body:
              JSON.stringify(order)

          }
        );


      if (
        !data?.redirect_url
      ) {

        console.error(
          "Pesapal did not return redirect_url:",
          data
        );

        return res.status(502).json({

          success:
            false,

          error:
            "Pesapal did not return a payment URL.",

          pesapal:
            data

        });

      }


      /* ---------------------------------
         RESPONSE
      --------------------------------- */

      return res.json({

        success:
          true,

        merchantReference,

        orderTrackingId:
          data.order_tracking_id,

        redirectUrl:
          data.redirect_url,

        status:
          data.status

      });


    } catch (error) {

      console.error(
        "[CREATE PAYMENT ERROR]",
        error
      );


      return res.status(500).json({

        success:
          false,

        error:
          error.message ||
          "Unable to create payment."

      });

    }

  }
);


/* =========================================================
   PAYMENT STATUS
========================================================= */

app.get(
  "/api/payment/status",
  async (req, res) => {

    try {

      const orderTrackingId =
        req.query.orderTrackingId;


      if (!orderTrackingId) {

        return res.status(400).json({

          success:
            false,

          error:
            "OrderTrackingId is required."

        });

      }


      const data =
        await pesapalRequest(
          `/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(
            orderTrackingId
          )}`,
          {

            method:
              "GET"

          }
        );


      const statusCode =
        Number(
          data?.status_code
        );


      let paymentStatus =
        "pending";


      switch (
        statusCode
      ) {

        case 1:

          paymentStatus =
            "completed";

          break;


        case 2:

          paymentStatus =
            "failed";

          break;


        case 3:

          paymentStatus =
            "reversed";

          break;


        case 0:

          paymentStatus =
            "invalid";

          break;


        default:

          paymentStatus =
            "pending";

      }


      return res.json({

        success:
          true,

        paymentStatus,

        statusCode,

        transaction:
          data

      });


    } catch (error) {

      console.error(
        "[PAYMENT STATUS ERROR]",
        error
      );


      return res.status(500).json({

        success:
          false,

        error:
          error.message ||
          "Unable to check payment status."

      });

    }

  }
);


/* =========================================================
   PESAPAL CALLBACK
========================================================= */

app.get(
  "/api/payment/callback",
  async (req, res) => {

    try {

      const {

        OrderTrackingId,

        OrderMerchantReference

      } = req.query;


      if (
        !OrderTrackingId
      ) {

        return res.redirect(
          `${FRONTEND_URL}/payment-callback.html?status=missing_tracking_id`
        );

      }


      console.log(
        "[PESAPAL CALLBACK]",
        {
          OrderTrackingId,
          OrderMerchantReference
        }
      );


      /*
        Callback does NOT prove payment.
        Query Pesapal for actual status.
      */

      const payment =
        await pesapalRequest(
          `/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(
            OrderTrackingId
          )}`,
          {

            method:
              "GET"

          }
        );


      const statusCode =
        Number(
          payment?.status_code
        );


      let status =
        "pending";


      if (
        statusCode === 1
      ) {

        status =
          "completed";

      }

      else if (
        statusCode === 2
      ) {

        status =
          "failed";

      }

      else if (
        statusCode === 3
      ) {

        status =
          "reversed";

      }

      else if (
        statusCode === 0
      ) {

        status =
          "invalid";

      }


      return res.redirect(

        `${FRONTEND_URL}/payment-callback.html` +
        `?OrderTrackingId=${encodeURIComponent(
          OrderTrackingId
        )}` +
        `&OrderMerchantReference=${encodeURIComponent(
          OrderMerchantReference || ""
        )}` +
        `&status=${encodeURIComponent(
          status
        )}`

      );


    } catch (error) {

      console.error(
        "[CALLBACK ERROR]",
        error
      );


      return res.redirect(
        `${FRONTEND_URL}/payment-callback.html?status=error`
      );

    }

  }
);


/* =========================================================
   PESAPAL IPN
========================================================= */

app.all(
  "/api/payment/ipn",
  async (req, res) => {

    try {

      const data =
        req.method === "GET"
          ? req.query
          : req.body;


      const orderTrackingId =
        data?.OrderTrackingId ||
        data?.orderTrackingId;


      const merchantReference =
        data?.OrderMerchantReference ||
        data?.orderMerchantReference;


      const notificationType =
        data?.OrderNotificationType ||
        data?.orderNotificationType ||
        "IPNCHANGE";


      console.log(
        "[PESAPAL IPN]",
        {
          notificationType,
          orderTrackingId,
          merchantReference
        }
      );


      if (
        !orderTrackingId
      ) {

        return res.status(400).json({

          orderNotificationType:
            "IPNCHANGE",

          orderTrackingId:
            "",

          orderMerchantReference:
            merchantReference ||
            "",

          status:
            500

        });

      }


      /*
        Fetch final status.
      */

      const payment =
        await pesapalRequest(
          `/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(
            orderTrackingId
          )}`,
          {

            method:
              "GET"

          }
        );


      console.log(
        "[PESAPAL VERIFIED PAYMENT]",
        {

          trackingId:
            orderTrackingId,

          merchantReference,

          status:
            payment?.payment_status_description,

          statusCode:
            payment?.status_code,

          amount:
            payment?.amount,

          currency:
            payment?.currency,

          confirmationCode:
            payment?.confirmation_code

        }
      );


      /*
        IMPORTANT:

        This is the secure point where
        Firestore premiumPayments and
        premiumMembers should be updated.

        Only status_code === 1 should
        activate Premium.
      */


      return res.status(200).json({

        orderNotificationType:
          "IPNCHANGE",

        orderTrackingId,

        orderMerchantReference:
          merchantReference ||
          "",

        status:
          200

      });


    } catch (error) {

      console.error(
        "[IPN ERROR]",
        error
      );


      return res.status(500).json({

        orderNotificationType:
          "IPNCHANGE",

        orderTrackingId:
          req.query?.OrderTrackingId ||
          req.body?.OrderTrackingId ||
          "",

        orderMerchantReference:
          req.query?.OrderMerchantReference ||
          req.body?.OrderMerchantReference ||
          "",

        status:
          500

      });

    }

  }
);


/* =========================================================
   AI SEARCH
========================================================= */

app.post(
  "/api/search",
  async (req, res) => {

    try {

      const query =
        typeof req.body?.query === "string"
          ? req.body.query.trim()
          : "";


      if (!query) {

        return res.status(400).json({

          success:
            false,

          error:
            "Please enter a question."

        });

      }


      if (
        query.length > 2000
      ) {

        return res.status(400).json({

          success:
            false,

          error:
            "Question is too long. Please keep it under 2000 characters."

        });

      }


      console.log(
        `[AI SEARCH] ${new Date().toISOString()}`
      );


      console.log(
        `[QUERY] ${query}`
      );


      const systemInstruction = `

You are LetsStudy Pro AI,
an educational assistant.

Your job is to help students understand
academic topics clearly.

Rules:

1. Give accurate educational explanations.
2. Explain difficult concepts simply.
3. Use examples when useful.
4. For mathematics show working steps.
5. For science explain concepts logically.
6. For programming provide correct and safe code.
7. For exam questions focus on learning.
8. Do not pretend uncertain information is certain.
9. If a question is ambiguous explain the likely interpretation.
10. Keep answers structured and easy to read.
11. Use headings and bullet points when helpful.
12. Avoid unnecessary introductions.
13. Support beginner to advanced students.
14. Answer in English or Kiswahili depending on the question.

You are part of LetsStudy Pro,
a global learning platform.

`;


      const prompt = `

Student question:

${query}

Provide the best educational answer.

If appropriate include:

- Short definition
- Explanation
- Example
- Key points
- Exam tip

Do not make the answer unnecessarily long.

`;


      const response =
        await ai.models.generateContent({

          model:
            GEMINI_MODEL,

          contents:
            prompt,

          config: {

            systemInstruction,

            temperature:
              0.4,

            maxOutputTokens:
              1500

          }

        });


      const answer =
        response?.text?.trim();


      if (!answer) {

        return res.status(502).json({

          success:
            false,

          error:
            "AI did not return an answer."

        });

      }


      return res.json({

        success:
          true,

        query,

        answer,

        resources: [],

                model:
          GEMINI_MODEL,

        timestamp:
          new Date().toISOString()

      });

    } catch (error) {

      console.error(
        "[AI SEARCH ERROR]",
        error
      );

      return res.status(500).json({

        success:
          false,

        error:
          error?.message ||
          "Unable to generate an AI answer."

      });

    }

  }
);


/* =========================================================
   API 404 HANDLER
========================================================= */

app.use(
  "/api",
  (req, res) => {

    res.status(404).json({

      success:
        false,

      error:
        "API endpoint not found."

    });

  }
);


/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
  (error, req, res, next) => {

    console.error(
      "[SERVER ERROR]",
      error
    );

    if (res.headersSent) {

      return next(error);

    }

    res.status(500).json({

      success:
        false,

      error:
        "Internal server error."

    });

  }
);


/* =========================================================
   START SERVER
========================================================= */

app.listen(
  PORT,
  () => {

    console.log("");

    console.log(
      "======================================"
    );

    console.log(
      "       LETSSTUDY PRO SERVER"
    );

    console.log(
      "======================================"
    );

    console.log("");

    console.log(
      `Server: http://localhost:${PORT}`
    );

    console.log(
      `Health: http://localhost:${PORT}/api/health`
    );

    console.log(
      `AI Search: http://localhost:${PORT}/api/search`
    );

    console.log(
      `Create Payment: http://localhost:${PORT}/api/payment/create`
    );

    console.log(
      `Payment Status: http://localhost:${PORT}/api/payment/status`
    );

    console.log(
      `Pesapal Callback: http://localhost:${PORT}/api/payment/callback`
    );

    console.log(
      `Pesapal IPN: http://localhost:${PORT}/api/payment/ipn`
    );

    console.log(
      `Pesapal Environment: ${PESAPAL_ENV}`
    );

    console.log(
      `AI Model: ${GEMINI_MODEL}`
    );

    console.log("");

    console.log(
      "LetsStudy Pro server is ready."
    );

    console.log("");

  }
);

