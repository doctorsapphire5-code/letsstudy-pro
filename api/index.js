const express = require("express");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: "*"
  })
);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true
  })
);

/*
=====================================================
LETSSTUDY PRO — PESAPAL API
Iframe + Callback + IPN + Background Verification
=====================================================
*/

const ENV =
  process.env.PESAPAL_ENV || "sandbox";

const PESAPAL_BASE =
  ENV === "production"
    ? "https://pay.pesapal.com/v3"
    : "https://cybqa.pesapal.com/pesapalv3";

const PUBLIC_WEB_URL =
  process.env.PUBLIC_WEB_URL ||
  "https://letsstudy.pro";

const API_PUBLIC_URL =
  process.env.API_PUBLIC_URL || "";


/*
=====================================================
HELPERS
=====================================================
*/

function clean(value) {
  return String(value || "").trim();
}


function getApiPublicUrl(req) {
  return (
    API_PUBLIC_URL ||
    `${req.protocol}://${req.get("host")}`
  );
}


function getPesapalStatusName(statusCode) {
  const code = Number(statusCode);

  if (code === 1) {
    return "COMPLETED";
  }

  if (code === 2) {
    return "FAILED";
  }

  if (code === 3) {
    return "REVERSED";
  }

  return "INVALID";
}


/*
=====================================================
HEALTH CHECK
=====================================================
*/

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    service: "LetsStudy Pro Payment API",
    status: "online",
    provider: "Pesapal",
    environment: ENV,
    timestamp: new Date().toISOString()
  });
});


/*
=====================================================
PESAPAL AUTHENTICATION
=====================================================
*/

async function getPesapalToken() {

  const consumerKey =
    process.env.PESAPAL_CONSUMER_KEY;

  const consumerSecret =
    process.env.PESAPAL_CONSUMER_SECRET;


  if (
    !consumerKey ||
    !consumerSecret
  ) {
    throw new Error(
      "Pesapal credentials are not configured"
    );
  }


  const response =
    await fetch(
      `${PESAPAL_BASE}/api/Auth/RequestToken`,
      {
        method: "POST",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          consumer_key:
            consumerKey,

          consumer_secret:
            consumerSecret
        })
      }
    );


  const data =
    await response.json();


  if (
    !response.ok ||
    !data.token
  ) {

    console.error(
      "Pesapal authentication error:",
      data
    );

    throw new Error(
      data.message ||
      data.error?.message ||
      "Pesapal authentication failed"
    );
  }


  return data.token;
}


/*
=====================================================
CREATE PESAPAL ORDER
=====================================================
*/

