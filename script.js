document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".site-nav");

  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isExpanded));
      menuButton.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
      navigation.classList.toggle("is-open", !isExpanded);
    });

    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a") && window.matchMedia("(max-width: 680px)").matches) {
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation");
        navigation.classList.remove("is-open");
      }
    });
  }

  const cards = [...document.querySelectorAll(".article-card")];
  if (cards.length) {
    const searchInput = document.querySelector("#article-search");
    const filterButtons = [...document.querySelectorAll(".category-chip")];
    const count = document.querySelector("#visible-count");
    const emptyState = document.querySelector("#empty-state");
    let activeCategory = "all";

    const updateArticles = () => {
      const query = searchInput.value.trim().toLowerCase();
      let visible = 0;

      cards.forEach((card) => {
        const matchesCategory = activeCategory === "all" || card.dataset.category === activeCategory;
        const matchesSearch = `${card.dataset.search} ${card.textContent}`.toLowerCase().includes(query);
        const isVisible = matchesCategory && matchesSearch;
        card.hidden = !isVisible;
        if (isVisible) visible += 1;
      });

      count.textContent = String(visible);
      emptyState.hidden = visible !== 0;
    };

    searchInput.addEventListener("input", updateArticles);
    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.category;
        filterButtons.forEach((item) => {
          const isActive = item === button;
          item.classList.toggle("active", isActive);
          item.setAttribute("aria-pressed", String(isActive));
        });
        updateArticles();
      });
    });
  }

  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
});
