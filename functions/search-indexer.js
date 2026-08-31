/* =========================================================
   LETSSTUDY PRO — SEARCH API
========================================================= */

exports.searchAPI = onRequest(
  {
    region: "africa-south1",
    cors: true
  },
  async (req, res) => {
    try {
      if (req.method !== "GET") {
        return res.status(405).json({
          success: false,
          error: "GET method required."
        });
      }

      const q = String(req.query.q || "")
        .trim()
        .slice(0, 200);

      const category = String(
        req.query.category || "all"
      ).trim().toLowerCase();

      const limit = Math.min(
        Math.max(
          Number(req.query.limit) || 20,
          1
        ),
        50
      );

      if (!q) {
        return res.status(200).json({
          success: true,
          query: "",
          results: [],
          total: 0
        });
      }

      const snapshot = await db
        .collection("searchIndex")
        .where("searchable", "==", true)
        .limit(1000)
        .get();

      let results = [];

      for (const doc of snapshot.docs) {

        const data = doc.data();

        if (
          category !== "all" &&
          String(
            data.category ||
            data.type ||
            ""
          ).toLowerCase() !== category
        ) {
          continue;
        }

        const score =
          calculateScore(data, q);

        if (score <= 0) {
          continue;
        }

        results.push({
          id: doc.id,

          collection:
            data.collection || null,

          documentId:
            data.documentId || null,

          title:
            data.title ||
            data.name ||
            "Untitled",

          description:
            data.description ||
            data.summary ||
            "",

          category:
            data.category ||
            null,

          type:
            data.type ||
            null,

          image:
            data.image ||
            data.thumbnail ||
            data.imageUrl ||
            null,

          url:
            data.url ||
            null,

          keywords:
            Array.isArray(data.keywords)
              ? data.keywords
              : [],

          score
        });
      }

      results.sort(
        (a, b) =>
          b.score - a.score
      );

      const total =
        results.length;

      results =
        results.slice(0, limit);

      return res.status(200).json({
        success: true,
        query: q,
        category,
        total,
        results
      });

    } catch (error) {

      console.error(
        "SEARCH API ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Search temporarily unavailable."
      });
    }
  }
);