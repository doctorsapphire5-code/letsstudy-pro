const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: [
    "https://letsstudy.pro",
    "https://www.letsstudy.pro"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =====================================================
   ENVIRONMENT
===================================================== */

const PESAPAL_ENV =
  process.env.PESAPAL_ENV || "sandbox";

const PESAPAL_CONSUMER_KEY =
  process.env.PESAPAL_CONSUMER_KEY;

const PESAPAL_CONSUMER_SECRET =
  process.env.PESAPAL_CONSUMER_SECRET;

const PESAPAL_IPN_ID =
  process.env.PESAPAL_IPN_ID;

const API_PUBLIC_URL =
  process.env.API_PUBLIC_URL ||
  "https://api.letsstudy.pro";

const PUBLIC_WEB_URL =
  process.env.PUBLIC_WEB_URL ||
  process.env.PUBLIC_URL ||
  "https://letsstudy.pro";


const PESAPAL_BASE =
  PESAPAL_ENV === "production"
    ? "https://pay.pesapal.com/v3"
    : "https://cybqa.pesapal.com/pesapalv3";


/* =====================================================
   HELPERS
===================================================== */

function clean(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
}


function getApiPublicUrl(req) {
  return (
    API_PUBLIC_URL ||
    `${req.protocol}://${req.get("host")}`
  );
}


function getPesapalStatusName(status) {

  const value =
    String(status || "").toUpperCase();

  const map = {
    "1": "COMPLETED",
    "2": "FAILED",
    "3": "REVERSED",
    "0": "INVALID"
  };

  return map[value] || value;
}


/* =====================================================
   HOME
===================================================== */

app.get("/", (req, res) => {

  res.status(200).json({
    success: true,
    service: "LetsStudy Pro Pesapal API",
    status: "online",
    environment: PESAPAL_ENV,
    time: new Date().toISOString()
  });

});


/* =====================================================
   GET PESAPAL TOKEN
===================================================== */

async function getPesapalToken() {

  if (!PESAPAL_CONSUMER_KEY) {
    throw new Error(
      "PESAPAL_CONSUMER_KEY is missing"
    );
  }

  if (!PESAPAL_CONSUMER_SECRET) {
    throw new Error(
      "PESAPAL_CONSUMER_SECRET is missing"
    );
  }


  const response =
    await fetch(
      `${PESAPAL_BASE}/api/Auth/RequestToken`,
      {
        method: "POST",

        headers: {
          Accept: "application/json",
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


  if (!response.ok) {

    console.error(
      "PESAPAL AUTH ERROR:",
      data
    );

    throw new Error(
      data?.message ||
      "Pesapal authentication failed"
    );

  }


  if (!data.token) {

    throw new Error(
      "Pesapal did not return authentication token"
    );

  }


  return data.token;
}


/* =====================================================
   CREATE PESAPAL ORDER
===================================================== */

app.post(
  "/api/pesapal/create-order",
  async (req, res) => {

    try {

      const {
        orderId,
        amount,
        currency = "TZS",
        description =
          "LetsStudy Pro Product",
        email,
        firstName = "LetsStudy",
        lastName = "Pro",
        phoneNumber = ""
      } = req.body || {};


      /* -----------------------------------------------
         VALIDATION
      ------------------------------------------------ */

      if (!orderId) {

        return res.status(400).json({
          success: false,
          message:
            "Order ID is required"
        });

      }


      if (
        !amount ||
        Number(amount) <= 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Valid amount is required"
        });

      }


      if (!email) {

        return res.status(400).json({
          success: false,
          message:
            "Customer email is required"
        });

      }


      if (!PESAPAL_IPN_ID) {

        return res.status(500).json({
          success: false,
          message:
            "PESAPAL_IPN_ID is not configured"
        });

      }


      /* -----------------------------------------------
         TOKEN
      ------------------------------------------------ */

      const token =
        await getPesapalToken();


      /* -----------------------------------------------
         CALLBACK
      ------------------------------------------------ */

      const callbackUrl =
        `${PUBLIC_WEB_URL}/payment.html`;


      const cancellationUrl =
        `${PUBLIC_WEB_URL}/payment.html?cancelled=true`;


      /* -----------------------------------------------
         PESAPAL PAYLOAD
      ------------------------------------------------ */

      const payload = {

        id:
          clean(orderId)
            .substring(0, 50),

        currency:
          clean(currency)
            .toUpperCase(),

        amount:
          Number(amount),

        description:
          clean(description)
            .substring(0, 100),

        callback_url:
          callbackUrl,

        cancellation_url:
          cancellationUrl,

        notification_id:
          PESAPAL_IPN_ID,

        redirect_mode:
          "PARENT_WINDOW",

        billing_address: {

          email_address:
            clean(email),

          phone_number:
            clean(phoneNumber),

          country_code:
            "TZ",

          first_name:
            clean(firstName) ||
            "LetsStudy",

          middle_name:
            "",

          last_name:
            clean(lastName) ||
            "Pro",

          line_1:
            "",

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

        }

      };


      console.log(
        "PESAPAL PAYLOAD:",
        JSON.stringify(
          payload,
          null,
          2
        )
      );


      /* -----------------------------------------------
         SUBMIT ORDER
      ------------------------------------------------ */

      const response =
        await fetch(
          `${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`,
          {
            method: "POST",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`
            },

            body:
              JSON.stringify(payload)
          }
        );


      const result =
        await response.json();


      console.log(
        "PESAPAL CREATE ORDER RESPONSE:",
        JSON.stringify(
          result,
          null,
          2
        )
      );


      /* -----------------------------------------------
         PESAPAL ERROR
      ------------------------------------------------ */

      if (!response.ok) {

        return res.status(
          response.status
        ).json({

          success: false,

          message:
            result?.error?.message ||
            result?.message ||
            "Pesapal order creation failed",

          pesapal:
            result

        });

      }


      /* -----------------------------------------------
         ORDER TRACKING ID
      ------------------------------------------------ */

      const orderTrackingId =
        result.order_tracking_id ||
        result.orderTrackingId;


      const merchantReference =
        result.merchant_reference ||
        result.merchantReference ||
        orderId;


      /* -----------------------------------------------
         PESAPAL REDIRECT URL
      ------------------------------------------------ */

      const redirectUrl =
        result.redirect_url ||
        result.redirectUrl;


      if (!orderTrackingId) {

        return res.status(502).json({

          success: false,

          message:
            "Pesapal did not return OrderTrackingId",

          pesapal:
            result

        });

      }


      if (!redirectUrl) {

        return res.status(502).json({

          success: false,

          message:
            "Pesapal did not return redirect_url",

          orderTrackingId,

          merchantReference,

          pesapal:
            result

        });

      }


      /* -----------------------------------------------
         IMPORTANT:
         PESAPAL FRAME URL
      ------------------------------------------------ */

      let iframeUrl =
        redirectUrl;


      /*
       * If Pesapal returns the normal
       * iframe URL, use it directly.
       *
       * Otherwise create the sandbox/live
       * iframe URL from OrderTrackingId.
       */

      if (
        !iframeUrl.includes(
          "pesapaliframe"
        )
      ) {

        const iframeBase =
          PESAPAL_ENV === "production"
            ? "https://pay.pesapal.com/pesapaliframe/PesapalIframe3/Index"
            : "https://cybqa.pesapal.com/pesapaliframe/PesapalIframe3/Index";


        iframeUrl =
          `${iframeBase}?OrderTrackingId=${encodeURIComponent(
            orderTrackingId
          )}`;

      }


      console.log(
        "PESAPAL IFRAME URL:",
        iframeUrl
      );


      /* -----------------------------------------------
         RESPONSE TO PAYMENT.HTML
      ------------------------------------------------ */

      return res.status(200).json({

        success: true,

        orderId:
          clean(orderId),

        merchantReference,

        orderTrackingId,

        iframeUrl,

        redirectUrl,

        amount:
          Number(amount),

        currency:
          clean(currency)
            .toUpperCase(),

        message:
          "Pesapal order created successfully"

      });

    }

    catch (error) {

      console.error(
        "CREATE ORDER ERROR:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          error?.message ||
          "Unable to create Pesapal order"

      });

    }

  }
);


/* =====================================================
   GET TRANSACTION STATUS
===================================================== */

async function getTransactionStatus(
  orderTrackingId
) {

  if (!orderTrackingId) {

    throw new Error(
      "OrderTrackingId is required"
    );

  }


  const token =
    await getPesapalToken();


  const response =
    await fetch(
      `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(
        orderTrackingId
      )}`,
      {
        method: "GET",

        headers: {

          Accept:
            "application/json",

          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`

        }
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    console.error(
      "PESAPAL STATUS ERROR:",
      data
    );

    throw new Error(
      data?.message ||
      "Unable to get Pesapal transaction status"
    );

  }


  return data;
}


/* =====================================================
   PAYMENT STATUS
===================================================== */

app.get(
  "/api/pesapal/payment-status",
  async (req, res) => {

    try {

      const orderTrackingId =
        clean(
          req.query.orderTrackingId
        );


      if (!orderTrackingId) {

        return res.status(400).json({

          success: false,

          message:
            "OrderTrackingId is required"

        });

      }


      const data =
        await getTransactionStatus(
          orderTrackingId
        );


      const status =
        getPesapalStatusName(
          data.status
        );


      return res.status(200).json({

        success: true,

        orderTrackingId,

        status,

        paymentStatus:
          status,

        payment_status_description:
          data.payment_status_description ||
          data.paymentStatusDescription ||
          status,

        amount:
          data.amount,

        currency:
          data.currency,

        merchantReference:
          data.merchant_reference ||
          data.merchantReference,

        confirmationCode:
          data.confirmation_code ||
          data.confirmationCode,

        raw:
          data

      });

    }

    catch (error) {

      console.error(
        "PAYMENT STATUS ERROR:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          error?.message ||
          "Unable to check payment status"

      });

    }

  }
);


/* =====================================================
   BACKGROUND PAYMENT VERIFICATION
===================================================== */

async function verifyPaymentInBackground(
  orderTrackingId
) {

  try {

    const data =
      await getTransactionStatus(
        orderTrackingId
      );


    console.log(
      "BACKGROUND PAYMENT VERIFICATION:",
      JSON.stringify(
        data,
        null,
        2
      )
    );


    return data;

  }

  catch (error) {

    console.error(
      "BACKGROUND VERIFICATION ERROR:",
      error
    );

    return null;

  }

}


/* =====================================================
   PESAPAL CALLBACK
===================================================== */

app.get(
  "/api/pesapal/callback",
  async (req, res) => {

    try {

      const orderTrackingId =
        clean(
          req.query.OrderTrackingId ||
          req.query.orderTrackingId
        );


      if (orderTrackingId) {

        await verifyPaymentInBackground(
          orderTrackingId
        );

      }


      const redirectUrl =
        `${PUBLIC_WEB_URL}/success.html`;


      const url =
        new URL(
          redirectUrl
        );


      if (orderTrackingId) {

        url.searchParams.set(
          "OrderTrackingId",
          orderTrackingId
        );

      }


      res.redirect(
        url.toString()
      );

    }

    catch (error) {

      console.error(
        "CALLBACK ERROR:",
        error
      );


      res.redirect(
        `${PUBLIC_WEB_URL}/payment.html?verification_error=true`
      );

    }

  }
);


/* =====================================================
   PESAPAL IPN
===================================================== */

async function handleIPN(
  req,
  res
) {

  try {

    const body =
      req.body || {};


    const orderTrackingId =
      clean(
        body.OrderTrackingId ||
        body.orderTrackingId
      );


    const orderMerchantReference =
      clean(
        body.OrderMerchantReference ||
        body.orderMerchantReference
      );


    const notificationType =
      clean(
        body.OrderNotificationType ||
        body.orderNotificationType
      );


    console.log(
      "PESAPAL IPN:",
      JSON.stringify(
        {
          orderTrackingId,
          orderMerchantReference,
          notificationType
        },
        null,
        2
      )
    );


    if (orderTrackingId) {

      await verifyPaymentInBackground(
        orderTrackingId
      );

    }


    return res.status(200).json({

      orderNotificationType:
        notificationType ||
        "IPNCHANGE",

      orderTrackingId,

      orderMerchantReference,

      status:
        "200"

    });

  }

  catch (error) {

    console.error(
      "IPN ERROR:",
      error
    );


    return res.status(200).json({

      orderNotificationType:
        "IPNCHANGE",

      orderTrackingId:
        clean(
          req.body?.OrderTrackingId
        ),

      orderMerchantReference:
        clean(
          req.body?.OrderMerchantReference
        ),

      status:
        "200"

    });

  }

}


app.post(
  "/api/pesapal/ipn",
  handleIPN
);


app.get(
  "/api/pesapal/ipn",
  handleIPN
);


/* =====================================================
   DIRECT VERIFY
===================================================== */

app.post(
  "/api/pesapal/verify",
  async (req, res) => {

    try {

      const orderTrackingId =
        clean(
          req.body?.orderTrackingId ||
          req.body?.OrderTrackingId
        );


      if (!orderTrackingId) {

        return res.status(400).json({

          success: false,

          message:
            "OrderTrackingId is required"

        });

      }


      const data =
        await getTransactionStatus(
          orderTrackingId
        );


      const status =
        getPesapalStatusName(
          data.status
        );


      return res.status(200).json({

        success: true,

        verified:
          status === "COMPLETED",

        status,

        orderTrackingId,

        amount:
          data.amount,

        currency:
          data.currency,

        merchantReference:
          data.merchant_reference ||
          data.merchantReference,

        confirmationCode:
          data.confirmation_code ||
          data.confirmationCode,

        paymentStatus:
          data.payment_status_description ||
          data.paymentStatusDescription ||
          status,

        raw:
          data

      });

    }

    catch (error) {

      console.error(
        "VERIFY ERROR:",
        error
      );


      return res.status(500).json({

        success: false,

        verified: false,

        message:
          error?.message ||
          "Payment verification failed"

      });

    }

  }
);


/* =====================================================
   404
===================================================== */

app.use(
  (req, res) => {

    res.status(404).json({

      success: false,

      message:
        "API route not found",

      path:
        req.originalUrl

    });

  }
);


/* =====================================================
   ERROR HANDLER
===================================================== */

app.use(
  (error, req, res, next) => {

    console.error(
      "UNHANDLED ERROR:",
      error
    );


    res.status(500).json({

      success: false,

      message:
        error?.message ||
        "Internal server error"

    });

  }
);


/* =====================================================
   VERCEL EXPORT
===================================================== */

module.exports = app;


/* =====================================================
   LOCAL SERVER
===================================================== */

if (require.main === module) {

  const PORT =
    process.env.PORT || 3000;

  app.listen(
    PORT,
    () => {

      console.log(
        `LetsStudy Pro Pesapal API running on port ${PORT}`
      );

    }
  );

}