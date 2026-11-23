const languageButton = document.querySelector("#language-button");
const menuButton = document.querySelector("#menu-button");
const navigation = document.querySelector("#main-nav");
const searchInput = document.querySelector("#search-input");
const filterButtons = document.querySelectorAll(".filter-button");
const productCards = [...document.querySelectorAll("#product-list .product-card")];
const cartPanel = document.querySelector("#cart-panel");
const pageShade = document.querySelector("#page-shade");
const cartItemsElement = document.querySelector("#cart-items");
const cartCountElement = document.querySelector("#cart-count");
const cartTotalElement = document.querySelector("#cart-total");
const cartEmptyMessage = document.querySelector("#cart-empty");
const productModal = document.querySelector("#product-modal");
const modalImage = document.querySelector("#modal-image");

let language = "ar";
let selectedCategory = "all";
let cart = [];
let currentProduct = null;

const money = (amount) => {
  const locale = language === "ar" ? "ar-MR" : "fr-FR";
  const currency = language === "ar" ? "أوقية" : "MRU";
  return `${Number(amount).toLocaleString(locale)} ${currency}`;
};

// Remplit les sélections avec des copies des cartes du catalogue principal.
function fillFeaturedSections() {
  const groups = [
    { selector: "#new-products", flag: "new" },
    { selector: "#popular-grid", flag: "popular" },
    { selector: "#sale-grid", flag: "sale" },
  ];

  groups.forEach(({ selector, flag }) => {
    const container = document.querySelector(selector);
    productCards
      .filter((card) => card.dataset[flag] === "true")
      .slice(0, 4)
      .forEach((card) => {
        container.append(card.cloneNode(true));
      });
  });
}

function setLanguage(nextLanguage) {
  language = nextLanguage;
  const isArabic = language === "ar";
  document.documentElement.lang = language;
  document.documentElement.dir = isArabic ? "rtl" : "ltr";

  document.querySelectorAll("[data-ar][data-fr]").forEach((element) => {
    element.innerHTML = element.dataset[language];
  });

  document.querySelectorAll("[data-placeholder-ar][data-placeholder-fr]").forEach((element) => {
    element.placeholder = element.dataset[`placeholder${isArabic ? "Ar" : "Fr"}`];
  });

  document.querySelectorAll("[data-aria-ar][data-aria-fr]").forEach((element) => {
    element.setAttribute("aria-label", element.dataset[`aria${isArabic ? "Ar" : "Fr"}`]);
  });

  document.querySelectorAll("[data-alt-ar][data-alt-fr]").forEach((element) => {
    element.alt = element.dataset[`alt${isArabic ? "Ar" : "Fr"}`];
  });

  document.querySelectorAll(".product-price[data-price]").forEach((element) => {
    element.textContent = money(element.dataset.price);
  });

  languageButton.textContent = isArabic ? "Français" : "العربية";
  menuButton.setAttribute(
    "aria-label",
    navigation.classList.contains("is-open")
      ? (isArabic ? "إغلاق القائمة" : "Fermer le menu")
      : (isArabic ? "فتح القائمة" : "Ouvrir le menu"),
  );
  document.querySelector("#search-input").setAttribute(
    "aria-label",
    isArabic ? "ابحثوا عن منتج" : "Rechercher un produit",
  );
  document.title = isArabic
    ? "نكسورا ماركت — أسلوبك، اختيارك"
    : "Nexora Market — Votre style, votre choix";

  const description = document.querySelector('meta[name="description"]');
  description.content = isArabic
    ? "نكسورا ماركت — متجر للأزياء والمنتجات المختارة بعناية."
    : "Nexora Market — une boutique de mode et de produits choisis avec soin.";

  renderCart();
  filterProducts();
  if (currentProduct) showProductDetails(currentProduct);
}

function filterProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase(language);
  let visibleCount = 0;

  productCards.forEach((card) => {
    const categoryMatches = selectedCategory === "all"
      || card.dataset.category.split(" ").includes(selectedCategory);
    const name = language === "ar" ? card.dataset.nameAr : card.dataset.nameFr;
    const description = language === "ar" ? card.dataset.descriptionAr : card.dataset.descriptionFr;
    const category = card.querySelector(".product-category").textContent;
    const searchMatches = `${name} ${description} ${category}`.toLocaleLowerCase(language).includes(query);
    const visible = categoryMatches && searchMatches;

    card.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  document.querySelector("#empty-results").hidden = visibleCount > 0;
  document.querySelector("#result-count").textContent = language === "ar"
    ? `${visibleCount} منتجات`
    : `${visibleCount} produit${visibleCount === 1 ? "" : "s"}`;
}

function setCategory(category) {
  selectedCategory = category;
  filterButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === category);
  });
  filterProducts();
}

