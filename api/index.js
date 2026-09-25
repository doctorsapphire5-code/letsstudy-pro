app.post("/api/pesapal/create-order", async (req, res) => {
  try {
    const {
      orderId,
      amount,
      currency = "TZS",
      description = "LetsStudy Pro Product",
      email,
      firstName = "LetsStudy",
      lastName = "Pro",
      phoneNumber = ""
    } = req.body || {};

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required"
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Customer email is required"
      });
    }

    const token = await getPesapalToken();

    const apiPublicUrl = getApiPublicUrl(req);

    const callbackUrl =
      `${PUBLIC_WEB_URL || "https://letsstudy.pro"}/payment.html`;

    const notificationId = PESAPAL_IPN_ID;

    if (!notificationId) {
      return res.status(500).json({
        success: false,
        message: "PESAPAL_IPN_ID is not configured"
      });
    }

    const payload = {
      id: String(orderId).substring(0, 50),

      currency: String(currency).toUpperCase(),

      amount: Number(amount),

      description: String(description).substring(0, 100),

      callback_url: callbackUrl,

      cancellation_url:
        `${PUBLIC_WEB_URL || "https://letsstudy.pro"}/payment.html?cancelled=true`,

      notification_id: notificationId,

      redirect_mode: "PARENT_WINDOW",

      billing_address: {
        email_address: String(email),
        phone_number: String(phoneNumber || ""),
        country_code: "TZ",
        first_name: String(firstName || "LetsStudy"),
        middle_name: "",
        last_name: String(lastName || "Pro"),
        line_1: "",
        line_2: "",
        city: "",
        state: "",
        postal_code: "",
        zip_code: ""
      }
    };

    console.log("PESAPAL PAYLOAD:", payload);

    const response = await fetch(
      `${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();

    console.log("PESAPAL CREATE ORDER RESPONSE:", result);

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message:
          result?.error?.message ||
          result?.message ||
          "Pesapal order creation failed",
        pesapal: result
      });
    }

    const orderTrackingId =
      result.order_tracking_id ||
      result.orderTrackingId;

    const merchantReference =
      result.merchant_reference ||
      result.merchantReference ||
      orderId;

    const redirectUrl =
      result.redirect_url ||
      result.redirectUrl;

    if (!orderTrackingId) {
      return res.status(502).json({
        success: false,
        message: "Pesapal did not return OrderTrackingId",
        pesapal: result
      });
    }

    if (!redirectUrl) {
      return res.status(502).json({
        success: false,
        message: "Pesapal did not return redirect_url",
        orderTrackingId,
        merchantReference,
        pesapal: result
      });
    }

    return res.json({
      success: true,

      orderId: String(orderId),

      merchantReference,

      orderTrackingId,

      iframeUrl: redirectUrl,

      redirectUrl,

      message: "Pesapal order created successfully"
    });

  } catch (error) {
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
});