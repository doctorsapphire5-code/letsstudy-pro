/* =========================================
   LETSSTUDY PRO SHARE SYSTEM
========================================= */

window.shareContent = async function(type) {

  try {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const slug =
      params.get("slug");

    const id =
      params.get("id");

    /*
     ========================================
     DETECT CONTENT TYPE
     ========================================
    */

    const path =
      window.location.pathname
        .toLowerCase();

    let contentType =
      "scholarships";

    if (
      path.includes("career")
    ) {

      contentType =
        "careers";

    } else if (
      path.includes("course")
    ) {

      contentType =
        "courses";

    } else if (
      path.includes("resource")
    ) {

      contentType =
        "resources";

    } else if (
      path.includes("marketplace") ||
      path.includes("product")
    ) {

      contentType =
        "marketplace";

    }

    /*
     ========================================
     GET CURRENT CONTENT
     ========================================
    */

    let item = null;

    if (
      Array.isArray(window.currentItems)
    ) {

      item =
        window.currentItems.find(
          x =>
            x.slug === slug ||
            x.id === id
        );

    }

    /*
     ========================================
     FALLBACK TO GLOBAL ARRAYS
     ========================================
    */

    if (!item) {

      const arrays = [

        window.scholarships,

        window.careers,

        window.courses,

        window.resources,

        window.marketplace,

        window.products

      ];

      for (
        const array of arrays
      ) {

        if (
          Array.isArray(array)
        ) {

          const found =
            array.find(
              x =>
                x?.slug === slug ||
                x?.id === id
            );

          if (found) {

            item = found;

            break;

          }

        }

      }

    }

    /*
     ========================================
     TITLE
     ========================================
    */

    const title =
      item?.title ||
      item?.name ||
      document.title ||
      "LetsStudy Pro";

    /*
     ========================================
     DESCRIPTION
     ========================================
    */

    const description =
      item?.shortDescription ||
      item?.description ||
      "Discover opportunities on LetsStudy Pro.";

    /*
     ========================================
     SLUG
     ========================================
    */

    const finalSlug =
      item?.slug ||
      slug ||
      id;

    if (!finalSlug) {

      alert(
        "Share link haijapatikana."
      );

      return;

    }

    /*
     ========================================
     OPEN GRAPH SHARE URL
     ========================================
    */

    const shareUrl =
      `https://letsstudy.pro/share/${contentType}/${encodeURIComponent(
        finalSlug
      )}`;

    /*
     ========================================
     WHATSAPP
     ========================================
    */

    if (
      type === "whatsapp"
    ) {

      const text =
        `${title}\n\n${description}\n\n${shareUrl}`;

      window.open(
        `https://wa.me/?text=${encodeURIComponent(text)}`,
        "_blank"
      );

      return;

    }

    /*
     ========================================
     FACEBOOK
     ========================================
    */

    if (
      type === "facebook"
    ) {

      const url =
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}`;

      window.open(
        url,
        "_blank",
        "width=600,height=500"
      );

      return;

    }

    /*
     ========================================
     TELEGRAM
     ========================================
    */

    if (
      type === "telegram"
    ) {

      const url =
        `https://t.me/share/url?url=${encodeURIComponent(
          shareUrl
        )}&text=${encodeURIComponent(
          title
        )}`;

      window.open(
        url,
        "_blank"
      );

      return;

    }

    /*
     ========================================
     X
     ========================================
    */

    if (
      type === "x"
    ) {

      const url =
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          title
        )}&url=${encodeURIComponent(
          shareUrl
        )}`;

      window.open(
        url,
        "_blank"
      );

      return;

    }

    /*
     ========================================
     COPY LINK
     ========================================
    */

    if (
      type === "copy"
    ) {

      await navigator.clipboard.writeText(
        shareUrl
      );

      alert(
        "Share link imekopiwa!"
      );

      return;

    }

    /*
     ========================================
     NATIVE SHARE
     ========================================
    */

    if (
      type === "native"
    ) {

      if (
        navigator.share
      ) {

        await navigator.share({

          title,

          text: description,

          url: shareUrl

        });

      } else {

        await navigator.clipboard.writeText(
          shareUrl
        );

        alert(
          "Link imekopiwa."
        );

      }

    }

  } catch (error) {

    console.error(
      "Share error:",
      error
    );

    alert(
      "Imeshindikana kushare."
    );

  }

};