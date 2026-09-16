const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

const ENV = process.env.PESAPAL_ENV || "sandbox";

const PESAPAL_BASE =
  ENV === "production"
    ? "https://pay.pesapal.com/v3"
    : "https://cybqa.pesapal.com/pesapalv3";

/* =========================================
   HEALTH CHECK
========================================= */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    service: "LetsStudy Pro Payment API",
    status: "online",
    environment: ENV,
    timestamp: new Date().toISOString()
  });
});

/* =========================================
   PESAPAL AUTHENTICATION
========================================= */

async function getPesapalToken() {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error(
      "Pesapal credentials are not configured"
    );
  }

  const response = await fetch(
    `${PESAPAL_BASE}/api/Auth/RequestToken`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret
      })
    }
  );

  const data = await response.json();

  if (!response.ok || !data.token) {
    throw new Error(
      data.message ||
      data.error ||
      "Pesapal authentication failed"
    );
  }

  return data.token;
}

/* =========================================
   CREATE PESAPAL ORDER
========================================= */

app.post(
  "/api/pesapal/create-order",
  async (req, res) => {
    try {
      const {
        orderId,
        amount,
        currency = "TZS",
        description = "LetsStudy Pro Payment",
        email,
        firstName = "",
        lastName = "",
        phoneNumber = ""
      } = req.body;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "orderId is required"
        });
      }

      if (!amount) {
        return res.status(400).json({
          success: false,
          message: "amount is required"
        });
      }

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "email is required"
        });
      }

      const numericAmount = Number(amount);

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment amount"
        });
      }

      const token = await getPesapalToken();

      const publicUrl =
        process.env.PUBLIC_URL ||
        "https://letsstudy.pro";

      const callbackUrl =
        `${publicUrl}/api/pesapal/callback`;

      const notificationId =
        process.env.PESAPAL_IPN_ID;

      if (!notificationId) {
        return res.status(500).json({
          success: false,
          message: "PESAPAL_IPN_ID is not configured"
        });
      }

      const pesapalResponse = await fetch(
        `${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            id: String(orderId),
            currency: String(currency),
            amount: numericAmount,
            description: String(description),
            callback_url: callbackUrl,
            notification_id: notificationId,
            billing_address: {
              email_address: String(email),
              first_name: String(firstName),
              last_name: String(lastName),
              phone_number: String(phoneNumber)
            }
          })
        }
      );

      const data =
        await pesapalResponse.json();

      if (
        !pesapalResponse.ok ||
        !data.redirect_url
      ) {
        console.error(
          "Pesapal order error:",
          data
        );

        return res.status(400).json({
          success: false,
          message:
            data.message ||
            "Pesapal order creation failed",
          data
        });
      }

      return res.status(200).json({
        success: true,
        orderTrackingId:
          data.order_tracking_id,
        merchantReference:
          data.merchant_reference,
        redirectUrl:
          data.redirect_url
      });

    } catch (error) {
      console.error(
        "Create order error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message ||
          "Payment API error"
      });
    }
  }
);

/* =========================================
   PAYMENT STATUS
========================================= */

app.get(
  "/api/pesapal/payment-status",
  async (req, res) => {
    try {
      const {
        orderTrackingId
      } = req.query;

      if (!orderTrackingId) {
        return res.status(400).json({
          success: false,
          message:
            "orderTrackingId is required"
        });
      }

      const token =
        await getPesapalToken();

      const response = await fetch(
        `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(
          orderTrackingId
        )}`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      const data =
        await response.json();

      return res.status(
        response.ok ? 200 : 400
      ).json({
        success: response.ok,
        data
      });

    } catch (error) {
      console.error(
        "Payment status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/* =========================================
   PESAPAL CALLBACK
========================================= */

app.get(
  "/api/pesapal/callback",
  (req, res) => {
    const trackingId =
      req.query.OrderTrackingId || "";

    const publicUrl =
      process.env.PUBLIC_URL ||
      "https://letsstudy.pro";

    const verifyUrl =
      `${publicUrl}/verify.html?orderTrackingId=${encodeURIComponent(
        trackingId
      )}`;

    return res.redirect(302, verifyUrl);
  }
);

/* =========================================
   PESAPAL IPN
========================================= */

app.post(
  "/api/pesapal/ipn",
  (req, res) => {
    console.log(
      "Pesapal IPN:",
      JSON.stringify(req.body)
    );

    return res.status(200).json({
      orderNotificationType:
        "IPNCHANGE",
      orderTrackingId:
        req.body.OrderTrackingId || "",
      orderMerchantReference:
        req.body.OrderMerchantReference || "",
      status: 200
    });
  }
);

/* =========================================
   404 API HANDLER
========================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl
  });
});

/* =========================================
   VERCEL EXPORT
========================================= */

module.exports = app;

/* =========================================
   LOCAL DEVELOPMENT
========================================= */

if (require.main === module) {
  const PORT =
    process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(
      `LetsStudy Pro Payment API running on port ${PORT}`
    );
  });
}