app.post(
  "/api/pesapal/create-order",
  async (req, res) => {

    try {

      const {
        orderId,
        amount,
        currency = "TZS",
        description =
          "LetsStudy Pro Payment",
        email,
        firstName = "",
        middleName = "",
        lastName = "",
        phoneNumber = "",
        countryCode = "TZ",
        line1 = "",
        city = "",
        state = ""
      } = req.body;


      /*
      -----------------------------------------------
      ORDER ID
      -----------------------------------------------
      */

      if (!orderId) {

        return res.status(400).json({
          success: false,
          message:
            "orderId is required"
        });

      }


      /*
      -----------------------------------------------
      EMAIL
      -----------------------------------------------
      */

      if (!email) {

        return res.status(400).json({
          success: false,
          message:
            "email is required"
        });

      }


      /*
      -----------------------------------------------
      AMOUNT
      -----------------------------------------------
      */

      const numericAmount =
        Number(amount);


      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <= 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid payment amount"
        });

      }


      /*
      -----------------------------------------------
      MERCHANT REFERENCE
      -----------------------------------------------
      */

      const merchantReference =
        clean(orderId)
          .replace(
            /[^a-zA-Z0-9._:-]/g,
            "-"
          )
          .slice(0, 50);


      /*
      -----------------------------------------------
      PESAPAL TOKEN
      -----------------------------------------------
      */

      const token =
        await getPesapalToken();


      /*
      -----------------------------------------------
      API URL
      -----------------------------------------------
      */

      const apiUrl =
        getApiPublicUrl(req);


      /*
      -----------------------------------------------
      CALLBACK
      -----------------------------------------------
      */

      const callbackUrl =
        `${apiUrl}/api/pesapal/callback`;


      /*
      -----------------------------------------------
      CANCELLATION URL
      -----------------------------------------------
      */

      const cancellationUrl =
        `${PUBLIC_WEB_URL}/checkout.html?payment=cancelled`;


      /*
      -----------------------------------------------
      IPN
      -----------------------------------------------
      */

      const notificationId =
        process.env.PESAPAL_IPN_ID;


      if (!notificationId) {

        return res.status(500).json({
          success: false,
          message:
            "PESAPAL_IPN_ID is not configured"
        });

      }


            /*
      -----------------------------------------------
      PESAPAL PAYLOAD
      -----------------------------------------------
      */

      const payload = {

        id:
          merchantReference,

        currency:
          clean(currency),

        amount:
          numericAmount,

        description:
          clean(description)
            .slice(0, 100),

        callback_url:
          callbackUrl,

        cancellation_url:
          cancellationUrl,

        redirect_mode:
          "TOP_WINDOW",

        notification_id:
          notificationId,

        billing_address: {

          email_address:
            clean(email),

          phone_number:
            clean(phoneNumber),

          country_code:
            clean(countryCode),

          first_name:
            clean(firstName),

          middle_name:
            clean(middleName),

          last_name:
            clean(lastName),

          line_1:
            clean(line1),

          line_2:
            "",

          city:
            clean(city),

          state:
            clean(state),

          postal_code:
            "",

          zip_code:
            ""
        }
      };


      /*
      -----------------------------------------------
      SUBMIT ORDER TO PESAPAL
      -----------------------------------------------
      */

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


      const data =
        await response.json();


      /*
      -----------------------------------------------
      CHECK PESAPAL RESPONSE
      -----------------------------------------------
      */

      if (
        !response.ok ||
        !data.redirect_url ||
        !data.order_tracking_id
      ) {

        console.error(
          "Pesapal create-order error:",
          data
        );

        return res.status(400).json({

          success: false,

          message:
            data.message ||
            data.error?.message ||
            "Pesapal order creation failed",

          data:
            data

        });
      }


      /*
      -----------------------------------------------
      SUCCESS
      -----------------------------------------------
      */

      return res.status(200).json({

        success: true,

        orderId:
          merchantReference,

        orderTrackingId:
          data.order_tracking_id,

        merchantReference:
          data.merchant_reference ||
          merchantReference,

        redirectUrl:
          data.redirect_url,

        iframeUrl:
          data.redirect_url,

        callbackUrl:

          callbackUrl,

        status:
          "PENDING"

      });


    } catch (error) {

      console.error(
        "Create order error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          error.message ||
          "Payment API error"

      });

    }

  }
);


/*
=====================================================
GET TRANSACTION STATUS
=====================================================
*/

async function getTransactionStatus(
  orderTrackingId
) {

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

    throw new Error(
      data.message ||
      data.error?.message ||
      "Unable to verify Pesapal transaction"
    );

  }


  return data;

}


/*
=====================================================
BACKGROUND PAYMENT VERIFICATION
=====================================================
*/

async function verifyPaymentInBackground(
  orderTrackingId,
  merchantReference,
  source
) {

  try {

    const data =
      await getTransactionStatus(
        orderTrackingId
      );


    const statusCode =
      Number(
        data.status_code
      );


    const paymentStatus =
      getPesapalStatusName(
        statusCode
      );


    console.log(
      JSON.stringify({

        event:
          "PESAPAL_PAYMENT_VERIFIED",

        source,

        orderTrackingId,

        merchantReference,

        paymentStatus,

        statusCode,

        amount:
          data.amount,

        currency:
          data.currency,

        paymentMethod:
          data.payment_method,

        confirmationCode:
          data.confirmation_code,

        timestamp:
          new Date().toISOString()

      })
    );


    if (
      paymentStatus ===
      "COMPLETED"
    ) {

      console.log(
        `ORDER PAID: ${merchantReference}`
      );

    }


    return {

      success: true,

      statusCode,

      paymentStatus,

      data

    };

  } catch (error) {

    console.error(
      "Background verification error:",
      error
    );


    return {

      success: false,

      message:
        error.message

    };

  }

}


