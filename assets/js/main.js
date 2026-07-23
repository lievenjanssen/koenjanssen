/* Koen Janssen — site interactions */
(function () {
  "use strict";

  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  /* ---- Sticky nav background on scroll ---------------------------------- */
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Mobile menu toggle ---------------------------------------------- */
  const closeMenu = () => {
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  };
  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));

  /* ---- Scroll spy: highlight active nav link --------------------------- */
  const sections = ["home", "about", "music", "placements", "video", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const linkFor = (id) => navLinks.querySelector('a[href="#' + id + '"]');

  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navLinks.querySelectorAll(".nav__link").forEach((l) => l.classList.remove("is-active"));
            const link = linkFor(entry.target.id);
            if (link) link.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ---- Reveal on scroll ------------------------------------------------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const revealObs = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealEls.forEach((el) => revealObs.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---- Players: docked audio (bottom-left) + video modal ---------------- */

  // Build the docked audio player.
  const dock = document.createElement("div");
  dock.className = "dock";
  dock.setAttribute("hidden", "");
  dock.innerHTML =
    '<div class="dock__bar">' +
      '<div class="dock__meta">' +
        '<span class="dock__eyebrow">Now playing</span>' +
        '<span class="dock__label"></span>' +
      '</div>' +
      '<button class="dock__close" type="button" aria-label="Close player">&times;</button>' +
    '</div>' +
    '<div class="dock__body"></div>';
  document.body.appendChild(dock);
  const dockBody = dock.querySelector(".dock__body");
  const dockLabel = dock.querySelector(".dock__label");

  // Build the video modal.
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.setAttribute("hidden", "");
  modal.innerHTML =
    '<div class="modal__backdrop" data-close></div>' +
    '<button class="modal__close" type="button" aria-label="Close video" data-close>&times;</button>' +
    '<div class="modal__dialog"><div class="modal__frame"></div></div>';
  document.body.appendChild(modal);
  const modalFrame = modal.querySelector(".modal__frame");

  let activeEmbed = null;
  const clearActive = () => {
    if (activeEmbed) activeEmbed.classList.remove("is-active");
    activeEmbed = null;
  };
  const setActive = (embed) => {
    clearActive();
    embed.classList.add("is-active");
    activeEmbed = embed;
  };

  // Spotify iFrame API — enables programmatic autoplay on click.
  let spotifyApiPromise = null;
  const loadSpotifyApi = () => {
    if (spotifyApiPromise) return spotifyApiPromise;
    spotifyApiPromise = new Promise((resolve) => {
      window.onSpotifyIframeApiReady = (IFrameAPI) => resolve(IFrameAPI);
      const s = document.createElement("script");
      s.src = "https://open.spotify.com/embed/iframe-api/v1";
      s.async = true;
      document.head.appendChild(s);
    });
    return spotifyApiPromise;
  };
  const spotifyUri = (embed) => {
    const src = embed.getAttribute("data-src") || "";
    const m = src.match(/(album|track|playlist|episode|show)\/([A-Za-z0-9]+)/);
    return m ? "spotify:" + m[1] + ":" + m[2] : null;
  };
  let spotifyController = null;
  const destroySpotify = () => {
    if (spotifyController) {
      try { spotifyController.destroy(); } catch (e) { /* noop */ }
      spotifyController = null;
    }
  };

  // SoundCloud widget (autoplays via the auto_play=true flag).
  const audioIframe = (embed) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("frameborder", "0");
    iframe.src = embed.getAttribute("data-src") + "&auto_play=true";
    iframe.title = "SoundCloud player";
    iframe.setAttribute("height", "166");
    iframe.setAttribute("scrolling", "no");
    iframe.allow = "autoplay";
    return iframe;
  };

  const videoIframe = (embed) => {
    const type = embed.getAttribute("data-type");
    const id = embed.getAttribute("data-id");
    const iframe = document.createElement("iframe");
    iframe.setAttribute("frameborder", "0");
    if (type === "youtube") {
      iframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      iframe.title = "YouTube video player";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    } else {
      iframe.src = "https://player.vimeo.com/video/" + id + "?autoplay=1&dnt=1";
      iframe.title = "Vimeo video player";
      iframe.allow = "autoplay; fullscreen; picture-in-picture; clipboard-write";
    }
    iframe.allowFullscreen = true;
    return iframe;
  };

  const labelFor = (embed) => {
    const album = embed.closest(".album");
    if (album) {
      const t = album.querySelector(".album__title");
      return t ? t.textContent.trim() : "";
    }
    const lbl = embed.querySelector(".embed__play-label");
    return lbl ? lbl.textContent.trim() : "";
  };

  let playToken = 0;
  const openDock = (embed) => {
    const token = ++playToken;
    destroySpotify();
    dockBody.innerHTML = "";
    dockLabel.textContent = labelFor(embed);
    dock.removeAttribute("hidden");
    requestAnimationFrame(() => dock.classList.add("is-open"));
    setActive(embed);

    if (embed.getAttribute("data-type") === "spotify") {
      // Use the Spotify iFrame API so playback starts automatically.
      const holder = document.createElement("div");
      dockBody.appendChild(holder);
      const uri = spotifyUri(embed);
      loadSpotifyApi().then((API) => {
        if (token !== playToken) return; // dock closed or switched meanwhile
        API.createController(holder, { uri: uri, width: "100%", height: 152 }, (controller) => {
          if (token !== playToken) { try { controller.destroy(); } catch (e) {} return; }
          spotifyController = controller;
          controller.addListener("ready", () => {
            if (token === playToken) { try { controller.play(); } catch (e) {} }
          });
          try { controller.play(); } catch (e) { /* will retry on ready */ }
        });
      });
    } else {
      // SoundCloud autoplays via the auto_play=true flag on the widget.
      dockBody.appendChild(audioIframe(embed));
    }
  };
  const closeDock = () => {
    playToken++;
    dock.classList.remove("is-open");
    destroySpotify();
    dockBody.innerHTML = "";
    dock.setAttribute("hidden", "");
    clearActive();
  };

  const openModal = (embed) => {
    modalFrame.innerHTML = "";
    modalFrame.appendChild(videoIframe(embed));
    modal.removeAttribute("hidden");
    requestAnimationFrame(() => modal.classList.add("is-open"));
    document.body.classList.add("no-scroll");
  };
  const closeModal = () => {
    modal.classList.remove("is-open");
    modalFrame.innerHTML = "";
    modal.setAttribute("hidden", "");
    document.body.classList.remove("no-scroll");
  };

  dock.querySelector(".dock__close").addEventListener("click", closeDock);
  modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));

  document.querySelectorAll(".embed").forEach((embed) => {
    const trigger = embed.querySelector(".embed__play, .vid__thumb");
    if (!trigger) return;
    trigger.addEventListener("click", () => {
      const type = embed.getAttribute("data-type");
      if (type === "youtube" || type === "vimeo") openModal(embed);
      else openDock(embed);
    });
  });

  /* ---- Global keyboard: Escape closes menu / modal / dock --------------- */
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeMenu();
    if (!modal.hasAttribute("hidden")) closeModal();
    else if (!dock.hasAttribute("hidden")) closeDock();
  });

  /* ---- Contact form (Web3Forms) ---------------------------------------- */
  const contactForm = document.getElementById("contactForm");
  const contactStatus = document.getElementById("contactStatus");
  if (contactForm && contactStatus) {
    const submitBtn = contactForm.querySelector(".contact__submit");
    const setStatus = (msg, state) => {
      contactStatus.textContent = msg;
      contactStatus.classList.remove("is-success", "is-error");
      if (state) contactStatus.classList.add("is-" + state);
    };

    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!contactForm.reportValidity()) return;

      const data = Object.fromEntries(new FormData(contactForm));
      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Sending\u2026";
      setStatus("", null);

      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        const result = await res.json().catch(() => ({}));
        if (res.ok && result.success) {
          setStatus("Thanks \u2014 your message has been sent. I\u2019ll get back to you soon.", "success");
          contactForm.reset();
        } else {
          setStatus(
            (result && result.message) || "Something went wrong. Please try again or email me directly.",
            "error"
          );
        }
      } catch (err) {
        setStatus("Network error. Please try again or email me directly.", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  /* ---- Current year in footer ------------------------------------------ */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
