const {
  onRequest
} = require("firebase-functions/v2/https");

const {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentDeleted
} = require("firebase-functions/v2/firestore");

const {
  defineSecret
} = require("firebase-functions/params");

const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

const {
  indexDocument,
  removeFromIndex,
  indexCollection,
  indexAllCollections,
  SEARCHABLE_COLLECTIONS
} = require("./search-indexer");


/* =========================================================
   SITE CONFIGURATION
========================================================= */

const SITE_URL = "https://letsstudy.pro";

const PESAPAL_ENV =
  process.env.PESAPAL_ENV || "sandbox";

const PESAPAL_BASE =
  PESAPAL_ENV === "production"
    ? "https://pay.pesapal.com/v3"
    : "https://cybqa.pesapal.com/pesapalv3";


/* =========================================================
   PESAPAL SECRETS
========================================================= */

const PESAPAL_CONSUMER_KEY =
  defineSecret("PESAPAL_CONSUMER_KEY");

const PESAPAL_CONSUMER_SECRET =
  defineSecret("PESAPAL_CONSUMER_SECRET");

const PESAPAL_IPN_ID =
  defineSecret("PESAPAL_IPN_ID");


/* =========================================================
   SHARE COLLECTIONS
========================================================= */

const COLLECTIONS = {
  scholarships: "scholarships",
  careers: "careers",
  courses: "courses",
  resources: "resources",
  marketplace: "marketplace"
};


/* =========================================================
   PAYMENT PRODUCT COLLECTIONS
========================================================= */

const PAYMENT_COLLECTIONS = {

  course:
    "courses",

  courses:
    "courses",

  resource:
    "resources",

  resources:
    "resources",

  service:
    "services",

  services:
    "services",

  marketplace:
    "marketplace",

  product:
    "marketplace",

  website:
    "websites",

  websites:
    "websites",

  domain:
    "domains",

  domains:
    "domains",

  subscription:
    "subscriptions",

  subscriptions:
    "subscriptions",

  membership:
    "subscriptions",

  premium:
    "premiumMembers",

  premiumMember:
    "premiumMembers",

  business:
    "businesses",

  businesses:
    "businesses",

  career:
    "careers",

  careers:
    "careers",

  scholarship:
    "scholarships",

  scholarships:
    "scholarships"
};


/* =========================================================
   SHARE PAGE URLS
========================================================= */

const PAGE_URLS = {

  scholarships:
    "scholarship.html",

  careers:
    "career.html",

  courses:
    "course.html",

  resources:
    "resource.html",

  marketplace:
    "product.html"
};


/* =========================================================
   DEFAULT SHARE IMAGE
========================================================= */

const DEFAULT_IMAGE =
  `${SITE_URL}/assets/images/og-default.jpg`;


/* =========================================================
   GENERAL HELPERS
========================================================= */

function escapeHtml(value = "") {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function cleanDescription(value = "") {

  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);

}


function normalizeEmail(value = "") {

  return String(value)
    .trim()
    .toLowerCase();

}


function normalizeAmount(value) {

  const amount =
    Number(value);

  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {

    return null;

  }

  return Number(
    amount.toFixed(2)
  );

}


function generateReference() {

  return `LSP-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)
    .toUpperCase()}`;

}


function getProductCollection(
  productType
) {

  const type =
    String(productType || "")
      .trim()
      .toLowerCase();

  return PAYMENT_COLLECTIONS[type] || null;

}


function getDocumentPrice(data = {}) {

  const candidates = [

    data.price,
    data.amount,
    data.cost,
    data.planPrice,
    data.salePrice,
    data.currentPrice,
    data.monthlyPrice,
    data.totalPrice

  ];

  for (const value of candidates) {

    const amount =
      normalizeAmount(value);

    if (
      amount !== null
    ) {

      return amount;

    }

  }

  return null;

}


function getDocumentTitle(
  data = {},
  fallback = ""
) {

  return String(
    data.title ||
    data.name ||
    data.serviceName ||
    data.productName ||
    data.courseName ||
    data.resourceName ||
    fallback ||
    "LetsStudy Pro Product"
  ).trim();

}


