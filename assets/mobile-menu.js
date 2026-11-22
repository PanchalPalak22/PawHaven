// These static pages must not depend on the original Next.js app hydrating.
(() => {
  const header = document.getElementById("site-header");
  const toggle = header?.querySelector("[data-menu-toggle]");
  const menu = header?.querySelector("dialog.tp-menu");
  if (!toggle || !menu) return;

  const desktop = window.matchMedia("(min-width: 1280px)");
  let scrollPosition = null;

  function syncState() {
    toggle.setAttribute("aria-expanded", String(menu.open));
    header.dataset.menuOpen = String(menu.open);
    // Clear any unfinished closing animation from the original app.
    delete menu.dataset.closing;
  }

  function unlockPage() {
    if (scrollPosition === null) return;
    const position = scrollPosition;
    scrollPosition = null;
    document.documentElement.classList.remove("tp-menu-open");
    document.body.style.removeProperty("--tp-menu-scroll-y");
    window.scrollTo({ top: position, behavior: "instant" });
  }

  function closeMenu(restoreFocus = true) {
    const wasOpen = menu.open;
    if (wasOpen) menu.close();
    unlockPage();
    syncState();
    if (wasOpen && restoreFocus && !desktop.matches) {
      toggle.focus({ preventScroll: true });
    }
  }

  function openMenu() {
    if (desktop.matches || menu.open) return;
    const position = window.scrollY;
    header.dataset.hidden = "false";
    delete menu.dataset.closing;
    // A modal dialog occupies the browser's top layer above hero/overlay content.
    menu.showModal();
    scrollPosition = position;
    document.body.style.setProperty("--tp-menu-scroll-y", `-${position}px`);
    document.documentElement.classList.add("tp-menu-open");
    syncState();
    menu.querySelector("[data-menu-close]")?.focus({ preventScroll: true });
  }

  // Own only menu interactions, before any legacy delegated app handlers run.
  window.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    if (toggle.contains(event.target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (menu.open) closeMenu();
      else openMenu();
      return;
    }
    if (!menu.open || !menu.contains(event.target)) return;
    const close = event.target.closest("[data-menu-close]");
    const link = event.target.closest("a[href]");
    if (close || link || event.target === menu) {
      event.stopImmediatePropagation();
      if (!link) event.preventDefault();
      closeMenu(!link);
      // Links retain their native href, including nested static-page paths.
    }
  }, true);

  menu.addEventListener("cancel", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeMenu();
  }, true);

  menu.addEventListener("close", () => {
    if (!menu.open) {
      unlockPage();
      syncState();
    }
  });

  menu.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const controls = menu.querySelectorAll("button:not(:disabled), a[href]");
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  desktop.addEventListener("change", () => {
    if (desktop.matches) closeMenu(false);
  });
  window.addEventListener("tp:navigate", () => closeMenu(false));
  window.addEventListener("pagehide", () => closeMenu(false));
  window.addEventListener("pageshow", () => closeMenu(false));
  syncState();
})();
