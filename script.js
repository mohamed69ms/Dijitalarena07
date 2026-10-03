
(() => {
  "use strict";

  const products = window.DIGITAL_ARENA_PRODUCTS || [];
  const categories = window.DIGITAL_ARENA_CATEGORIES || [];
  const $ = (s) => document.querySelector(s);

  let activeCategory = "all";
  let cart = JSON.parse(localStorage.getItem("djitalArenaCart") || "[]");

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));

  function renderCategories() {
    const all = `<button class="cat active" data-cat="all"><div class="ico">✨</div><h3>كل المنتجات</h3><p>عرض كامل الكتالوج</p></button>`;
    const html = all + categories.map(c => `
      <button class="cat" data-cat="${escapeHtml(c.name)}">
        <div class="ico">${c.icon}</div>
        <h3>${escapeHtml(c.name)}</h3>
        <p>${escapeHtml(c.desc)}</p>
      </button>`).join("");
    $("#categoryGrid").innerHTML = html;
    $("#categoryGrid").querySelectorAll(".cat").forEach(btn => {
      btn.addEventListener("click", () => {
        activeCategory = btn.dataset.cat;
        $("#categoryGrid").querySelectorAll(".cat").forEach(x => x.classList.toggle("active", x === btn));
        renderProducts();
        document.querySelector("#products").scrollIntoView({behavior:"smooth", block:"start"});
      });
    });
  }

  function renderProducts() {
    const q = $("#searchInput").value.trim().toLowerCase();
    const sort = $("#sortSelect").value;
    let list = products.filter(p =>
      (activeCategory === "all" || p.category === activeCategory) &&
      (!q || `${p.name} ${p.category} ${p.spec} ${p.desc}`.toLowerCase().includes(q))
    );

    if (sort === "az") list.sort((a,b) => a.name.localeCompare(b.name, "ar"));
    if (sort === "za") list.sort((a,b) => b.name.localeCompare(a.name, "ar"));

    $("#resultText").textContent = `${list.length} منتج ظاهر`;
    $("#clearSearch").style.display = q ? "block" : "none";

    $("#productGrid").innerHTML = list.length ? list.map(p => `
      <article class="card">
        <div class="card-img">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy">
          <span class="tag">${p.icon} ${escapeHtml(p.category)}</span>
        </div>
        <div class="card-body">
          <h3>${escapeHtml(p.name)}</h3>
          <div class="spec">${escapeHtml(p.spec)}</div>
          <div class="price">${escapeHtml(p.price)}</div>
          <div class="card-actions">
            <button data-details="${p.id}">التفاصيل</button>
            <button class="add" data-add="${p.id}">+ أضف للسلة</button>
          </div>
        </div>
      </article>
    `).join("") : `<div class="empty">لا توجد نتائج مطابقة. جرّب كلمة بحث أخرى.</div>`;

    $("#productGrid").querySelectorAll("[data-add]").forEach(b => b.onclick = () => addToCart(Number(b.dataset.add)));
    $("#productGrid").querySelectorAll("[data-details]").forEach(b => b.onclick = () => openModal(Number(b.dataset.details)));
  }

  function addToCart(id) {
    cart.push(id);
    saveCart();
    updateCart();
  }

  function removeFromCart(i) {
    cart.splice(i,1);
    saveCart();
    updateCart();
  }

  function saveCart() {
    localStorage.setItem("djitalArenaCart", JSON.stringify(cart));
  }

  function updateCart() {
    $("#cartCount").textContent = cart.length;
    $("#cartTotal").textContent = cart.length;

    const items = cart.map((id,i) => ({p: products.find(x => x.id === id), i})).filter(x => x.p);
    $("#cartItems").innerHTML = items.length ? items.map(x => `
      <div class="cart-item">
        <img src="${escapeHtml(x.p.image)}" alt="">
        <div><h4>${escapeHtml(x.p.name)}</h4><small>${escapeHtml(x.p.category)}</small></div>
        <button class="remove" data-remove="${x.i}">حذف</button>
      </div>`).join("") : `<div class="empty">السلة فارغة.</div>`;

    $("#cartItems").querySelectorAll("[data-remove]").forEach(b => b.onclick = () => removeFromCart(Number(b.dataset.remove)));
  }

  function toggleCart(force) {
    const drawer = $("#cartDrawer");
    const open = typeof force === "boolean" ? force : !drawer.classList.contains("open");
    drawer.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", String(!open));
  }

  function openModal(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    $("#modalBox").innerHTML = `
      <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}">
      <div class="modal-copy">
        <button class="close" id="closeModal">✕</button>
        <div style="clear:both"></div>
        <span class="eyebrow">${p.icon} ${escapeHtml(p.category)}</span>
        <h2>${escapeHtml(p.name)}</h2>
        <p>${escapeHtml(p.desc)}</p>
        <p style="margin-top:14px"><b>${escapeHtml(p.spec)}</b></p>
        <div class="price" style="margin-top:20px">${escapeHtml(p.price)}</div>
        <button class="primary full" id="modalAdd">أضف إلى السلة</button>
      </div>`;
    $("#productModal").classList.add("show");
    $("#productModal").setAttribute("aria-hidden","false");
    $("#closeModal").onclick = closeModal;
    $("#modalAdd").onclick = () => { addToCart(p.id); closeModal(); toggleCart(true); };
  }

  function closeModal() {
    $("#productModal").classList.remove("show");
    $("#productModal").setAttribute("aria-hidden","true");
  }

  function orderWhatsApp() {
    if (!cart.length) return;
    const names = cart.map(id => products.find(p => p.id === id)?.name).filter(Boolean);
    const text = "السلام عليكم Djital arena 07 by Fadi، أريد طلب:%0A- " + names.join("%0A- ") +
      "%0A%0Aرقم التواصل: 0665565242";
    window.open("https://wa.me/213665565242?text=" + text, "_blank", "noopener");
  }

  $("#cartBtn").onclick = () => toggleCart();
  $("#closeCart").onclick = () => toggleCart(false);
  $("#drawerBg").onclick = () => toggleCart(false);
  $("#orderBtn").onclick = orderWhatsApp;
  $("#emptyBtn").onclick = () => { cart=[]; saveCart(); updateCart(); };
  $("#searchInput").oninput = renderProducts;
  $("#sortSelect").onchange = renderProducts;
  $("#clearSearch").onclick = () => { $("#searchInput").value=""; renderProducts(); $("#searchInput").focus(); };
  $("#searchBtn").onclick = () => { document.querySelector("#products").scrollIntoView({behavior:"smooth"}); setTimeout(() => $("#searchInput").focus(), 350); };

  $("#productModal").onclick = e => { if (e.target.id === "productModal") closeModal(); };
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closeModal(); toggleCart(false); } });

  $("#themeBtn").onclick = () => {
    document.body.classList.toggle("light");
    localStorage.setItem("djitalArenaTheme", document.body.classList.contains("light") ? "light" : "dark");
  };
  if (localStorage.getItem("djitalArenaTheme") === "light") document.body.classList.add("light");

  $("#productCount").textContent = `${products.length}+`;
  renderCategories();
  renderProducts();
  updateCart();
})();