/*
=====================================================
PAYMENT STATUS ENDPOINT
=====================================================
*/

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
            "orderTrackingId is required"

        });

      }


      const result =
        await getTransactionStatus(
          orderTrackingId
        );


      return res.status(200).json({

        success: true,

        orderTrackingId,

        paymentStatus:
          getPesapalStatusName(
            result.status_code
          ),

        data:
          result

      });

    } catch (error) {

      console.error(
        "Payment status error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          error.message ||
          "Unable to get payment status"

      });

    }

  }
);


/*
=====================================================
PESAPAL CALLBACK
=====================================================
*/

app.get(
  "/api/pesapal/callback",
  async (req, res) => {

    const orderTrackingId =
      clean(
        req.query.OrderTrackingId ||
        req.query.orderTrackingId
      );


    const merchantReference =
      clean(
        req.query.OrderMerchantReference ||
        req.query.orderMerchantReference
      );


    if (!orderTrackingId) {

      return res.redirect(
        302,
        `${PUBLIC_WEB_URL}/verify.html?payment=invalid`
      );

    }


    verifyPaymentInBackground(
      orderTrackingId,
      merchantReference,
      "CALLBACK"
    ).catch(
      console.error
    );


    const verifyUrl =
      `${PUBLIC_WEB_URL}/verify.html` +
      `?orderTrackingId=${encodeURIComponent(
        orderTrackingId
      )}` +
      `&orderId=${encodeURIComponent(
        merchantReference
      )}`;


    return res.redirect(
      302,
      verifyUrl
    );

  }
);


/*
=====================================================
PESAPAL IPN
=====================================================
*/

async function handleIPN(
  orderTrackingId,
  merchantReference
) {

  if (!orderTrackingId) {

    return {

      success: false,

      message:
        "OrderTrackingId missing"

    };

  }


  return verifyPaymentInBackground(
    orderTrackingId,
    merchantReference,
    "IPN"
  );

}


app.post(
  "/api/pesapal/ipn",
  async (req, res) => {

    const orderTrackingId =
      clean(
        req.body.OrderTrackingId ||
        req.body.orderTrackingId
      );


    const merchantReference =
      clean(
        req.body.OrderMerchantReference ||
        req.body.orderMerchantReference
      );


    res.status(200).json({

      orderNotificationType:
        "IPNCHANGE",

      orderTrackingId,

      orderMerchantReference:
        merchantReference,

      status:
        200

    });


    handleIPN(
      orderTrackingId,
      merchantReference
    ).catch(
      console.error
    );

  }
);


app.get(
  "/api/pesapal/ipn",
  async (req, res) => {

    const orderTrackingId =
      clean(
        req.query.OrderTrackingId ||
        req.query.orderTrackingId
      );


    const merchantReference =
      clean(
        req.query.OrderMerchantReference ||
        req.query.orderMerchantReference
      );


    res.status(200).json({

      orderNotificationType:
        "IPNCHANGE",

      orderTrackingId,

      orderMerchantReference:
        merchantReference,

      status:
        200

    });


    handleIPN(
      orderTrackingId,
      merchantReference
    ).catch(
      console.error
    );

  }
);


/*
=====================================================
MANUAL VERIFY
=====================================================
*/

app.post(
  "/api/pesapal/verify",
  async (req, res) => {

    try {

      const {
        orderTrackingId,
        merchantReference = ""
      } = req.body;


      if (!orderTrackingId) {

        return res.status(400).json({

          success: false,

          message:
            "orderTrackingId is required"

        });

      }


      const result =
        await verifyPaymentInBackground(
          clean(
            orderTrackingId
          ),

          clean(
            merchantReference
          ),

          "MANUAL"
        );


      return res.status(
        result.success
          ? 200
          : 400
      ).json(
        result
      );

    } catch (error) {

      return res.status(500).json({

        success: false,

        message:
          error.message

      });

    }

  }
);


/*
=====================================================
404
=====================================================
*/

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


/*
=====================================================
EXPORT
=====================================================
*/

module.exports = app;


/*
=====================================================
LOCAL SERVER
=====================================================
*/

if (
  require.main === module
) {

  const PORT =
    process.env.PORT || 3000;


  app.listen(
    PORT,
    "0.0.0.0",
    () => {

      console.log(
        `LetsStudy Pro Payment API running on port ${PORT}`
      );


      console.log(
        `Pesapal environment: ${ENV}`
      );


      console.log(
        `Web URL: ${PUBLIC_WEB_URL}`
      );

    }
  );

}