// Reconstruit le panier à partir des données conservées en mémoire.
function renderCart() {
  cartItemsElement.replaceChildren();
  let total = 0;

  cart.forEach((item) => {
    total += item.price * item.quantity;

    const row = document.createElement("article");
    row.className = "cart-item";
    row.dataset.productId = item.id;

    const image = document.createElement("img");
    image.src = item.image;
    image.alt = language === "ar" ? item.nameAr : item.nameFr;
    image.loading = "lazy";

    const details = document.createElement("div");
    const name = document.createElement("h3");
    name.textContent = language === "ar" ? item.nameAr : item.nameFr;
    const price = document.createElement("span");
    price.className = "cart-item-price";
    price.textContent = money(item.price);

    const quantity = document.createElement("div");
    quantity.className = "quantity-control";
    quantity.innerHTML = `
      <button type="button" data-cart-action="decrease" aria-label="${language === "ar" ? "تقليل الكمية" : "Diminuer la quantité"}">−</button>
      <span>${item.quantity}</span>
      <button type="button" data-cart-action="increase" aria-label="${language === "ar" ? "زيادة الكمية" : "Augmenter la quantité"}">+</button>
    `;
    details.append(name, price, quantity);

    const removeButton = document.createElement("button");
    removeButton.className = "remove-button";
    removeButton.type = "button";
    removeButton.dataset.cartAction = "remove";
    removeButton.setAttribute("aria-label", language === "ar" ? "حذف المنتج" : "Supprimer le produit");
    removeButton.textContent = "×";

    row.append(image, details, removeButton);
    cartItemsElement.append(row);
  });

  cartCountElement.textContent = cart.reduce((count, item) => count + item.quantity, 0);
  cartTotalElement.textContent = money(total);
  cartEmptyMessage.hidden = cart.length > 0;
}

function addToCart(card) {
  const id = card.dataset.productId;
  const existingItem = cart.find((item) => item.id === id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id,
      image: card.querySelector("img").getAttribute("src"),
      nameAr: card.dataset.nameAr,
      nameFr: card.dataset.nameFr,
      price: Number(card.dataset.price),
      quantity: 1,
    });
  }
  renderCart();
}

function openCart() {
  pageShade.hidden = false;
  cartPanel.classList.add("is-open");
  cartPanel.setAttribute("aria-hidden", "false");
  document.body.classList.add("has-overlay");
}

function closeCart() {
  cartPanel.classList.remove("is-open");
  cartPanel.setAttribute("aria-hidden", "true");
  pageShade.hidden = true;
  document.body.classList.remove("has-overlay");
}

function showProductDetails(card) {
  currentProduct = card;
  const isArabic = language === "ar";
  modalImage.src = card.querySelector("img").getAttribute("src");
  modalImage.alt = isArabic ? card.dataset.nameAr : card.dataset.nameFr;
  document.querySelector("#modal-category").textContent =
    card.querySelector(".product-category").textContent;
  document.querySelector("#modal-title").textContent =
    isArabic ? card.dataset.nameAr : card.dataset.nameFr;
  document.querySelector("#modal-description").textContent =
    isArabic ? card.dataset.descriptionAr : card.dataset.descriptionFr;
  document.querySelector("#modal-price").textContent = money(card.dataset.price);
  productModal.hidden = false;
  document.body.classList.add("has-overlay");
}

function closeProductDetails() {
  productModal.hidden = true;
  currentProduct = null;
  if (cartPanel.getAttribute("aria-hidden") === "true" && pageShade.hidden) {
    document.body.classList.remove("has-overlay");
  }
}

fillFeaturedSections();
setLanguage("ar");

languageButton.addEventListener("click", () => {
  setLanguage(language === "ar" ? "fr" : "ar");
});

menuButton.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute(
    "aria-label",
    isOpen
      ? (language === "ar" ? "إغلاق القائمة" : "Fermer le menu")
      : (language === "ar" ? "فتح القائمة" : "Ouvrir le menu"),
  );
});

navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    navigation.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
  }
});

searchInput.addEventListener("input", filterProducts);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => setCategory(button.dataset.filter));
});

document.querySelectorAll("[data-category-link]").forEach((button) => {
  button.addEventListener("click", () => {
    setCategory(button.dataset.categoryLink);
    document.querySelector("#all-products").scrollIntoView({ behavior: "smooth" });
  });
});

// Un seul écouteur gère les boutons du catalogue et des sélections.
document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  const viewButton = event.target.closest("[data-view]");

  if (addButton) {
    const card = addButton.closest(".product-card");
    const originalCard = productCards.find(
      (product) => product.dataset.productId === card.dataset.productId,
    );
    addToCart(originalCard);
  }

  if (viewButton) {
    const card = viewButton.closest(".product-card");
    const originalCard = productCards.find(
      (product) => product.dataset.productId === card.dataset.productId,
    );
    showProductDetails(originalCard);
  }
});

document.querySelector("#cart-button").addEventListener("click", openCart);
document.querySelector("#close-cart").addEventListener("click", closeCart);
document.querySelector("#checkout-button").addEventListener("click", closeCart);
pageShade.addEventListener("click", closeCart);
document.querySelector("#close-modal").addEventListener("click", closeProductDetails);
productModal.addEventListener("click", (event) => {
  if (event.target === productModal) closeProductDetails();
});

document.querySelector("#modal-add").addEventListener("click", () => {
  if (currentProduct) addToCart(currentProduct);
  closeProductDetails();
});

cartItemsElement.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cart-action]");
  if (!button) return;

  const row = button.closest(".cart-item");
  const item = cart.find((product) => product.id === row.dataset.productId);
  if (!item) return;

  if (button.dataset.cartAction === "increase") item.quantity += 1;
  if (button.dataset.cartAction === "decrease") item.quantity -= 1;
  if (button.dataset.cartAction === "remove" || item.quantity <= 0) {
    cart = cart.filter((product) => product.id !== item.id);
  }
  renderCart();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart();
    closeProductDetails();
    navigation.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
  }
});