function splitCustomerName(
  fullName
) {

  const parts =
    String(fullName || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  return {

    firstName:
      parts.shift() || "Customer",

    lastName:
      parts.join(" ") || "Customer"

  };

}


function setCors(
  req,
  res
) {

  const origin =
    req.headers.origin || "";

  const allowed = [

    SITE_URL,
    `${SITE_URL}/`,
    "https://www.letsstudy.pro",
    "https://www.letsstudy.pro/"

  ];

  if (
    allowed.includes(origin)
  ) {

    res.set(
      "Access-Control-Allow-Origin",
      origin
    );

  }

  res.set(
    "Vary",
    "Origin"
  );

  res.set(
    "Access-Control-Allow-Methods",
    "GET,POST,OPTIONS"
  );

  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

}


/* =========================================================
   FIRESTORE PRODUCT RESOLUTION
========================================================= */

async function resolvePaymentItems(
  items
) {

  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {

    throw new Error(
      "At least one payment item is required."
    );

  }

  const verifiedItems = [];

  for (
    const item of items
  ) {

    const productType =
      String(
        item.productType ||
        item.type ||
        ""
      )
        .trim()
        .toLowerCase();

    const productId =
      String(
        item.productId ||
        item.id ||
        ""
      ).trim();

    if (
      !productType ||
      !productId
    ) {

      throw new Error(
        "Every payment item requires productType and productId."
      );

    }

    const collection =
      getProductCollection(
        productType
      );

    if (!collection) {

      throw new Error(
        `Unsupported payment product type: ${productType}`
      );

    }

    const ref =
      db
        .collection(collection)
        .doc(productId);

    const snapshot =
      await ref.get();

    if (
      !snapshot.exists
    ) {

      throw new Error(
        `Product not found: ${productType}/${productId}`
      );

    }

    const data =
      snapshot.data() || {};

    const price =
      getDocumentPrice(data);

    if (
      price === null
    ) {

      throw new Error(
        `No valid price found for ${productType}/${productId}`
      );

    }

    const quantityRaw =
      Number(
        item.quantity || 1
      );

    const quantity =
      Number.isFinite(quantityRaw) &&
      quantityRaw > 0
        ? Math.floor(quantityRaw)
        : 1;

    const title =
      getDocumentTitle(
        data,
        item.title
      );

    const subtotal =
      normalizeAmount(
        price * quantity
      );

    verifiedItems.push({

      productType,

      productId,

      collection,

      title,

      price,

      quantity,

      subtotal

    });

  }

  return verifiedItems;

}


/* =========================================================
   PESAPAL AUTHENTICATION
========================================================= */

async function getPesapalToken() {

  const key =
    PESAPAL_CONSUMER_KEY.value();

  const secret =
    PESAPAL_CONSUMER_SECRET.value();

  if (
    !key ||
    !secret
  ) {

    throw new Error(
      "Pesapal credentials are not configured."
    );

  }

  const response =
    await fetch(
      `${PESAPAL_BASE}/api/Auth/RequestToken`,
      {

        method: "POST",

        headers: {

          "Content-Type":
            "application/json",

          "Accept":
            "application/json"

        },

        body:
          JSON.stringify({

            consumer_key:
              key,

            consumer_secret:
              secret

          })

      }
    );

  const text =
    await response.text();

  let data;

  try {

    data =
      JSON.parse(text);

  } catch {

    throw new Error(
      `Pesapal authentication returned invalid JSON: ${text}`
    );

  }

  if (
    !response.ok ||
    !data.token
  ) {

    throw new Error(
      data.message ||
      data.error ||
      "Pesapal authentication failed."
    );

  }

  return data.token;

}


/* =========================================================
   PESAPAL REQUEST
========================================================= */

async function pesapalRequest(
  path,
  options = {}
) {

  const token =
    await getPesapalToken();

  const response =
    await fetch(
      `${PESAPAL_BASE}${path}`,
      {

        ...options,

        headers: {

          "Content-Type":
            "application/json",

          "Accept":
            "application/json",

          "Authorization":
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

    throw new Error(
      `Pesapal returned invalid JSON: ${text}`
    );

  }

  if (
    !response.ok
  ) {

    throw new Error(
      data.message ||
      data.error ||
      `Pesapal request failed: ${response.status}`
    );

  }

  return data;

}


/* =========================================================
   CREATE UNIVERSAL PESAPAL ORDER
========================================================= */

exports.createPesapalOrder =
  onRequest(
    {
      region:
        "africa-south1",

      secrets: [

        PESAPAL_CONSUMER_KEY,

        PESAPAL_CONSUMER_SECRET,

        PESAPAL_IPN_ID

      ]
    },

    async (req, res) => {

      setCors(
        req,
        res
      );

      if (
        req.method === "OPTIONS"
      ) {

        return res
          .status(204)
          .send("");

      }

      if (
        req.method !== "POST"
      ) {

        return res
          .status(405)
          .json({

            success: false,

            error:
              "POST method required."

          });

      }

      try {

        const body =
          req.body || {};

        const customer =
          body.customer || {};

        const fullName =
          String(
            customer.name ||
            body.fullName ||
            ""
          ).trim();

        const email =
          normalizeEmail(
            customer.email ||
            body.email ||
            ""
          );

        const customerId =
          String(
            customer.id ||
            customer.uid ||
            body.customerId ||
            body.userId ||
            ""
          ).trim();

        const currency =
          String(
            body.currency ||
            "TZS"
          )
            .trim()
            .toUpperCase();

        if (
          !fullName
        ) {

          return res
            .status(400)
            .json({

              success: false,

              error:
                "Customer name is required."

            });

        }

        if (
          !email ||
          !email.includes("@")
        ) {

          return res
            .status(400)
            .json({

              success: false,

              error:
                "Valid customer email is required."

            });

        }

        if (
          currency !== "TZS"
        ) {

          return res
            .status(400)
            .json({

              success: false,

              error:
                "Unsupported currency."

            });

        }

        const verifiedItems =
          await resolvePaymentItems(
            body.items
          );

        const totalAmount =
          normalizeAmount(
            verifiedItems.reduce(
              (
                total,
                item
              ) =>
                total +
                item.subtotal,
              0
            )
          );

        if (
          totalAmount === null ||
          totalAmount <= 0
        ) {

          return res
            .status(400)
            .json({

              success: false,

              error:
                "The calculated payment amount is invalid."

            });

        }

        const merchantReference =
          generateReference();

        const names =
          splitCustomerName(
            fullName
          );

        const callbackUrl =
          `${SITE_URL}/api/pesapal/callback`;

        const cancellationUrl =
          `${SITE_URL}/checkout.html`;

        const ipnId =
          PESAPAL_IPN_ID.value();

        if (
          !ipnId
        ) {

          throw new Error(
            "PESAPAL_IPN_ID is not configured."
          );

        }

        const orderPayload = {

          id:
            merchantReference,

          currency,

          amount:
            totalAmount,

          description:
            `LetsStudy Pro Order ${merchantReference}`,

          callback_url:
            callbackUrl,

          cancellation_url:
            cancellationUrl,

          notification_id:
            ipnId,

          redirect_mode:
            "TOP_WINDOW",

          billing_address: {

            email_address:
              email,

            first_name:
              names.firstName,

            last_name:
              names.lastName

          }

        };

        const pesapalOrder =
          await pesapalRequest(
            "/api/Transactions/SubmitOrderRequest",
            {

              method:
                "POST",

              body:
                JSON.stringify(
                  orderPayload
                )

            }
          );

        const orderTrackingId =
          pesapalOrder.order_tracking_id ||
          pesapalOrder.orderTrackingId ||
          "";

        const redirectUrl =
          pesapalOrder.redirect_url ||
          pesapalOrder.redirectUrl ||
          "";

        if (
          !orderTrackingId ||
          !redirectUrl
        ) {

          throw new Error(
            "Pesapal did not return a valid payment order."
          );

        }

        const orderRef =
          db
            .collection("orders")
            .doc(merchantReference);

        await orderRef.set({

          orderId:
            merchantReference,

          merchantReference,

          orderTrackingId,

          customerId:
            customerId || null,

          customerName:
            fullName,

          customerEmail:
            email,

          currency,

          amount:
            totalAmount,

          items:
            verifiedItems,

          provider:
            "PESAPAL",

          environment:
            PESAPAL_ENV,

          status:
            "PENDING",

          paymentStatus:
            "PENDING",

          redirectUrl,

          createdAt:
            admin.firestore.FieldValue.serverTimestamp(),

          updatedAt:
            admin.firestore.FieldValue.serverTimestamp()

        });

        return res
          .status(200)
          .json({

            success: true,

            ok: true,

            orderId:
              merchantReference,

            merchantReference,

            orderTrackingId,

            redirectUrl,

            amount:
              totalAmount,

            currency,

            status:
              "PENDING"

          });

      } catch (error) {

        console.error(
          "CREATE PESAPAL ORDER ERROR:",
          error
        );

        return res
          .status(500)
          .json({

            success: false,

            error:
              error.message ||
              "Unable to create payment order."

          });

      }

    }
  );


/* =========================================================
   VERIFY PESAPAL TRANSACTION
========================================================= */

async function verifyPesapalTransaction(
  orderTrackingId
) {

  if (
    !orderTrackingId
  ) {

    throw new Error(
      "orderTrackingId is required."
    );

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
      data.status_code
    );

  let status =
    "PENDING";

  if (
    statusCode === 1
  ) {

    status =
      "COMPLETED";

  } else if (
    statusCode === 2
  ) {

    status =
      "FAILED";

  } else if (
    statusCode === 3
  ) {

    status =
      "REVERSED";

  } else if (
    statusCode === 0
  ) {

    status =
      "INVALID";

  }

  return {

    status,

    statusCode,

    paymentStatus:
      data.payment_status_description ||
      status,

    amount:
      normalizeAmount(
        data.amount
      ),

    currency:
      data.currency || null,

    paymentMethod:
      data.payment_method || null,

    confirmationCode:
      data.confirmation_code || null,

    merchantReference:
      data.merchant_reference || null,

    raw:
      data

  };

}


/* =========================================================
   FULFILL PAYMENT
========================================================= */

async function fulfillOrder(
  orderId,
  verification
) {

  const orderRef =
    db
      .collection("orders")
      .doc(orderId);

  const orderSnapshot =
    await orderRef.get();

  if (
    !orderSnapshot.exists
  ) {

    return null;

  }

  const order =
    orderSnapshot.data() || {};

  if (
    order.paymentStatus ===
    "COMPLETED"
  ) {

    return order;

  }

  if (
    verification.status !==
    "COMPLETED"
  ) {

    await orderRef.set({

      status:
        verification.status,

      paymentStatus:
        verification.status,

      pesapalStatus:
        verification.paymentStatus,

      statusCode:
        verification.statusCode,

      updatedAt:
        admin.firestore.FieldValue.serverTimestamp()

    }, {

      merge: true

    });

    return order;

  }

  const batch =
    db.batch();

  const paymentRef =
    db
      .collection("payments")
      .doc();

  batch.set(
    paymentRef,
    {

      paymentId:
        paymentRef.id,

      orderId,

      merchantReference:
        order.merchantReference,

      orderTrackingId:
        order.orderTrackingId,

      customerId:
        order.customerId || null,

      customerName:
        order.customerName,

      customerEmail:
        order.customerEmail,

      amount:
        verification.amount ||
        order.amount,

      currency:
        verification.currency ||
        order.currency,

      provider:
        "PESAPAL",

      paymentMethod:
        verification.paymentMethod,

      confirmationCode:
        verification.confirmationCode,

      status:
        "COMPLETED",

      createdAt:
        admin.firestore.FieldValue.serverTimestamp(),

      updatedAt:
        admin.firestore.FieldValue.serverTimestamp()

    }
  );

  const transactionRef =
    db
      .collection("transactions")
      .doc();

  batch.set(
    transactionRef,
    {

      transactionId:
        transactionRef.id,

      orderId,

      paymentId:
        paymentRef.id,

      customerId:
        order.customerId || null,

            customerEmail:
        order.customerEmail,

      amount:
        verification.amount ||
        order.amount,

      currency:
        verification.currency ||
        order.currency,

      provider:
        "PESAPAL",

      paymentMethod:
        verification.paymentMethod ||
        null,

      confirmationCode:
        verification.confirmationCode ||
        null,

      status:
        "COMPLETED",

      createdAt:
        admin.firestore.FieldValue.serverTimestamp(),

      updatedAt:
        admin.firestore.FieldValue.serverTimestamp()

    }
  );


  /* =========================================
     TRANSACTION RECORD
  ========================================= */

  const transactionRef =
    db
      .collection("transactions")
      .doc();

  batch.set(
    transactionRef,
    {

      transactionId:
        transactionRef.id,

      orderId,

      paymentId:
        paymentRef.id,

      merchantReference:
        order.merchantReference,

      orderTrackingId:
        order.orderTrackingId,

      customerId:
        order.customerId ||
        null,

      customerEmail:
        order.customerEmail,

      amount:
        verification.amount ||
        order.amount,

      currency:
        verification.currency ||
        order.currency,

      provider:
        "PESAPAL",

      paymentMethod:
        verification.paymentMethod ||
        null,

      confirmationCode:
        verification.confirmationCode ||
        null,

      status:
        "COMPLETED",

      createdAt:
        admin.firestore.FieldValue.serverTimestamp(),

      updatedAt:
        admin.firestore.FieldValue.serverTimestamp()

    }
  );


  /* =========================================
     GRANT ACCESS FOR EVERY PURCHASED ITEM
  ========================================= */

  for (
    const item of order.items || []
  ) {

    const customerKey =
      order.customerId ||
      order.customerEmail;

    const accessId =
      [
        customerKey,
        item.productType,
        item.productId
      ]
        .join("_")
        .replace(
          /[^a-zA-Z0-9_-]/g,
          "_"
        );

    const accessRef =
      db
        .collection("access")
        .doc(accessId);

    batch.set(
      accessRef,
      {

        accessId,

        customerId:
          order.customerId ||
          null,

        customerEmail:
          order.customerEmail,

        orderId,

        paymentId:
          paymentRef.id,

        transactionId:
          transactionRef.id,

        productType:
          item.productType,

        productId:
          item.productId,

        collection:
          item.collection ||
          null,

        title:
          item.title,

        price:
          item.price,

        quantity:
          item.quantity,

        amount:
          item.subtotal,

        currency:
          order.currency,

        status:
          "ACTIVE",

        source:
          "PESAPAL",

        grantedAt:
          admin.firestore.FieldValue.serverTimestamp(),

        updatedAt:
          admin.firestore.FieldValue.serverTimestamp()

      },

      {
        merge: true
      }
    );

  }


  /* =========================================
     UPDATE ORDER AS PAID
  ========================================= */

  batch.set(
    orderRef,
    {

      status:
        "PAID",

      paymentStatus:
        "COMPLETED",

      pesapalStatus:
        verification.paymentStatus,

      statusCode:
        verification.statusCode,

      paymentId:
        paymentRef.id,

      transactionId:
        transactionRef.id,

      confirmationCode:
        verification.confirmationCode ||
        null,

      paidAmount:
        verification.amount ||
        order.amount,

      paidCurrency:
        verification.currency ||
        order.currency,

      paidAt:
        admin.firestore.FieldValue.serverTimestamp(),

      updatedAt:
        admin.firestore.FieldValue.serverTimestamp()

    },

    {
      merge: true
    }
  );


  await batch.commit();


  return {

    ...order,

    status:
      "PAID",

    paymentStatus:
      "COMPLETED",

    paymentId:
      paymentRef.id,

    transactionId:
      transactionRef.id

  };

}


/* =========================================================
   PAYMENT STATUS API
========================================================= */

exports.pesapalPaymentStatus =
  onRequest(
    {
      region:
        "africa-south1",

      secrets: [
        PESAPAL_CONSUMER_KEY,
        PESAPAL_CONSUMER_SECRET
      ]
    },

    async (req, res) => {

      setCors(
        req,
        res
      );


      if (
        req.method === "OPTIONS"
      ) {

        return res
          .status(204)
          .send("");

      }


      const trackingId =
        String(
          req.query.orderTrackingId ||
          req.body?.orderTrackingId ||
          ""
        ).trim();


      const orderId =
        String(
          req.query.orderId ||
          req.body?.orderId ||
          ""
        ).trim();


      if (
        !trackingId
      ) {

        return res
          .status(400)
          .json({

            success: false,

            error:
              "orderTrackingId is required."

          });

      }


      try {

        const verification =
          await verifyPesapalTransaction(
            trackingId
          );


        let resolvedOrderId =
          orderId;


        /* =====================================
           FIND ORDER BY TRACKING ID
        ===================================== */

        if (
          !resolvedOrderId
        ) {

          const result =
            await db
              .collection("orders")
              .where(
                "orderTrackingId",
                "==",
                trackingId
              )
              .limit(1)
              .get();


          if (
            !result.empty
          ) {

            resolvedOrderId =
              result.docs[0].id;

          }

        }


        /* =====================================
           FULFILL ORDER
        ===================================== */

        if (
          resolvedOrderId
        ) {

          await fulfillOrder(
            resolvedOrderId,
            verification
          );

        }


        return res
          .status(200)
          .json({

            success: true,

            orderId:
              resolvedOrderId ||
              null,

            orderTrackingId:
              trackingId,

            status:
              verification.status,

            paymentStatus:
              verification.paymentStatus,

            amount:
              verification.amount,

            currency:
              verification.currency,

            paymentMethod:
              verification.paymentMethod,

            confirmationCode:
              verification.confirmationCode,

            merchantReference:
              verification.merchantReference

          });


      } catch (error) {

        console.error(
          "PESAPAL PAYMENT STATUS ERROR:",
          error
        );


        return res
          .status(500)
          .json({

            success: false,

            error:
              error.message ||
              "Unable to verify payment."

          });

      }

    }
  );


/* =========================================================
   PESAPAL CALLBACK
========================================================= */

exports.pesapalCallback =
  onRequest(
    {
      region:
        "africa-south1"
    },

    async (req, res) => {

      try {

        const trackingId =
          String(
            req.query.OrderTrackingId ||
            req.query.orderTrackingId ||
            ""
          ).trim();


        const merchantReference =
          String(
            req.query.OrderMerchantReference ||
            req.query.orderMerchantReference ||
            ""
          ).trim();


        if (
          trackingId
        ) {

          const url =
            new URL(
              `${SITE_URL}/payment.html`
            );


          url.searchParams.set(
            "type",
            "universal"
          );


          if (
            merchantReference
          ) {

            url.searchParams.set(
              "id",
              merchantReference
            );

          }


          url.searchParams.set(
            "orderTrackingId",
            trackingId
          );


          return res
            .redirect(
              302,
              url.toString()
            );

        }


        return res
          .redirect(
            302,
            `${SITE_URL}/checkout.html`
          );


      } catch (error) {

        console.error(
          "PESAPAL CALLBACK ERROR:",
          error
        );


        return res
          .redirect(
            302,
            `${SITE_URL}/checkout.html`
          );

      }

    }
  );


/* =========================================================
   PESAPAL IPN
========================================================= */

exports.pesapalIPN =
  onRequest(
    {
      region:
        "africa-south1",

      secrets: [
        PESAPAL_CONSUMER_KEY,
        PESAPAL_CONSUMER_SECRET
      ]
    },

    async (req, res) => {

      try {

        const body =
          req.body || {};


        const trackingId =
          String(
            req.query.OrderTrackingId ||
            req.query.orderTrackingId ||
            body.OrderTrackingId ||
            body.orderTrackingId ||
            ""
          ).trim();


        const merchantReference =
          String(
            req.query.OrderMerchantReference ||
            req.query.orderMerchantReference ||
            body.OrderMerchantReference ||
            body.orderMerchantReference ||
            ""
          ).trim();


        if (
          !trackingId
        ) {

          return res
            .status(400)
            .json({

              orderNotificationType:
                "IPNCHANGE",

              orderTrackingId:
                "",

              orderMerchantReference:
                merchantReference,

              status:
                400

            });

        }


        const verification =
          await verifyPesapalTransaction(
            trackingId
          );


        let orderId =
          merchantReference;


        /* =====================================
           FIND ORDER IF REFERENCE IS MISSING
        ===================================== */

        if (
          !orderId
        ) {

          const result =
            await db
              .collection("orders")
              .where(
                "orderTrackingId",
                "==",
                trackingId
              )
              .limit(1)
              .get();


          if (
            !result.empty
          ) {

            orderId =
              result.docs[0].id;

          }

        }


        /* =====================================
           UPDATE PAYMENT
        ===================================== */

        if (
          orderId
        ) {

          await fulfillOrder(
            orderId,
            verification
          );

        }


        return res
          .status(200)
          .json({

            orderNotificationType:
              "IPNCHANGE",

            orderTrackingId:
              trackingId,

            orderMerchantReference:
              merchantReference ||
              verification.merchantReference ||
              orderId,

            status:
              200

          });


      } catch (error) {

        console.error(
          "PESAPAL IPN ERROR:",
          error
        );


        return res
          .status(500)
          .json({

            orderNotificationType:
              "IPNCHANGE",

            orderTrackingId:
              String(
                req.query.OrderTrackingId ||
                req.query.orderTrackingId ||
                ""
              ),

            orderMerchantReference:
              String(
                req.query.OrderMerchantReference ||
                req.query.orderMerchantReference ||
                ""
              ),

            status:
              500

          });

      }

    }
  );


/* =========================================================
   FIND DOCUMENT BY SLUG
========================================================= */

async function findBySlug(
  collectionName,
  slug
) {

  const collection =
    db.collection(
      collectionName
    );


  const result =
    await collection
      .where(
        "slug",
        "==",
        slug
      )
      .limit(1)
      .get();


  if (
    !result.empty
  ) {

    return result.docs[0];

  }


  const direct =
    await collection
      .doc(slug)
      .get();


  if (
    direct.exists
  ) {

    return direct;

  }


  return null;

}


/* =========================================================
   SHARE PREVIEW
========================================================= */

exports.sharePreview =
  onRequest(
    {
      region:
        "africa-south1"
    },

    async (req, res) => {

      try {

        const parts =
          req.path
            .split("/")
            .filter(Boolean);


        if (
          parts.length < 3 ||
          parts[0] !== "share"
        ) {

          return res
            .status(400)
            .send(
              "Invalid share URL."
            );

        }


        const type =
          parts[1];


        const slug =
          decodeURIComponent(
            parts
              .slice(2)
              .join("/")
          );


        if (
          !COLLECTIONS[type]
        ) {

          return res
            .status(404)
            .send(
              "Content type not found."
            );

        }


        const collection =
          COLLECTIONS[type];


        const doc =
          await findBySlug(
            collection,
            slug
          );


        if (!doc) {

          return res
            .status(404)
            .send(`
<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8">

<title>
Content Not Found | LetsStudy Pro
</title>

<meta
  name="robots"
  content="noindex, nofollow"
>

<meta
  name="viewport"
  content="width=device-width, initial-scale=1"
>

</head>

<body>

<h1>
Content Not Found
</h1>

<p>
The requested content could not be found.
</p>

</body>
</html>
            `);

        }


        const data =
          doc.data();


        const title =
          data.title ||
          data.name ||
          "LetsStudy Pro";


        const description =
          cleanDescription(
            data.shortDescription ||
            data.description ||
            data.summary ||
            `Discover this ${type} on LetsStudy Pro.`
          );


        const image =
          data.image ||
          data.imageUrl ||
          data.thumbnail ||
          data.coverImage ||
          DEFAULT_IMAGE;


        const actualSlug =
          data.slug ||
          slug;


        const canonicalUrl =
          `${SITE_URL}/${PAGE_URLS[type]}?slug=${encodeURIComponent(
            actualSlug
          )}`;


        const safeTitle =
          escapeHtml(title);


        const safeDescription =
          escapeHtml(description);


        const safeImage =
          escapeHtml(image);


        const safeCanonicalUrl =
          escapeHtml(canonicalUrl);


        res.set(
          "Cache-Control",
          "public, max-age=300"
        );


        return res
          .status(200)
          .send(`
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<title>
${safeTitle} | LetsStudy Pro
</title>

<meta
  name="description"
  content="${safeDescription}"
>

<meta
  name="robots"
  content="index, follow"
>

<link
  rel="canonical"
  href="${safeCanonicalUrl}"
>

<meta
  property="og:type"
  content="article"
>

<meta
  property="og:site_name"
  content="LetsStudy Pro"
>

<meta
  property="og:title"
  content="${safeTitle}"
>

<meta
  property="og:description"
  content="${safeDescription}"
>

<meta
  property="og:image"
  content="${safeImage}"
>

<meta
  property="og:image:secure_url"
  content="${safeImage}"
>

<meta
  property="og:image:type"
  content="image/jpeg"
>

<meta
  property="og:image:width"
  content="1200"
>

<meta
  property="og:image:height"
  content="630"
>

<meta
  property="og:url"
  content="${safeCanonicalUrl}"
>

<meta
  name="twitter:card"
  content="summary_large_image"
>

<meta
  name="twitter:title"
  content="${safeTitle}"
>

<meta
  name="twitter:description"
  content="${safeDescription}"
>

<meta
  name="twitter:image"
  content="${safeImage}"
>

<meta
  name="viewport"
  content="width=device-width, initial-scale=1"
>

</head>

<body>

<h1>
${safeTitle}
</h1>

<p>
${safeDescription}
</p>

<script>

window.location.replace(
  ${JSON.stringify(canonicalUrl)}
);

</script>

</body>

</html>
          `);


      } catch (error) {

        console.error(
          "Open Graph error:",
          error
        );


        return res
          .status(500)
          .send(
            "Unable to generate share preview."
          );

      }

    }
  );


/* =========================================================
   SEARCH INDEX — CREATE
========================================================= */

exports.indexSearchDocumentCreated =
  onDocumentCreated(
    {
      document:
        "{collectionId}/{documentId}",

      region:
        "africa-south1"
    },

    async (event) => {

      const collection =
        event.params.collectionId;


      if (
        !SEARCHABLE_COLLECTIONS.includes(
          collection
        )
      ) {

        return null;

      }


      if (
        !event.data
      ) {

        return null;

      }


      try {

        await indexDocument(
          collection,
          event.data
        );


        console.log(
          "SEARCH INDEX CREATED:",
          `${collection}/${event.params.documentId}`
        );


      } catch (error) {

        console.error(
          "SEARCH INDEX CREATE ERROR:",
          error
        );

      }


      return null;

    }
  );


/* =========================================================
   SEARCH INDEX — UPDATE
========================================================= */

exports.indexSearchDocumentUpdated =
  onDocumentUpdated(
    {
      document:
        "{collectionId}/{documentId}",

      region:
        "africa-south1"
    },

    async (event) => {

      const collection =
        event.params.collectionId;


      if (
        !SEARCHABLE_COLLECTIONS.includes(
          collection
        )
      ) {

        return null;

      }


      const snapshot =
        event.data?.after;


      if (
        !snapshot
      ) {

        return null;

      }


      try {

        await indexDocument(
          collection,
          snapshot
        );


        console.log(
          "SEARCH INDEX UPDATED:",
          `${collection}/${event.params.documentId}`
        );


      } catch (error) {

        console.error(
          "SEARCH INDEX UPDATE ERROR:",
          error
        );

      }


      return null;

    }
  );


/* =========================================================
   SEARCH INDEX — DELETE
========================================================= */

exports.indexSearchDocumentDeleted =
  onDocumentDeleted(
    {
      document:
        "{collectionId}/{documentId}",

      region:
        "africa-south1"
    },

    async (event) => {

      const collection =
        event.params.collectionId;


      if (
        !SEARCHABLE_COLLECTIONS.includes(
          collection
        )
      ) {

        return null;

      }


      const documentId =
        event.params.documentId;


      try {

        await removeFromIndex(
collection,
documentId
);
}
} catch (error) {
console.error(
"Search index delete error:",
error
);
}
}
);

module.exports = {
indexSearchDocumentCreated,
indexSearchDocumentUpdated,
indexSearchDocumentDeleted,
reindexSearch,
reindexSearchCollection
};