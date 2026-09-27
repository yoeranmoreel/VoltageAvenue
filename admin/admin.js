// ========================================
// VOLTAGE AVENUE - MERCH ADMIN
// ========================================

import {
    auth,
    db
} from "../firebase.js";

import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from
    "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";


import {
    collection,
    doc,
    deleteDoc,
    getDoc,
    getDocs,
    runTransaction,
    setDoc,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


// ========================================
// AUTHENTICATION
// ========================================

const loginScreen =
    document.querySelector(
        "[data-auth-login]"
    );

const adminApp =
    document.querySelector(
        "[data-auth-admin]"
    );

const loginForm =
    document.querySelector(
        "[data-login-form]"
    );

const loginError =
    document.querySelector(
        "[data-login-error]"
    );

const loginButton =
    document.querySelector(
        "[data-login-button]"
    );

const logoutButton =
    document.querySelector(
        "[data-logout]"
    );


function showLoginError(message) {

    if (!loginError) {
        return;
    }

    loginError.textContent =
        message;

    loginError.hidden =
        !message;

}


function setLoginBusy(isBusy) {

    if (!loginButton) {
        return;
    }

    loginButton.disabled =
        isBusy;

    loginButton.textContent =
        isBusy
            ? "Inloggen..."
            : "Inloggen";

}


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            showLoginError("");
            setLoginBusy(true);

            const formData =
                new FormData(loginForm);

            const email =
                String(
                    formData.get("email") || ""
                ).trim();

            const password =
                String(
                    formData.get("password") || ""
                );

            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                loginForm.reset();

            }

            catch (error) {

                console.error(
                    "Inloggen mislukt:",
                    error
                );

                showLoginError(
                    "Inloggen mislukt. Controleer je e-mailadres en wachtwoord."
                );

            }

            finally {

                setLoginBusy(false);

            }

        }
    );

}


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

            }

            catch (error) {

                console.error(
                    "Uitloggen mislukt:",
                    error
                );

            }

        }
    );

}


// Firebase onthoudt de sessie automatisch.
// We tonen de admin pas nadat Firebase de
// huidige gebruiker heeft bevestigd.

onAuthStateChanged(
    auth,
    (user) => {

        if (loginScreen) {
            loginScreen.hidden =
                Boolean(user);
        }

        if (adminApp) {
            adminApp.hidden =
                !user;
        }

        if (user) {
            openAdminPage("dashboard");
            loadAdminProducts();
        }

        if (!user) {
            showLoginError("");
        }

    }
);


// ========================================
// ADMIN PAGINA'S
// ========================================

const navigationButtons =
    document.querySelectorAll("[data-admin-page]");

const adminPages =
    document.querySelectorAll("[data-admin-content]");


// ========================================
// PAGINA OPENEN
// ========================================

function openAdminPage(pageName) {

    adminPages.forEach((page) => {

        const isActive =
            page.dataset.adminContent === pageName;

        page.classList.toggle(
            "is-active",
            isActive
        );

    });


    navigationButtons.forEach((button) => {

        const isActive =
            button.dataset.adminPage === pageName;

        button.classList.toggle(
            "is-active",
            isActive
        );

    });


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ========================================
// NAVIGATIE
// ========================================

navigationButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const pageName =
            button.dataset.adminPage;

        if (pageName) {
            openAdminPage(pageName);
        }

    });

});




// ========================================
// DASHBOARD VIEWPORT MEASUREMENT
// ========================================

function updateDashboardViewport() {
    const header =
        document.querySelector(".admin-header");

    if (!header) return;

    /*
        Use the header's ACTUAL bottom edge in the viewport instead of only
        its height. This also accounts for any top inset/margin/browser layout.
    */
    const rect =
        header.getBoundingClientRect();

    document.documentElement.style.setProperty(
        "--admin-header-bottom",
        `${Math.ceil(rect.bottom)}px`
    );
}

function scheduleDashboardViewportUpdate() {
    updateDashboardViewport();

    requestAnimationFrame(() => {
        updateDashboardViewport();

        requestAnimationFrame(
            updateDashboardViewport
        );
    });
}

window.addEventListener(
    "resize",
    scheduleDashboardViewportUpdate,
    { passive: true }
);

window.addEventListener(
    "orientationchange",
    scheduleDashboardViewportUpdate
);

window.addEventListener(
    "load",
    scheduleDashboardViewportUpdate
);

document.fonts?.ready.then(
    scheduleDashboardViewportUpdate
);

const adminHeader =
    document.querySelector(".admin-header");

if (adminHeader && "ResizeObserver" in window) {
    const headerResizeObserver =
        new ResizeObserver(
            scheduleDashboardViewportUpdate
        );

    headerResizeObserver.observe(adminHeader);
}

scheduleDashboardViewportUpdate();


// ========================================
// MOBILE DASHBOARD + MENU
// ========================================

const mobileMenu = document.querySelector("[data-mobile-menu]");
const mobileMenuToggle = document.querySelector("[data-mobile-menu-toggle]");

function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.hidden = true;
    mobileMenuToggle?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("admin-menu-open");
}

function openMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.hidden = false;
    mobileMenuToggle?.setAttribute("aria-expanded", "true");
    document.body.classList.add("admin-menu-open");
}

mobileMenuToggle?.addEventListener("click", () => {
    mobileMenu?.hidden ? openMobileMenu() : closeMobileMenu();
});

document.querySelectorAll("[data-mobile-menu-close]").forEach((button) => {
    button.addEventListener("click", closeMobileMenu);
});

document.querySelectorAll("[data-dashboard-go]").forEach((button) => {
    button.addEventListener("click", () => {
        openAdminPage(button.dataset.dashboardGo);
    });
});

document.querySelectorAll("[data-mobile-go]").forEach((button) => {
    button.addEventListener("click", () => {
        openAdminPage(button.dataset.mobileGo);
        closeMobileMenu();
    });
});

document.querySelector("[data-mobile-logout]")?.addEventListener("click", () => {
    closeMobileMenu();
    logoutButton?.click();
});


// ========================================
// PRODUCTOVERZICHT UIT FIRESTORE
// ========================================

const adminProductList =
    document.querySelector(
        ".admin-product-list"
    );

let adminProducts = [];
let editingProductId = null;

const merchSplitInput =
    document.querySelector("[data-split-merch]");

const bandSplitInput =
    document.querySelector("[data-split-band]");

const splitHelp =
    document.querySelector("[data-split-help]");

const deleteProductButton =
    document.querySelector("[data-delete-product]");


function syncRevenueSplit(source) {

    if (
        !merchSplitInput ||
        !bandSplitInput
    ) {
        return;
    }

    const input =
        source === "merch"
            ? merchSplitInput
            : bandSplitInput;

    const other =
        source === "merch"
            ? bandSplitInput
            : merchSplitInput;

    if (input.value === "") {
        other.value = "";
        return;
    }

    const value =
        Math.min(
            100,
            Math.max(
                0,
                Number(input.value) || 0
            )
        );

    input.value =
        String(value);

    other.value =
        String(100 - value);

    if (splitHelp) {
        splitHelp.textContent =
            `Merch Girl ${merchSplitInput.value}% · Band ${bandSplitInput.value}% · totaal 100%`;
    }

}


merchSplitInput?.addEventListener(
    "input",
    () => syncRevenueSplit("merch")
);

bandSplitInput?.addEventListener(
    "input",
    () => syncRevenueSplit("band")
);


function formatAdminPrice(value) {

    return new Intl.NumberFormat(
        "nl-NL",
        {
            style: "currency",
            currency: "EUR"
        }
    ).format(Number(value) || 0);

}


function getTotalStock(product) {

    if (
        product.stock &&
        typeof product.stock === "object" &&
        !Array.isArray(product.stock)
    ) {

        return Object.values(product.stock)
            .reduce(
                (total, amount) =>
                    total + (Number(amount) || 0),
                0
            );

    }

    return Number(product.stock) || 0;

}


function getAdminImageUrl(path) {

    if (!path) {
        return "";
    }

    if (
        path.startsWith("http://") ||
        path.startsWith("https://")
    ) {
        return path;
    }

    return `../${path}`;

}


function createAdminProductCard(product) {

    const card =
        document.createElement("article");

    card.className =
        "admin-product-card";


    const imageWrapper =
        document.createElement("div");

    imageWrapper.className =
        "admin-product-image";


    const mainImage =
        Array.isArray(product.images)
            ? product.images[0]
            : null;


    if (mainImage) {

        const image =
            document.createElement("img");

        image.src =
            getAdminImageUrl(mainImage);

        image.alt =
            product.name || "";

        image.loading =
            "lazy";

        imageWrapper.appendChild(image);

    }


    const info =
        document.createElement("div");

    info.className =
        "admin-product-info";


    const status =
        document.createElement("span");

    status.className =
        product.visible
            ? "admin-status is-visible"
            : "admin-status";

    status.textContent =
        product.visible
            ? "Zichtbaar"
            : "Verborgen";


    const name =
        document.createElement("h2");

    name.textContent =
        product.name || "Naamloos product";


    const category =
        document.createElement("p");

    category.textContent =
        product.category || "Merch";


    info.append(
        status,
        name,
        category
    );


    const price =
        document.createElement("div");

    price.className =
        "admin-product-price";

    price.textContent =
        formatAdminPrice(product.price);


    const stock =
        document.createElement("div");

    stock.className =
        "admin-product-stock";


    const stockLabel =
        document.createElement("span");

    stockLabel.textContent =
        "Voorraad";


    const stockValue =
        document.createElement("strong");

    stockValue.textContent =
        String(getTotalStock(product));


    stock.append(
        stockLabel,
        stockValue
    );


    const editButton =
        document.createElement("button");

    editButton.className =
        "admin-button admin-button-secondary";

    editButton.type =
        "button";

    editButton.textContent =
        "Bewerken";

    editButton.dataset.editProduct =
        product.id;

    editButton.addEventListener(
        "click",
        () => {

            openProductForEditing(
                product.id
            );

        }
    );


    card.append(
        imageWrapper,
        info,
        price,
        stock,
        editButton
    );


    return card;

}


async function loadAdminProducts() {

    if (!adminProductList) {
        return;
    }


    adminProductList.innerHTML =
        '<p class="admin-muted">Producten laden...</p>';


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        const products =
            snapshot.docs.map(
                (document) => ({
                    id: document.id,
                    ...document.data()
                })
            );

        adminProducts = products;


        products.sort(
            (a, b) => {

                const orderA =
                    Number.isFinite(Number(a.sortOrder))
                        ? Number(a.sortOrder)
                        : 9999;

                const orderB =
                    Number.isFinite(Number(b.sortOrder))
                        ? Number(b.sortOrder)
                        : 9999;


                if (orderA !== orderB) {
                    return orderA - orderB;
                }


                return String(a.name || "")
                    .localeCompare(
                        String(b.name || ""),
                        "nl"
                    );

            }
        );


        adminProductList.innerHTML =
            "";


        if (products.length === 0) {

            adminProductList.innerHTML =
                '<p class="admin-muted">Nog geen producten gevonden.</p>';

            return;

        }


        products.forEach(
            (product) => {

                adminProductList.appendChild(
                    createAdminProductCard(product)
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Productoverzicht laden mislukt:",
            error
        );

        adminProductList.innerHTML =
            '<p class="admin-muted">Producten konden niet worden geladen.</p>';

    }

}


// ========================================
// PRODUCT TOEVOEGEN
// ========================================

const openNewProductButton =
    document.querySelector(
        "[data-open-new-product]"
    );

if (openNewProductButton) {

    openNewProductButton.addEventListener(
        "click",
        () => {

            resetProductForm();
            openAdminPage("new-product");

        }
    );

}


// ========================================
// PRODUCT BEWERKEN
// ========================================

const productFormTitle =
    document.querySelector(
        "[data-product-form-title]"
    );

const productFormIntro =
    document.querySelector(
        "[data-product-form-intro]"
    );


function setProductFormMode(product = null) {

    const submitButton =
        productForm?.querySelector(
            'button[type="submit"]'
        );

    if (product) {

        editingProductId =
            product.id;

        if (productFormTitle) {
            productFormTitle.textContent =
                "Product bewerken";
        }

        if (productFormIntro) {
            productFormIntro.textContent =
                `Wijzig ${product.name || "dit product"}.`;
        }

        if (submitButton) {
            submitButton.textContent =
                "Wijzigingen opslaan";
        }

        if (deleteProductButton) {
            deleteProductButton.hidden =
                false;
        }

    }

    else {

        editingProductId =
            null;

        if (productFormTitle) {
            productFormTitle.textContent =
                "Product toevoegen";
        }

        if (productFormIntro) {
            productFormIntro.textContent =
                "Maak een nieuw product voor de webshop.";
        }

        if (submitButton) {
            submitButton.textContent =
                "Product opslaan";
        }

        if (deleteProductButton) {
            deleteProductButton.hidden =
                true;
        }

    }

}


function resetVariantRows() {

    if (!variantList) {
        return;
    }

    variantList.innerHTML = "";

    variantList.appendChild(
        createVariantRow()
    );

}


function resetProductForm() {

    if (!productForm) {
        return;
    }

    productForm.reset();

    setProductFormMode(null);

    selectedImages = [];

    resetVariantRows();

    if (variantToggle) {
        variantToggle.checked = false;
    }

    updateVariantVisibility();

    const visibleInput =
        productForm.elements.visible;

    if (visibleInput) {
        visibleInput.checked = true;
    }

    if (merchSplitInput) {
        merchSplitInput.value = "";
    }

    if (bandSplitInput) {
        bandSplitInput.value = "";
    }

    if (splitHelp) {
        splitHelp.textContent =
            "Vul één percentage in; het andere wordt automatisch aangevuld tot 100%.";
    }

    const message =
        productForm.querySelector(
            "[data-product-save-message]"
        );

    message?.remove();

    loadShopImages();
renderShowSales();

}


async function openProductForEditing(productId) {

    try {

        let product =
            adminProducts.find(
                (item) =>
                    item.id === productId
            );

        if (!product) {

            const snapshot =
                await getDoc(
                    doc(
                        db,
                        "products",
                        productId
                    )
                );

            if (!snapshot.exists()) {
                throw new Error(
                    "Product bestaat niet meer."
                );
            }

            product = {
                id: snapshot.id,
                ...snapshot.data()
            };

        }


        setProductFormMode(product);

        productForm.elements.name.value =
            product.name || "";

        productForm.elements.category.value =
            product.category || "";

        productForm.elements.price.value =
            Number(product.price) || 0;

        productForm.elements.description.value =
            product.description || "";

        productForm.elements.visible.checked =
            product.visible !== false;


        if (merchSplitInput) {
            merchSplitInput.value =
                product.revenueSplit?.merchGirl ?? "";
        }

        if (bandSplitInput) {
            bandSplitInput.value =
                product.revenueSplit?.band ?? "";
        }

        if (
            splitHelp &&
            product.revenueSplit
        ) {
            splitHelp.textContent =
                `Merch Girl ${product.revenueSplit.merchGirl}% · Band ${product.revenueSplit.band}% · totaal 100%`;
        }


        const hasVariants =
            Boolean(product.hasVariants) ||
            (
                product.stock &&
                typeof product.stock === "object" &&
                !Array.isArray(product.stock)
            );

        variantToggle.checked =
            hasVariants;

        updateVariantVisibility();


        if (hasVariants) {

            productForm.elements.variantLabel.value =
                product.variantLabel || "Variant";

            variantList.innerHTML = "";

            Object.entries(
                product.stock || {}
            ).forEach(
                ([name, amount]) => {

                    const row =
                        createVariantRow();

                    const inputs =
                        row.querySelectorAll(
                            "input"
                        );

                    inputs[0].value =
                        name;

                    inputs[1].value =
                        Number(amount) || 0;

                    variantList.appendChild(
                        row
                    );

                }
            );

            if (
                variantList.children.length === 0
            ) {
                variantList.appendChild(
                    createVariantRow()
                );
            }

        }

        else {

            productForm.elements.stock.value =
                Number(product.stock) || 0;

        }


        selectedImages =
            Array.isArray(product.images)
                ? product.images.map(
                    (path) => ({
                        path,
                        url: getAdminImageUrl(path)
                    })
                )
                : [];


        await loadShopImages();

        openAdminPage(
            "new-product"
        );

    }

    catch (error) {

        console.error(
            "Product openen mislukt:",
            error
        );

        window.alert(
            "Dit product kon niet worden geopend."
        );

    }

}


// ========================================
// PRODUCT ANNULEREN
// ========================================

const cancelProductButton =
    document.querySelector(
        "[data-cancel-product]"
    );

if (cancelProductButton) {

    cancelProductButton.addEventListener(
        "click",
        () => {

            resetProductForm();
            openAdminPage("products");

        }
    );

}


// ========================================
// VARIANTEN AAN / UIT
// ========================================

const variantToggle =
    document.querySelector(
        "[data-variant-toggle]"
    );

const variantsSection =
    document.querySelector(
        "[data-variants]"
    );

const simpleStockSection =
    document.querySelector(
        "[data-simple-stock]"
    );


function updateVariantVisibility() {

    if (
        !variantToggle ||
        !variantsSection ||
        !simpleStockSection
    ) {
        return;
    }


    const hasVariants =
        variantToggle.checked;


    variantsSection.hidden =
        !hasVariants;

    simpleStockSection.hidden =
        hasVariants;

}


if (variantToggle) {

    variantToggle.addEventListener(
        "change",
        updateVariantVisibility
    );

    updateVariantVisibility();

}


// ========================================
// VARIANT TOEVOEGEN
// ========================================

const addVariantButton =
    document.querySelector(
        "[data-add-variant]"
    );

const variantList =
    document.querySelector(
        "[data-variant-list]"
    );


function createVariantRow() {

    const row =
        document.createElement("div");

    row.className =
        "admin-variant-row";


    const nameInput =
        document.createElement("input");

    nameInput.type = "text";

    nameInput.placeholder =
        "Bijvoorbeeld: M";

    nameInput.setAttribute(
        "aria-label",
        "Variant"
    );


    const stockInput =
        document.createElement("input");

    stockInput.type = "number";

    stockInput.min = "0";
    stockInput.step = "1";
    stockInput.value = "0";

    stockInput.setAttribute(
        "aria-label",
        "Voorraad"
    );


    const removeButton =
        document.createElement("button");

    removeButton.className =
        "admin-icon-button";

    removeButton.type =
        "button";

    removeButton.setAttribute(
        "aria-label",
        "Verwijder variant"
    );

    removeButton.textContent =
        "×";


    row.appendChild(nameInput);
    row.appendChild(stockInput);
    row.appendChild(removeButton);

    return row;

}


if (
    addVariantButton &&
    variantList
) {

    addVariantButton.addEventListener(
        "click",
        () => {

            const newRow =
                createVariantRow();

            variantList.appendChild(
                newRow
            );


            const firstInput =
                newRow.querySelector(
                    'input[type="text"]'
                );

            firstInput?.focus();

        }
    );

}


// ========================================
// VARIANT VERWIJDEREN
// ========================================

if (variantList) {

    variantList.addEventListener(
        "click",
        (event) => {

            const removeButton =
                event.target.closest(
                    ".admin-icon-button"
                );

            if (!removeButton) {
                return;
            }


            const row =
                removeButton.closest(
                    ".admin-variant-row"
                );

            if (!row) {
                return;
            }


            const rows =
                variantList.querySelectorAll(
                    ".admin-variant-row"
                );


            if (rows.length === 1) {

                const inputs =
                    row.querySelectorAll(
                        "input"
                    );

                inputs.forEach((input) => {

                    if (
                        input.type === "number"
                    ) {
                        input.value = "0";
                    }

                    else {
                        input.value = "";
                    }

                });

                return;

            }


            row.remove();

        }
    );

}


// ========================================
// PRODUCTFOTO'S
// ========================================

const imagePicker =
    document.querySelector(
        ".admin-image-picker"
    );


// Geselecteerde afbeeldingen worden in deze
// volgorde opgeslagen.
//
// selectedImages[0] = hoofdfoto.

let selectedImages = [];


// ========================================
// MANIFEST LADEN
// ========================================

async function loadShopImages() {

    if (!imagePicker) {
        return;
    }


    imagePicker.innerHTML = `
        <p class="admin-empty-state">
            Productfoto's laden...
        </p>
    `;


    try {

        const response =
            await fetch(
                "../shop-images.json",
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Manifest kon niet worden geladen (${response.status})`
            );

        }


        const manifest =
            await response.json();


        if (
            !Array.isArray(manifest.images) ||
            manifest.images.length === 0
        ) {

            showImagePickerError(
                "Er staan nog geen afbeeldingen in het manifest."
            );

            return;

        }


        renderImagePicker(
            manifest.basePath,
            manifest.images
        );

    }

    catch (error) {

        console.error(
            "Fout bij laden productfoto's:",
            error
        );


        showImagePickerError(
            "De productfoto's konden niet worden geladen."
        );

    }

}


// ========================================
// FOUTMELDING FOTO'S
// ========================================

function showImagePickerError(message) {

    if (!imagePicker) {
        return;
    }


    imagePicker.innerHTML = `
        <div class="admin-image-error">
            <strong>Foto's niet beschikbaar</strong>
            <span>${message}</span>
        </div>
    `;

}


// ========================================
// FOTOKIEZER RENDEREN
// ========================================

function renderImagePicker(
    basePath,
    images
) {

    if (!imagePicker) {
        return;
    }


    imagePicker.innerHTML = "";


    // ----------------------------------------
    // Geselecteerde foto's
    // ----------------------------------------

    const selectedSection =
        document.createElement("div");

    selectedSection.className =
        "admin-selected-images";


    const selectedHeading =
        document.createElement("div");

    selectedHeading.className =
        "admin-image-picker-heading";

    selectedHeading.innerHTML = `
        <div>
            <strong>Geselecteerde foto's</strong>
            <span>
                Foto 1 wordt de hoofdfoto.
            </span>
        </div>

        <span
            class="admin-image-count"
            data-selected-image-count
        >
            0 geselecteerd
        </span>
    `;


    const selectedGrid =
        document.createElement("div");

    selectedGrid.className =
        "admin-selected-image-grid";

    selectedGrid.setAttribute(
        "data-selected-image-grid",
        ""
    );


    selectedSection.appendChild(
        selectedHeading
    );

    selectedSection.appendChild(
        selectedGrid
    );


    // ----------------------------------------
    // Beschikbare foto's
    // ----------------------------------------

    const availableSection =
        document.createElement("div");

    availableSection.className =
        "admin-available-images";


    const availableHeading =
        document.createElement("div");

    availableHeading.className =
        "admin-image-picker-heading";

    availableHeading.innerHTML = `
        <div>
            <strong>Beschikbare foto's</strong>
            <span>
                Tik op een foto om hem te selecteren.
            </span>
        </div>
    `;


    const imageGrid =
        document.createElement("div");

    imageGrid.className =
        "admin-image-grid";


    images.forEach((filename) => {

        const fullPath =
            `../${basePath}${filename}`;


        const button =
            document.createElement("button");

        button.type =
            "button";

        button.className =
            "admin-image-option";

        button.dataset.imagePath =
            `${basePath}${filename}`;

        button.dataset.imageUrl =
            fullPath;


        const readableName =
            getReadableImageName(
                filename
            );


        button.setAttribute(
            "aria-label",
            `Selecteer ${readableName}`
        );


        button.innerHTML = `
            <span class="admin-image-option-preview">
                <img
                    src="${fullPath}"
                    alt=""
                    loading="lazy"
                >

                <span class="admin-image-check">
                    ✓
                </span>
            </span>

            <span class="admin-image-option-name">
                ${readableName}
            </span>
        `;


        button.addEventListener(
            "click",
            () => {

                toggleProductImage(
                    button
                );

            }
        );


        imageGrid.appendChild(
            button
        );

    });


    availableSection.appendChild(
        availableHeading
    );

    availableSection.appendChild(
        imageGrid
    );


    imagePicker.appendChild(
        selectedSection
    );

    imagePicker.appendChild(
        availableSection
    );


    updateSelectedImages();

}


// ========================================
// BESTANDSNAAM LEESBAAR MAKEN
// ========================================

function getReadableImageName(
    filename
) {

    return filename
        .replace(/\.[^/.]+$/, "")
        .replace(/^\d+_/, "")
        .replaceAll("_", " ")
        .replaceAll("-", " ");

}


// ========================================
// FOTO SELECTEREN / DESELECTEREN
// ========================================

function toggleProductImage(button) {

    const imagePath =
        button.dataset.imagePath;

    const imageUrl =
        button.dataset.imageUrl;


    if (!imagePath || !imageUrl) {
        return;
    }


    const existingIndex =
        selectedImages.findIndex(
            (image) =>
                image.path === imagePath
        );


    // ----------------------------------------
    // Foto stond al geselecteerd:
    // verwijderen
    // ----------------------------------------

    if (existingIndex !== -1) {

        selectedImages.splice(
            existingIndex,
            1
        );

    }


    // ----------------------------------------
    // Nieuwe selectie:
    // achteraan toevoegen
    // ----------------------------------------

    else {

        selectedImages.push({
            path: imagePath,
            url: imageUrl
        });

    }


    updateSelectedImages();

}


// ========================================
// GESELECTEERDE FOTO'S BIJWERKEN
// ========================================

function updateSelectedImages() {

    if (!imagePicker) {
        return;
    }


    const selectedGrid =
        imagePicker.querySelector(
            "[data-selected-image-grid]"
        );

    const counter =
        imagePicker.querySelector(
            "[data-selected-image-count]"
        );


    if (
        !selectedGrid ||
        !counter
    ) {
        return;
    }


    // ----------------------------------------
    // Beschikbare foto's markeren
    // ----------------------------------------

    const imageButtons =
        imagePicker.querySelectorAll(
            ".admin-image-option"
        );


    imageButtons.forEach(
        (button) => {

            const isSelected =
                selectedImages.some(
                    (image) =>
                        image.path ===
                        button.dataset.imagePath
                );


            button.classList.toggle(
                "is-selected",
                isSelected
            );


            button.setAttribute(
                "aria-pressed",
                String(isSelected)
            );

        }
    );


    // ----------------------------------------
    // Teller
    // ----------------------------------------

    const count =
        selectedImages.length;


    counter.textContent =
        count === 1
            ? "1 geselecteerd"
            : `${count} geselecteerd`;


    // ----------------------------------------
    // Geen selectie
    // ----------------------------------------

    if (count === 0) {

        selectedGrid.innerHTML = `
            <div class="admin-selected-empty">
                Nog geen foto's geselecteerd.
            </div>
        `;

        return;

    }


    // ----------------------------------------
    // Selectie opnieuw opbouwen
    // ----------------------------------------

    selectedGrid.innerHTML = "";


    selectedImages.forEach(
        (image, index) => {

            const card =
                document.createElement("div");

            card.className =
                "admin-selected-image";

            card.dataset.selectedIndex =
                String(index);


            card.innerHTML = `
                <div class="admin-selected-image-preview">

                    <img
                        src="${image.url}"
                        alt=""
                    >

                    <span class="admin-image-order">
                        ${index + 1}
                    </span>

                    ${
                        index === 0
                            ? `
                                <span class="admin-main-image-badge">
                                    Hoofdfoto
                                </span>
                            `
                            : ""
                    }

                </div>

                <div class="admin-selected-image-actions">

                    <button
                        type="button"
                        class="admin-image-move"
                        data-image-move="left"
                        aria-label="Foto naar voren"
                        ${index === 0 ? "disabled" : ""}
                    >
                        ←
                    </button>

                    <button
                        type="button"
                        class="admin-image-move"
                        data-image-move="right"
                        aria-label="Foto naar achteren"
                        ${
                            index ===
                            selectedImages.length - 1
                                ? "disabled"
                                : ""
                        }
                    >
                        →
                    </button>

                    <button
                        type="button"
                        class="admin-image-remove"
                        data-image-remove
                        aria-label="Foto verwijderen"
                    >
                        ×
                    </button>

                </div>
            `;


            selectedGrid.appendChild(
                card
            );

        }
    );

}


// ========================================
// VOLGORDE / VERWIJDEREN
// ========================================

if (imagePicker) {

    imagePicker.addEventListener(
        "click",
        (event) => {

            // --------------------------------
            // Geselecteerde foto verwijderen
            // --------------------------------

            const removeButton =
                event.target.closest(
                    "[data-image-remove]"
                );


            if (removeButton) {

                const card =
                    removeButton.closest(
                        "[data-selected-index]"
                    );


                if (!card) {
                    return;
                }


                const index =
                    Number(
                        card.dataset.selectedIndex
                    );


                selectedImages.splice(
                    index,
                    1
                );


                updateSelectedImages();

                return;

            }


            // --------------------------------
            // Volgorde wijzigen
            // --------------------------------

            const moveButton =
                event.target.closest(
                    "[data-image-move]"
                );


            if (!moveButton) {
                return;
            }


            const card =
                moveButton.closest(
                    "[data-selected-index]"
                );


            if (!card) {
                return;
            }


            const currentIndex =
                Number(
                    card.dataset.selectedIndex
                );


            const direction =
                moveButton.dataset.imageMove;


            let newIndex =
                currentIndex;


            if (direction === "left") {

                newIndex =
                    currentIndex - 1;

            }


            if (direction === "right") {

                newIndex =
                    currentIndex + 1;

            }


            if (
                newIndex < 0 ||
                newIndex >=
                    selectedImages.length
            ) {
                return;
            }


            const [
                movedImage
            ] =
                selectedImages.splice(
                    currentIndex,
                    1
                );


            selectedImages.splice(
                newIndex,
                0,
                movedImage
            );


            updateSelectedImages();

        }
    );

}


// ========================================
// PRODUCT DATA VERZAMELEN
// ========================================

function getSelectedImagePaths() {

    return selectedImages.map(
        (image) => image.path
    );

}


// ========================================
// PRODUCTFORMULIER
// ========================================

const productForm =
    document.querySelector(
        "[data-product-form]"
    );


function makeSlug(value) {

    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

}


function getVariantStock() {

    const stock = {};

    if (!variantList) {
        return stock;
    }

    const rows =
        variantList.querySelectorAll(
            ".admin-variant-row"
        );

    rows.forEach(
        (row) => {

            const nameInput =
                row.querySelector(
                    'input[type="text"]'
                );

            const stockInput =
                row.querySelector(
                    'input[type="number"]'
                );

            const variantName =
                nameInput?.value.trim();

            if (!variantName) {
                return;
            }

            stock[variantName] =
                Math.max(
                    0,
                    Number.parseInt(
                        stockInput?.value || "0",
                        10
                    ) || 0
                );

        }
    );

    return stock;

}


function showSaveMessage(
    message,
    type = "success"
) {

    let messageBox =
        productForm.querySelector(
            "[data-product-save-message]"
        );

    if (!messageBox) {

        messageBox =
            document.createElement("p");

        messageBox.dataset.productSaveMessage =
            "";

        messageBox.style.margin =
            "0";

        messageBox.style.fontWeight =
            "800";

        messageBox.style.fontSize =
            "13px";

        const actions =
            productForm.querySelector(
                ".admin-form-actions"
            );

        actions?.before(messageBox);

    }

    messageBox.textContent =
        message;

    messageBox.style.color =
        type === "error"
            ? "#ff8585"
            : "#74d99f";

}


async function deleteCurrentProduct() {

    if (!editingProductId) {
        return;
    }

    const product =
        adminProducts.find(
            (item) =>
                item.id === editingProductId
        );

    if (!product) {
        window.alert(
            "Dit product kon niet meer worden gevonden."
        );
        return;
    }

    // Een nog niet gesynchroniseerde verkoop mag nooit
    // zijn product verliezen.
    const queuedSales =
        await idbGetAll(
            SHOW_SALES_STORE
        );

    const hasPendingSale =
        queuedSales.some(
            (sale) =>
                sale.productId ===
                editingProductId
        );

    if (hasPendingSale) {
        window.alert(
            "Dit product heeft nog een offline verkoop die niet met Firestore is gesynchroniseerd. Synchroniseer eerst voordat je het product verwijdert."
        );
        return;
    }

    const confirmed =
        window.confirm(
            `Weet je zeker dat je "${product.name}" volledig wilt verwijderen?\n\nHet product verdwijnt uit de admin, webshop en Show mode. Bestaande verkoopgeschiedenis blijft bewaard.`
        );

    if (!confirmed) {
        return;
    }

    try {

        deleteProductButton.disabled =
            true;

        deleteProductButton.textContent =
            "Verwijderen...";

        await deleteDoc(
            doc(
                db,
                "products",
                editingProductId
            )
        );

        resetProductForm();
        await loadAdminProducts();
        openAdminPage("products");

    }

    catch (error) {

        console.error(
            "Product verwijderen mislukt:",
            error
        );

        window.alert(
            "Product verwijderen is mislukt."
        );

    }

    finally {

        deleteProductButton.disabled =
            false;

        deleteProductButton.textContent =
            "Product volledig verwijderen";

    }

}


deleteProductButton?.addEventListener(
    "click",
    deleteCurrentProduct
);


if (productForm) {

    productForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const submitButton =
                productForm.querySelector(
                    'button[type="submit"]'
                );

            const formData =
                new FormData(productForm);

            const name =
                String(
                    formData.get("name") || ""
                ).trim();

            const category =
                String(
                    formData.get("category") || ""
                ).trim();

            const price =
                Number(
                    formData.get("price")
                );

            const description =
                String(
                    formData.get("description") || ""
                ).trim();


            const merchGirlSplit =
                Number(
                    formData.get("merchGirlSplit")
                );

            const bandSplit =
                Number(
                    formData.get("bandSplit")
                );

            const hasVariants =
                formData.get("hasVariants") === "on";

            const variantLabel =
                String(
                    formData.get("variantLabel") || ""
                ).trim();

            const visible =
                formData.get("visible") === "on";

            const images =
                getSelectedImagePaths();

            const generatedSlug =
                makeSlug(name);

            const slug =
                editingProductId ||
                generatedSlug;


            // -----------------------------
            // Basisvalidatie
            // -----------------------------

            if (!name) {

                showSaveMessage(
                    "Vul eerst een productnaam in.",
                    "error"
                );

                return;

            }

            if (!generatedSlug) {

                showSaveMessage(
                    "Van deze productnaam kan geen geldige product-ID worden gemaakt.",
                    "error"
                );

                return;

            }

            if (!category) {

                showSaveMessage(
                    "Kies een categorie.",
                    "error"
                );

                return;

            }

            if (
                !Number.isFinite(price) ||
                price < 0
            ) {

                showSaveMessage(
                    "Vul een geldige prijs in.",
                    "error"
                );

                return;

            }

            if (images.length === 0) {

                showSaveMessage(
                    "Selecteer minimaal één productfoto.",
                    "error"
                );

                return;

            }

            if (
                !Number.isFinite(merchGirlSplit) ||
                !Number.isFinite(bandSplit) ||
                merchGirlSplit < 0 ||
                bandSplit < 0 ||
                merchGirlSplit > 100 ||
                bandSplit > 100 ||
                Math.abs(
                    merchGirlSplit +
                    bandSplit -
                    100
                ) > 0.001
            ) {

                showSaveMessage(
                    "Stel de opbrengstverdeling in. Merch Girl + Band moet samen precies 100% zijn.",
                    "error"
                );

                return;

            }


            let stock;


            if (hasVariants) {

                if (!variantLabel) {

                    showSaveMessage(
                        "Geef de varianten een naam, bijvoorbeeld Maat.",
                        "error"
                    );

                    return;

                }

                stock =
                    getVariantStock();

                if (
                    Object.keys(stock).length === 0
                ) {

                    showSaveMessage(
                        "Voeg minimaal één variant toe.",
                        "error"
                    );

                    return;

                }

            }

            else {

                stock =
                    Math.max(
                        0,
                        Number.parseInt(
                            formData.get("stock") || "0",
                            10
                        ) || 0
                    );

            }


            const productData = {
                name,
                slug,
                category,
                price,
                description,
                images,
                hasVariants,
                stock,
                visible,
                revenueSplit: {
                    merchGirl:
                        merchGirlSplit,
                    band:
                        bandSplit
                },
                updatedAt:
                    serverTimestamp()
            };


            if (hasVariants) {

                productData.variantLabel =
                    variantLabel;

            }


            try {

                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        "Opslaan...";

                }


                const existingProduct =
                    editingProductId
                        ? adminProducts.find(
                            (item) =>
                                item.id ===
                                editingProductId
                        )
                        : null;


                await setDoc(
                    doc(
                        db,
                        "products",
                        slug
                    ),
                    {
                        ...productData,
                        slug,
                        createdAt:
                            existingProduct?.createdAt ||
                            serverTimestamp()
                    }
                );


                showSaveMessage(
                    editingProductId
                        ? `✓ ${name} is bijgewerkt.`
                        : `✓ ${name} is opgeslagen in Firebase.`
                );


                console.log(
                    "Product opgeslagen:",
                    slug,
                    productData
                );


                await loadAdminProducts();

                resetProductForm();
                openAdminPage("products");

            }

            catch (error) {

                console.error(
                    "Product opslaan mislukt:",
                    error
                );


                const permissionDenied =
                    error?.code ===
                    "permission-denied";

                showSaveMessage(
                    permissionDenied
                        ? "Firebase weigert deze wijziging. Controleer of dit account als actieve admin in Firestore staat."
                        : "Opslaan is mislukt. Bekijk de browserconsole voor de technische fout.",
                    "error"
                );

            }

            finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        editingProductId
                            ? "Wijzigingen opslaan"
                            : "Product opslaan";

                }

            }

        }
    );

}


// ========================================
// SHOW MODE — LOCAL FIRST
// ========================================

const showProducts =
    document.querySelector("[data-show-products]");

const showMessage =
    document.querySelector("[data-show-message]");

const showSalesList =
    document.querySelector("[data-show-sales]");

const showSessionTotal =
    document.querySelector("[data-show-session-total]");

const showSessionCount =
    document.querySelector("[data-show-session-count]");

const showVariantSheet =
    document.querySelector("[data-show-variant-sheet]");

const showVariantLabel =
    document.querySelector("[data-show-variant-label]");

const showVariantProduct =
    document.querySelector("[data-show-variant-product]");

const showVariantOptions =
    document.querySelector("[data-show-variant-options]");

const clearShowSessionButton =
    document.querySelector("[data-clear-show-session]");

let showSessionSales = [];
let showDraftProduct = null;
let showDraftQuantities = {};
let showDraftPaymentMethod = null;

const SHOW_DB_NAME = "voltage-avenue-merch";
const SHOW_DB_VERSION = 1;
const SHOW_SALES_STORE = "salesQueue";
const SHOW_STOCK_STORE = "stockAdjustments";


function openShowDb() {

    return new Promise(
        (resolve, reject) => {

            const request =
                indexedDB.open(
                    SHOW_DB_NAME,
                    SHOW_DB_VERSION
                );

            request.onupgradeneeded =
                () => {

                    const database =
                        request.result;

                    if (
                        !database.objectStoreNames
                            .contains(SHOW_SALES_STORE)
                    ) {
                        database.createObjectStore(
                            SHOW_SALES_STORE,
                            { keyPath: "id" }
                        );
                    }

                    if (
                        !database.objectStoreNames
                            .contains(SHOW_STOCK_STORE)
                    ) {
                        database.createObjectStore(
                            SHOW_STOCK_STORE,
                            { keyPath: "key" }
                        );
                    }

                };

            request.onsuccess =
                () => resolve(request.result);

            request.onerror =
                () => reject(request.error);

        }
    );

}


async function idbGetAll(storeName) {

    const database =
        await openShowDb();

    return new Promise(
        (resolve, reject) => {

            const transaction =
                database.transaction(
                    storeName,
                    "readonly"
                );

            const request =
                transaction.objectStore(
                    storeName
                ).getAll();

            request.onsuccess =
                () => resolve(request.result || []);

            request.onerror =
                () => reject(request.error);

        }
    );

}


async function idbPut(storeName, value) {

    const database =
        await openShowDb();

    return new Promise(
        (resolve, reject) => {

            const transaction =
                database.transaction(
                    storeName,
                    "readwrite"
                );

            transaction.objectStore(
                storeName
            ).put(value);

            transaction.oncomplete =
                () => resolve();

            transaction.onerror =
                () => reject(transaction.error);

        }
    );

}


async function idbDelete(storeName, key) {

    const database =
        await openShowDb();

    return new Promise(
        (resolve, reject) => {

            const transaction =
                database.transaction(
                    storeName,
                    "readwrite"
                );

            transaction.objectStore(
                storeName
            ).delete(key);

            transaction.oncomplete =
                () => resolve();

            transaction.onerror =
                () => reject(transaction.error);

        }
    );

}


function createLocalSaleId() {

    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return (
        "sale-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(16)
            .slice(2)
    );

}


function getStockKey(
    productId,
    variant = null
) {

    return (
        productId +
        "::" +
        (variant ?? "__simple__")
    );

}


async function getPendingStockMap() {

    const adjustments =
        await idbGetAll(
            SHOW_STOCK_STORE
        );

    return Object.fromEntries(
        adjustments.map(
            (item) => [
                item.key,
                Number(item.quantity) || 0
            ]
        )
    );

}


function getBaseVariantStock(
    product,
    variant
) {

    if (
        product.stock &&
        typeof product.stock === "object" &&
        !Array.isArray(product.stock)
    ) {
        return (
            Number(product.stock[variant]) ||
            0
        );
    }

    return 0;

}


async function getAvailableStock(
    product,
    variant = null
) {

    const pending =
        await getPendingStockMap();

    const key =
        getStockKey(
            product.id,
            variant
        );

    const localSold =
        Number(pending[key]) || 0;

    const base =
        variant === null
            ? Number(product.stock) || 0
            : getBaseVariantStock(
                product,
                variant
            );

    return Math.max(
        0,
        base - localSold
    );

}


async function addPendingStock(
    productId,
    variant,
    quantity
) {

    const key =
        getStockKey(
            productId,
            variant
        );

    const items =
        await idbGetAll(
            SHOW_STOCK_STORE
        );

    const current =
        items.find(
            (item) =>
                item.key === key
        );

    await idbPut(
        SHOW_STOCK_STORE,
        {
            key,
            productId,
            variant,
            quantity:
                (Number(current?.quantity) || 0) +
                quantity
        }
    );

}


async function removePendingStock(
    productId,
    variant,
    quantity
) {

    const key =
        getStockKey(
            productId,
            variant
        );

    const items =
        await idbGetAll(
            SHOW_STOCK_STORE
        );

    const current =
        items.find(
            (item) =>
                item.key === key
        );

    const next =
        Math.max(
            0,
            (Number(current?.quantity) || 0) -
            quantity
        );

    if (next === 0) {
        await idbDelete(
            SHOW_STOCK_STORE,
            key
        );
        return;
    }

    await idbPut(
        SHOW_STOCK_STORE,
        {
            ...current,
            quantity: next
        }
    );

}


function showShowMessage(
    message,
    type = "success"
) {

    if (!showMessage) {
        return;
    }

    showMessage.textContent =
        message;

    showMessage.classList.toggle(
        "is-error",
        type === "error"
    );

    showMessage.hidden =
        !message;

}


async function updateSyncStatus() {

    const queued =
        await idbGetAll(
            SHOW_SALES_STORE
        );

    let indicator =
        document.querySelector(
            "[data-show-sync-status]"
        );

    if (!indicator) {

        indicator =
            document.createElement("div");

        indicator.dataset.showSyncStatus =
            "";

        indicator.className =
            "show-sync-status";

        document
            .querySelector(
                ".admin-show-mode .admin-page-header"
            )
            ?.after(indicator);

    }

    if (!navigator.onLine) {

        indicator.className =
            "show-sync-status is-offline";

        indicator.textContent =
            `● Offline · ${queued.length} ${
                queued.length === 1
                    ? "verkoop wacht"
                    : "verkopen wachten"
            } op synchronisatie`;

        return;

    }

    if (queued.length > 0) {

        indicator.className =
            "show-sync-status is-pending";

        indicator.textContent =
            `● Online · ${queued.length} ${
                queued.length === 1
                    ? "verkoop wacht"
                    : "verkopen wachten"
            } op synchronisatie`;

        return;

    }

    indicator.className =
        "show-sync-status is-online";

    indicator.textContent =
        "● Online · alles gesynchroniseerd";

}


function updateShowSessionSummary() {

    const total =
        showSessionSales.reduce(
            (sum, sale) =>
                sum +
                Number(sale.total || 0),
            0
        );

    const itemCount =
        showSessionSales.reduce(
            (sum, sale) =>
                sum +
                Number(sale.itemCount || 0),
            0
        );

    if (showSessionTotal) {
        showSessionTotal.textContent =
            formatAdminPrice(total);
    }

    if (showSessionCount) {
        showSessionCount.textContent =
            `${itemCount} ${
                itemCount === 1
                    ? "item"
                    : "items"
            }`;
    }

}


function renderShowSales() {

    if (!showSalesList) {
        return;
    }

    showSalesList.innerHTML = "";

    if (showSessionSales.length === 0) {

        showSalesList.innerHTML =
            '<p class="admin-muted">Nog niets verkocht in deze sessie.</p>';

        updateShowSessionSummary();
        return;

    }

    [...showSessionSales]
        .reverse()
        .forEach(
            (sale) => {

                const row =
                    document.createElement("div");

                row.className =
                    "show-sale-row";

                const title =
                    document.createElement(
                        "strong"
                    );

                title.textContent =
                    sale.summary;

                const time =
                    document.createElement(
                        "span"
                    );

                time.textContent =
                    sale.time;

                const price =
                    document.createElement(
                        "div"
                    );

                price.className =
                    "show-sale-price";

                price.textContent =
                    formatAdminPrice(
                        sale.total
                    );

                row.append(
                    title,
                    time,
                    price
                );

                showSalesList.appendChild(
                    row
                );

            }
        );

    updateShowSessionSummary();

}


function closeShowVariants() {

    if (showVariantSheet) {
        showVariantSheet.hidden = true;
    }

    showDraftProduct = null;
    showDraftQuantities = {};
    showDraftPaymentMethod = null;

}


document
    .querySelectorAll(
        "[data-close-show-variants]"
    )
    .forEach(
        (button) => {

            button.addEventListener(
                "click",
                closeShowVariants
            );

        }
    );


function sortVariantNames(names) {

    const sizeOrder = [
        "XXS",
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "XXL",
        "XXXL",
        "3XL",
        "4XL",
        "5XL"
    ];

    return [...names].sort(
        (a, b) => {

            const aIndex =
                sizeOrder.indexOf(
                    String(a).toUpperCase()
                );

            const bIndex =
                sizeOrder.indexOf(
                    String(b).toUpperCase()
                );

            if (
                aIndex !== -1 ||
                bIndex !== -1
            ) {
                return (
                    (aIndex === -1 ? 999 : aIndex) -
                    (bIndex === -1 ? 999 : bIndex)
                );
            }

            return String(a).localeCompare(
                String(b),
                "nl",
                {
                    numeric: true,
                    sensitivity: "base"
                }
            );

        }
    );

}


async function openShowSaleComposer(
    product
) {

    if (
        !showVariantSheet ||
        !showVariantOptions
    ) {
        return;
    }

    showDraftProduct = product;
    showDraftQuantities = {};

    const hasVariants =
        Boolean(product.hasVariants) ||
        (
            product.stock &&
            typeof product.stock === "object" &&
            !Array.isArray(product.stock)
        );

    if (showVariantLabel) {
        showVariantLabel.textContent =
            hasVariants
                ? (
                    product.variantLabel ||
                    "Variant"
                )
                : "Aantal";
    }

    if (showVariantProduct) {
        showVariantProduct.textContent =
            product.name;
    }

    showVariantOptions.innerHTML = "";

    const composer =
        document.createElement("div");

    composer.className =
        "show-sale-composer";


    const priceLine =
        document.createElement("p");

    priceLine.className =
        "show-composer-price";

    priceLine.textContent =
        `${formatAdminPrice(product.price)} per stuk`;

    composer.appendChild(
        priceLine
    );


    const rows =
        document.createElement("div");

    rows.className =
        "show-quantity-list";


    const options =
        hasVariants
            ? sortVariantNames(
                Object.keys(
                    product.stock || {}
                )
            )
            : [null];


    for (const variant of options) {

        const available =
            await getAvailableStock(
                product,
                variant
            );

        showDraftQuantities[
            variant ?? "__simple__"
        ] = 0;


        const row =
            document.createElement("div");

        row.className =
            "show-quantity-row";


        const info =
            document.createElement("div");

        info.className =
            "show-quantity-info";


        const name =
            document.createElement("strong");

        name.textContent =
            variant ??
            product.name;


        const stock =
            document.createElement("span");

        stock.textContent =
            `${available} beschikbaar`;


        info.append(
            name,
            stock
        );


        const controls =
            document.createElement("div");

        controls.className =
            "show-stepper";


        const minus =
            document.createElement("button");

        minus.type = "button";
        minus.textContent = "−";
        minus.disabled = true;


        const amount =
            document.createElement("strong");

        amount.textContent = "0";


        const plus =
            document.createElement("button");

        plus.type = "button";
        plus.textContent = "+";
        plus.disabled =
            available <= 0;


        const key =
            variant ?? "__simple__";


        const update =
            () => {

                const quantity =
                    showDraftQuantities[key];

                amount.textContent =
                    String(quantity);

                minus.disabled =
                    quantity <= 0;

                plus.disabled =
                    quantity >= available;

                updateComposerFooter(
                    product
                );

            };


        minus.addEventListener(
            "click",
            () => {

                showDraftQuantities[key] =
                    Math.max(
                        0,
                        showDraftQuantities[key] - 1
                    );

                update();

            }
        );


        plus.addEventListener(
            "click",
            () => {

                showDraftQuantities[key] =
                    Math.min(
                        available,
                        showDraftQuantities[key] + 1
                    );

                update();

            }
        );


        controls.append(
            minus,
            amount,
            plus
        );


        row.append(
            info,
            controls
        );

        rows.appendChild(
            row
        );

    }


    composer.appendChild(rows);


    const paymentBlock =
        document.createElement("div");

    paymentBlock.className =
        "show-payment-block";

    paymentBlock.innerHTML = `
        <span>BETAALWIJZE</span>
        <div class="show-payment-options">
            <button type="button" data-show-payment="pin">Pin</button>
            <button type="button" data-show-payment="cash">Contant</button>
        </div>
    `;

    composer.appendChild(paymentBlock);

    showDraftPaymentMethod = null;

    paymentBlock
        .querySelectorAll("[data-show-payment]")
        .forEach((button) => {
            button.addEventListener("click", () => {
                showDraftPaymentMethod =
                    button.dataset.showPayment;

                paymentBlock
                    .querySelectorAll("[data-show-payment]")
                    .forEach((item) => {
                        item.classList.toggle(
                            "is-selected",
                            item === button
                        );
                    });

                updateComposerFooter(product);
            });
        });


    const footer =
        document.createElement("div");

    footer.className =
        "show-composer-footer";

    footer.innerHTML = `
        <div>
            <span data-composer-count>0 items</span>
            <strong data-composer-total>${formatAdminPrice(0)}</strong>
        </div>

        <button
            class="admin-button admin-button-primary"
            type="button"
            data-register-composed-sale
            disabled
        >
            Verkoop registreren
        </button>
    `;

    composer.appendChild(
        footer
    );

    showVariantOptions.appendChild(
        composer
    );


    footer
        .querySelector(
            "[data-register-composed-sale]"
        )
        .addEventListener(
            "click",
            registerComposedShowSale
        );


    showVariantSheet.hidden = false;

}


function updateComposerFooter(
    product
) {

    const countElement =
        showVariantOptions?.querySelector(
            "[data-composer-count]"
        );

    const totalElement =
        showVariantOptions?.querySelector(
            "[data-composer-total]"
        );

    const submitButton =
        showVariantOptions?.querySelector(
            "[data-register-composed-sale]"
        );

    const count =
        Object.values(
            showDraftQuantities
        ).reduce(
            (sum, value) =>
                sum + Number(value || 0),
            0
        );

    const total =
        count *
        (Number(product.price) || 0);

    if (countElement) {
        countElement.textContent =
            `${count} ${
                count === 1
                    ? "item"
                    : "items"
            }`;
    }

    if (totalElement) {
        totalElement.textContent =
            formatAdminPrice(total);
    }

    if (submitButton) {
        submitButton.disabled =
            count <= 0 ||
            !showDraftPaymentMethod;
    }

}


async function registerComposedShowSale() {

    const product =
        showDraftProduct;

    if (!product) {
        return;
    }

    const lines =
        Object.entries(
            showDraftQuantities
        )
        .filter(
            ([, quantity]) =>
                Number(quantity) > 0
        )
        .map(
            ([key, quantity]) => ({
                variant:
                    key === "__simple__"
                        ? null
                        : key,
                quantity:
                    Number(quantity)
            })
        );

    if (lines.length === 0) {
        return;
    }

    const itemCount =
        lines.reduce(
            (sum, line) =>
                sum + line.quantity,
            0
        );

    const total =
        itemCount *
        (Number(product.price) || 0);

    const sale = {
        id: createLocalSaleId(),
        productId: product.id,
        productName:
            product.name || "Product",
        price:
            Number(product.price) || 0,
        lines,
        itemCount,
        total,
        paymentMethod:
            showDraftPaymentMethod,
        revenueSplit:
            product.revenueSplit
                ? {
                    merchGirl:
                        Number(
                            product.revenueSplit.merchGirl
                        ),
                    band:
                        Number(
                            product.revenueSplit.band
                        )
                }
                : null,
        createdAt:
            new Date().toISOString(),
        syncStatus: "pending",
        soldBy:
            auth.currentUser?.uid || null
    };


    // LOCAL FIRST:
    // eerst duurzaam op het apparaat bewaren.
    await idbPut(
        SHOW_SALES_STORE,
        sale
    );

    for (const line of lines) {

        await addPendingStock(
            product.id,
            line.variant,
            line.quantity
        );

    }


    const summary =
        lines
            .map(
                (line) =>
                    line.variant
                        ? `${line.variant} × ${line.quantity}`
                        : `${product.name} × ${line.quantity}`
            )
            .join(" · ");


    showSessionSales.push({
        summary,
        itemCount,
        total,
        time:
            new Intl.DateTimeFormat(
                "nl-NL",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            ).format(
                new Date()
            )
    });


    closeShowVariants();

    renderShowSales();
    await renderShowProducts();
    await updateSyncStatus();


    showShowMessage(
        `✓ ${itemCount} ${
            itemCount === 1
                ? "item"
                : "items"
        } lokaal opgeslagen`
    );


    // Niet wachten op internet.
    if (navigator.onLine) {
        syncPendingShowSales();
    }

}


async function syncOneShowSale(sale) {

    const saleRef =
        doc(
            db,
            "sales",
            sale.id
        );

    await runTransaction(
        db,
        async (transaction) => {

            const existingSale =
                await transaction.get(
                    saleRef
                );

            // Uniek verkoop-ID maakt retry idempotent.
            if (existingSale.exists()) {
                return;
            }

            const productRef =
                doc(
                    db,
                    "products",
                    sale.productId
                );

            const snapshot =
                await transaction.get(
                    productRef
                );

            if (!snapshot.exists()) {
                throw new Error(
                    `${sale.productName} bestaat niet meer in Firestore.`
                );
            }

            const product =
                snapshot.data();

            let nextStock;

            const isVariantProduct =
                product.stock &&
                typeof product.stock === "object" &&
                !Array.isArray(product.stock);


            if (isVariantProduct) {

                nextStock = {
                    ...product.stock
                };

                for (
                    const line of sale.lines
                ) {

                    const variant =
                        line.variant;

                    const current =
                        Number(
                            nextStock[variant]
                        ) || 0;

                    if (
                        current <
                        line.quantity
                    ) {
                        throw new Error(
                            `Onvoldoende voorraad voor ${sale.productName} — ${variant}.`
                        );
                    }

                    nextStock[variant] =
                        current -
                        line.quantity;

                }

            }

            else {

                const quantity =
                    sale.lines.reduce(
                        (sum, line) =>
                            sum +
                            line.quantity,
                        0
                    );

                const current =
                    Number(product.stock) ||
                    0;

                if (
                    current <
                    quantity
                ) {
                    throw new Error(
                        `Onvoldoende voorraad voor ${sale.productName}.`
                    );
                }

                nextStock =
                    current -
                    quantity;

            }


            transaction.update(
                productRef,
                {
                    stock: nextStock,
                    updatedAt:
                        serverTimestamp()
                }
            );


            transaction.set(
                saleRef,
                {
                    productId:
                        sale.productId,
                    productName:
                        sale.productName,
                    price:
                        sale.price,
                    lines:
                        sale.lines,
                    itemCount:
                        sale.itemCount,
                    total:
                        sale.total,
                    paymentMethod:
                        sale.paymentMethod ||
                        null,
                    status:
                        "completed",
                    revenueSplit:
                        sale.revenueSplit ||
                        null,
                    revenueAmounts:
                        sale.revenueSplit
                            ? {
                                merchGirl:
                                    Number(
                                        (
                                            sale.total *
                                            sale.revenueSplit.merchGirl /
                                            100
                                        ).toFixed(2)
                                    ),
                                band:
                                    Number(
                                        (
                                            sale.total *
                                            sale.revenueSplit.band /
                                            100
                                        ).toFixed(2)
                                    )
                            }
                            : null,
                    source:
                        "show-mode",
                    soldAt:
                        serverTimestamp(),
                    localCreatedAt:
                        sale.createdAt,
                    soldBy:
                        sale.soldBy
                }
            );

        }
    );

}


async function syncPendingShowSales() {

    if (!navigator.onLine) {
        await updateSyncStatus();
        return;
    }

    const queued =
        await idbGetAll(
            SHOW_SALES_STORE
        );

    if (queued.length === 0) {
        await updateSyncStatus();
        return;
    }

    for (const sale of queued) {

        try {

            await syncOneShowSale(
                sale
            );

            for (
                const line of sale.lines
            ) {

                await removePendingStock(
                    sale.productId,
                    line.variant,
                    line.quantity
                );

            }

            await idbDelete(
                SHOW_SALES_STORE,
                sale.id
            );

        }

        catch (error) {

            console.error(
                "Offline verkoop synchroniseren mislukt:",
                sale.id,
                error
            );

            // Laat de verkoop in de wachtrij.
            // Een latere retry mag hem opnieuw proberen.
            break;

        }

    }


    // Firestore is na succesvolle sync de nieuwe basis.
    try {
        await loadAdminProducts();
    }
    catch (error) {
        console.warn(
            "Producten na sync niet opnieuw geladen:",
            error
        );
    }

    await renderShowProducts();
    await updateSyncStatus();

}


function createShowProductCard(
    product,
    availableStock
) {

    const button =
        document.createElement("button");

    button.className =
        "show-product-card";

    button.type =
        "button";

    button.disabled =
        availableStock <= 0;

    const imagePath =
        Array.isArray(product.images)
            ? product.images[0]
            : "";

    const imageHtml =
        imagePath
            ? `<img src="${escapeHtml(getAdminImageUrl(imagePath))}" alt="">`
            : "";

    button.innerHTML = `
        <div class="show-product-image">
            ${imageHtml}
        </div>

        <div class="show-product-body">
            <p class="show-product-category">
                ${escapeHtml(product.category || "Merch")}
            </p>

            <h2 class="show-product-name">
                ${escapeHtml(product.name || "Product")}
            </h2>

            <div class="show-product-bottom">
                <div class="show-product-price">
                    ${escapeHtml(formatAdminPrice(product.price))}
                </div>

                <div class="show-product-stock">
                    Voorraad
                    <strong>${availableStock}</strong>
                </div>
            </div>
        </div>
    `;

    button.addEventListener(
        "click",
        () => {

            openShowSaleComposer(
                product
            );

        }
    );

    return button;

}


async function getShowProductTotalStock(
    product
) {

    const hasVariants =
        Boolean(product.hasVariants) ||
        (
            product.stock &&
            typeof product.stock === "object" &&
            !Array.isArray(product.stock)
        );

    if (!hasVariants) {
        return await getAvailableStock(
            product,
            null
        );
    }

    let total = 0;

    for (
        const variant of
        Object.keys(product.stock || {})
    ) {
        total +=
            await getAvailableStock(
                product,
                variant
            );
    }

    return total;

}


async function renderShowProducts() {

    if (!showProducts) {
        return;
    }

    showProducts.innerHTML = "";

    const products =
        [...adminProducts]
            .filter(
                (product) =>
                    product.visible !== false
            )
            .sort(
                (a, b) =>
                    String(a.name || "")
                        .localeCompare(
                            String(b.name || ""),
                            "nl"
                        )
            );

    if (products.length === 0) {

        showProducts.innerHTML =
            '<p class="admin-muted">Geen zichtbare producten gevonden.</p>';

        return;

    }

    for (const product of products) {

        const availableStock =
            await getShowProductTotalStock(
                product
            );

        showProducts.appendChild(
            createShowProductCard(
                product,
                availableStock
            )
        );

    }

}


function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


if (clearShowSessionButton) {

    clearShowSessionButton.addEventListener(
        "click",
        () => {

            showSessionSales = [];
            renderShowSales();

        }
    );

}


navigationButtons.forEach(
    (button) => {

        if (
            button.dataset.adminPage ===
            "show-mode"
        ) {

            button.addEventListener(
                "click",
                async () => {

                    await loadAdminProducts();
                    await renderShowProducts();
                    await updateSyncStatus();

                    if (navigator.onLine) {
                        syncPendingShowSales();
                    }

                }
            );

        }

    }
);


window.addEventListener(
    "online",
    () => {
        updateSyncStatus();
        syncPendingShowSales();
    }
);


window.addEventListener(
    "offline",
    () => {
        updateSyncStatus();
    }
);


// ========================================
// VERKOPEN / ADMINISTRATIE
// ========================================

const salesList =
    document.querySelector("[data-sales-list]");

const salesFrom =
    document.querySelector("[data-sales-from]");

const salesTo =
    document.querySelector("[data-sales-to]");

const salesSource =
    document.querySelector("[data-sales-source]");

const salesRevenue =
    document.querySelector("[data-sales-revenue]");

const salesMerch =
    document.querySelector("[data-sales-merch]");

const salesBand =
    document.querySelector("[data-sales-band]");

const salesItems =
    document.querySelector("[data-sales-items]");

const salesTransactions =
    document.querySelector("[data-sales-transactions]");

const salesCard =
    document.querySelector("[data-sales-card]");

const salesCash =
    document.querySelector("[data-sales-cash]");

const salesResultLabel =
    document.querySelector("[data-sales-result-label]");

const exportSalesButton =
    document.querySelector("[data-export-sales]");

const downloadSalesPdfButton =
    document.querySelector("[data-download-sales-pdf]");

const salesTodayButton =
    document.querySelector("[data-sales-today]");

const salesAllButton =
    document.querySelector("[data-sales-all]");

let loadedSales = [];


function saleDate(sale) {

    if (
        sale.soldAt &&
        typeof sale.soldAt.toDate === "function"
    ) {
        return sale.soldAt.toDate();
    }

    const raw =
        sale.localCreatedAt ||
        sale.createdAt;

    const date =
        raw
            ? new Date(raw)
            : new Date(0);

    return Number.isNaN(
        date.getTime()
    )
        ? new Date(0)
        : date;

}


function localDateValue(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function filteredSales() {

    const from =
        salesFrom?.value
            ? new Date(
                `${salesFrom.value}T00:00:00`
            )
            : null;

    const to =
        salesTo?.value
            ? new Date(
                `${salesTo.value}T23:59:59.999`
            )
            : null;

    const source =
        salesSource?.value ||
        "all";


    return loadedSales
        .filter(
            (sale) => {

                if (sale.status === "cancelled") {
                    return false;
                }

                const date =
                    saleDate(sale);

                if (
                    from &&
                    date < from
                ) {
                    return false;
                }

                if (
                    to &&
                    date > to
                ) {
                    return false;
                }

                if (
                    source !== "all" &&
                    sale.source !== source
                ) {
                    return false;
                }

                return true;

            }
        )
        .sort(
            (a, b) =>
                saleDate(b) -
                saleDate(a)
        );

}


function saleRevenueParts(sale) {

    const total =
        Number(sale.total) ||
        (
            Number(sale.price) *
            Number(
                sale.itemCount ||
                sale.quantity ||
                1
            )
        ) ||
        0;

    if (sale.revenueAmounts) {

        return {
            total,
            merchGirl:
                Number(
                    sale.revenueAmounts.merchGirl
                ) || 0,
            band:
                Number(
                    sale.revenueAmounts.band
                ) || 0,
            unallocated: 0
        };

    }

    if (sale.revenueSplit) {

        const merchGirl =
            total *
            Number(
                sale.revenueSplit.merchGirl
            ) /
            100;

        const band =
            total *
            Number(
                sale.revenueSplit.band
            ) /
            100;

        return {
            total,
            merchGirl,
            band,
            unallocated: 0
        };

    }

    return {
        total,
        merchGirl: 0,
        band: 0,
        unallocated: total
    };

}


function saleSummaryText(sale) {

    if (
        Array.isArray(sale.lines) &&
        sale.lines.length > 0
    ) {

        return sale.lines
            .map(
                (line) =>
                    line.variant
                        ? `${line.variant} × ${line.quantity}`
                        : `${sale.productName} × ${line.quantity}`
            )
            .join(" · ");

    }

    if (sale.variant) {
        return `${sale.variant} × ${sale.quantity || 1}`;
    }

    return `${sale.productName || "Product"} × ${sale.quantity || sale.itemCount || 1}`;

}


function renderSalesAdministration() {

    if (!salesList) {
        return;
    }

    const sales =
        filteredSales();

    let revenue = 0;
    let card = 0;
    let cash = 0;
    let merch = 0;
    let band = 0;
    let items = 0;


    salesList.innerHTML = "";


    sales.forEach(
        (sale) => {

            const parts =
                saleRevenueParts(sale);

            revenue +=
                parts.total;

            merch +=
                parts.merchGirl;

            band +=
                parts.band;

            if (sale.paymentMethod === "pin") {
                card += parts.total;
            }

            if (sale.paymentMethod === "cash") {
                cash += parts.total;
            }

            items +=
                Number(
                    sale.itemCount ||
                    sale.quantity ||
                    1
                );


            const row =
                document.createElement("article");

            row.className =
                "admin-sale-record";


            const date =
                saleDate(sale);


            const main =
                document.createElement("div");

            main.className =
                "admin-sale-record-main";

            main.innerHTML = `
                <strong>${escapeHtml(sale.productName || "Verkoop")}</strong>
                <span>${escapeHtml(saleSummaryText(sale))}</span>
            `;


            const meta =
                document.createElement("div");

            meta.className =
                "admin-sale-record-meta";

            meta.innerHTML = `
                <span>${escapeHtml(
                    new Intl.DateTimeFormat(
                        "nl-NL",
                        {
                            dateStyle: "short",
                            timeStyle: "short"
                        }
                    ).format(date)
                )}</span>
                <span>${escapeHtml(
                    sale.source === "show-mode"
                        ? "Show mode"
                        : (sale.source || "Verkoop")
                )}</span>
                ${sale.pendingLocal ? "<span>Wacht op sync</span>" : ""}
            `;


            const split =
                document.createElement("div");

            split.className =
                "admin-sale-record-split";

            split.innerHTML =
                sale.revenueSplit
                    ? `
                        <span>Merch Girl ${sale.revenueSplit.merchGirl}% · ${formatAdminPrice(parts.merchGirl)}</span>
                        <span>Band ${sale.revenueSplit.band}% · ${formatAdminPrice(parts.band)}</span>
                    `
                    : `<span>Geen historische verdeling</span>`;

            const payment =
                document.createElement("span");

            payment.className =
                "admin-sale-payment";

            payment.textContent =
                sale.paymentMethod === "pin"
                    ? "Pin"
                    : sale.paymentMethod === "cash"
                        ? "Contant"
                        : "Betaalwijze onbekend";

            split.appendChild(payment);


            const editButton =
                document.createElement("button");

            editButton.type = "button";
            editButton.className =
                "admin-sale-edit-button";

            editButton.textContent =
                "Sale bewerken";

            editButton.dataset.saleEditId =
                sale.id;

            editButton.disabled =
                sale.pendingLocal === true;

            if (sale.pendingLocal) {
                editButton.title =
                    "Deze verkoop wacht nog op synchronisatie.";
            }


            const total =
                document.createElement("strong");

            total.className =
                "admin-sale-record-total";

            total.textContent =
                formatAdminPrice(
                    parts.total
                );


            row.append(
                main,
                meta,
                split,
                total,
                editButton
            );

            salesList.appendChild(
                row
            );

        }
    );


    if (sales.length === 0) {
        salesList.innerHTML =
            '<p class="admin-muted">Geen verkopen in deze selectie.</p>';
    }


    if (salesRevenue) {
        salesRevenue.textContent =
            formatAdminPrice(revenue);
    }

    if (salesCard) {
        salesCard.textContent =
            formatAdminPrice(card);
    }

    if (salesCash) {
        salesCash.textContent =
            formatAdminPrice(cash);
    }

    if (salesMerch) {
        salesMerch.textContent =
            formatAdminPrice(merch);
    }

    if (salesBand) {
        salesBand.textContent =
            formatAdminPrice(band);
    }

    if (salesItems) {
        salesItems.textContent =
            String(items);
    }

    if (salesTransactions) {
        salesTransactions.textContent =
            String(sales.length);
    }


    if (salesResultLabel) {
        salesResultLabel.textContent =
            `${sales.length} ${
                sales.length === 1
                    ? "transactie"
                    : "transacties"
            } in deze selectie`;
    }

}


async function loadSalesAdministration() {

    if (!salesList) {
        return;
    }

    salesList.innerHTML =
        '<p class="admin-muted">Verkopen laden...</p>';

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "sales"
                )
            );

        const firestoreSales =
            snapshot.docs.map(
                (document) => ({
                    id: document.id,
                    ...document.data(),
                    pendingLocal: false
                })
            );


        const queued =
            await idbGetAll(
                SHOW_SALES_STORE
            );

        const firestoreIds =
            new Set(
                firestoreSales.map(
                    (sale) => sale.id
                )
            );

        const localSales =
            queued
                .filter(
                    (sale) =>
                        !firestoreIds.has(
                            sale.id
                        )
                )
                .map(
                    (sale) => ({
                        ...sale,
                        source: "show-mode",
                        localCreatedAt:
                            sale.createdAt,
                        pendingLocal: true
                    })
                );


        loadedSales = [
            ...firestoreSales,
            ...localSales
        ];

        renderSalesAdministration();

    }

    catch (error) {

        console.error(
            "Verkopen laden mislukt:",
            error
        );

        // Ook zonder internet kunnen lokale,
        // nog niet gesynchroniseerde verkopen
        // zichtbaar blijven.
        try {

            const queued =
                await idbGetAll(
                    SHOW_SALES_STORE
                );

            loadedSales =
                queued.map(
                    (sale) => ({
                        ...sale,
                        source: "show-mode",
                        localCreatedAt:
                            sale.createdAt,
                        pendingLocal: true
                    })
                );

            renderSalesAdministration();

        }

        catch {

            salesList.innerHTML =
                '<p class="admin-muted">Verkopen konden niet worden geladen.</p>';

        }

    }

}




const saleEditor =
    document.querySelector("[data-sale-editor]");

const saleEditorTitle =
    document.querySelector("[data-sale-editor-title]");

const saleEditorMeta =
    document.querySelector("[data-sale-editor-meta]");

const saleEditorLines =
    document.querySelector("[data-sale-editor-lines]");

const saleEditorCount =
    document.querySelector("[data-sale-editor-count]");

const saleEditorTotal =
    document.querySelector("[data-sale-editor-total]");

const saveSaleButton =
    document.querySelector("[data-save-sale]");

const cancelSaleButton =
    document.querySelector("[data-cancel-sale]");

let editingSale = null;
let editingSaleLines = [];
let editingSalePayment = null;


function closeSaleEditor() {
    if (saleEditor) saleEditor.hidden = true;
    editingSale = null;
    editingSaleLines = [];
    editingSalePayment = null;
}


document
    .querySelectorAll("[data-close-sale-editor]")
    .forEach((button) => {
        button.addEventListener("click", closeSaleEditor);
    });


function updateSaleEditorSummary() {
    const count =
        editingSaleLines.reduce(
            (sum, line) =>
                sum + Number(line.quantity || 0),
            0
        );

    const total =
        count * Number(editingSale?.price || 0);

    if (saleEditorCount) {
        saleEditorCount.textContent =
            `${count} ${count === 1 ? "item" : "items"}`;
    }

    if (saleEditorTotal) {
        saleEditorTotal.textContent =
            formatAdminPrice(total);
    }

    if (saveSaleButton) {
        saveSaleButton.disabled =
            count <= 0 ||
            !editingSalePayment;
    }
}


function renderSaleEditorLines() {
    if (!saleEditorLines) return;

    saleEditorLines.innerHTML = "";

    editingSaleLines.forEach((line, index) => {
        const row = document.createElement("div");
        row.className = "show-quantity-row";

        const info = document.createElement("div");
        info.className = "show-quantity-info";

        const name = document.createElement("strong");
        name.textContent =
            line.variant ||
            editingSale.productName ||
            "Product";

        info.appendChild(name);

        const controls = document.createElement("div");
        controls.className = "show-stepper";

        const minus = document.createElement("button");
        minus.type = "button";
        minus.textContent = "−";

        const amount = document.createElement("strong");
        amount.textContent = String(line.quantity);

        const plus = document.createElement("button");
        plus.type = "button";
        plus.textContent = "+";

        minus.addEventListener("click", () => {
            editingSaleLines[index].quantity =
                Math.max(
                    0,
                    Number(editingSaleLines[index].quantity) - 1
                );
            renderSaleEditorLines();
            updateSaleEditorSummary();
        });

        plus.addEventListener("click", () => {
            editingSaleLines[index].quantity =
                Number(editingSaleLines[index].quantity) + 1;
            renderSaleEditorLines();
            updateSaleEditorSummary();
        });

        controls.append(minus, amount, plus);
        row.append(info, controls);
        saleEditorLines.appendChild(row);
    });
}


function openSaleEditor(sale) {
    editingSale = sale;

    if (Array.isArray(sale.lines) && sale.lines.length) {
        editingSaleLines =
            sale.lines.map((line) => ({
                variant: line.variant ?? null,
                quantity: Number(line.quantity || 0)
            }));
    } else {
        editingSaleLines = [{
            variant: sale.variant ?? null,
            quantity: Number(
                sale.quantity ||
                sale.itemCount ||
                1
            )
        }];
    }

    editingSalePayment =
        sale.paymentMethod || null;

    if (saleEditorTitle) {
        saleEditorTitle.textContent =
            sale.productName || "Verkoop bewerken";
    }

    if (saleEditorMeta) {
        saleEditorMeta.textContent =
            new Intl.DateTimeFormat(
                "nl-NL",
                {
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            ).format(saleDate(sale));
    }

    document
        .querySelectorAll("[data-edit-payment]")
        .forEach((button) => {
            button.classList.toggle(
                "is-selected",
                button.dataset.editPayment ===
                    editingSalePayment
            );
        });

    renderSaleEditorLines();
    updateSaleEditorSummary();

    if (saleEditor) saleEditor.hidden = false;
}


document
    .querySelectorAll("[data-edit-payment]")
    .forEach((button) => {
        button.addEventListener("click", () => {
            editingSalePayment =
                button.dataset.editPayment;

            document
                .querySelectorAll("[data-edit-payment]")
                .forEach((item) => {
                    item.classList.toggle(
                        "is-selected",
                        item === button
                    );
                });

            updateSaleEditorSummary();
        });
    });


function quantitiesByVariant(lines) {
    const result = new Map();

    lines.forEach((line) => {
        const key =
            line.variant ?? "__simple__";

        result.set(
            key,
            (result.get(key) || 0) +
            Number(line.quantity || 0)
        );
    });

    return result;
}


async function updateFirestoreSaleAndStock(
    sale,
    nextLines,
    paymentMethod,
    cancel = false
) {
    const saleRef = doc(db, "sales", sale.id);
    const productRef = doc(db, "products", sale.productId);

    await runTransaction(db, async (transaction) => {
        const saleSnapshot =
            await transaction.get(saleRef);

        const productSnapshot =
            await transaction.get(productRef);

        if (!saleSnapshot.exists()) {
            throw new Error("Verkoop bestaat niet meer.");
        }

        if (!productSnapshot.exists()) {
            throw new Error("Product bestaat niet meer; voorraad kan niet veilig worden gecorrigeerd.");
        }

        const currentSale =
            saleSnapshot.data();

        if (currentSale.status === "cancelled") {
            throw new Error("Deze verkoop is al geannuleerd.");
        }

        const product =
            productSnapshot.data();

        const oldLines =
            Array.isArray(currentSale.lines) &&
            currentSale.lines.length
                ? currentSale.lines
                : [{
                    variant: currentSale.variant ?? null,
                    quantity: Number(
                        currentSale.quantity ||
                        currentSale.itemCount ||
                        1
                    )
                }];

        const targetLines =
            cancel ? [] : nextLines;

        const oldMap =
            quantitiesByVariant(oldLines);

        const newMap =
            quantitiesByVariant(targetLines);

        const variantProduct =
            product.stock &&
            typeof product.stock === "object" &&
            !Array.isArray(product.stock);

        let nextStock =
            variantProduct
                ? { ...product.stock }
                : Number(product.stock) || 0;

        const keys =
            new Set([
                ...oldMap.keys(),
                ...newMap.keys()
            ]);

        for (const key of keys) {
            const oldQty = oldMap.get(key) || 0;
            const newQty = newMap.get(key) || 0;
            const delta = oldQty - newQty;

            if (variantProduct) {
                const variant =
                    key === "__simple__"
                        ? null
                        : key;

                const current =
                    Number(nextStock[variant]) || 0;

                const corrected =
                    current + delta;

                if (corrected < 0) {
                    throw new Error(
                        `Onvoldoende voorraad voor ${variant}.`
                    );
                }

                nextStock[variant] = corrected;
            } else {
                nextStock += delta;

                if (nextStock < 0) {
                    throw new Error(
                        "Onvoldoende voorraad."
                    );
                }
            }
        }

        transaction.update(productRef, {
            stock: nextStock,
            updatedAt: serverTimestamp()
        });

        if (cancel) {
            transaction.update(saleRef, {
                status: "cancelled",
                cancelledAt: serverTimestamp(),
                cancelledBy:
                    auth.currentUser?.uid || null,
                updatedAt: serverTimestamp()
            });
            return;
        }

        const itemCount =
            nextLines.reduce(
                (sum, line) =>
                    sum + Number(line.quantity || 0),
                0
            );

        const total =
            itemCount *
            Number(currentSale.price || 0);

        const revenueSplit =
            currentSale.revenueSplit || null;

        transaction.update(saleRef, {
            lines: nextLines,
            itemCount,
            total,
            paymentMethod,
            revenueAmounts:
                revenueSplit
                    ? {
                        merchGirl:
                            Number(
                                (
                                    total *
                                    Number(revenueSplit.merchGirl) /
                                    100
                                ).toFixed(2)
                            ),
                        band:
                            Number(
                                (
                                    total *
                                    Number(revenueSplit.band) /
                                    100
                                ).toFixed(2)
                            )
                    }
                    : null,
            updatedAt: serverTimestamp(),
            updatedBy:
                auth.currentUser?.uid || null
        });
    });
}


saveSaleButton?.addEventListener(
    "click",
    async () => {
        if (!editingSale) return;

        if (editingSale.pendingLocal) {
            window.alert(
                "Deze verkoop wacht nog op synchronisatie. Synchroniseer hem eerst voordat je hem achteraf bewerkt."
            );
            return;
        }

        const nextLines =
            editingSaleLines.filter(
                (line) =>
                    Number(line.quantity) > 0
            );

        if (
            nextLines.length === 0 ||
            !editingSalePayment
        ) {
            return;
        }

        try {
            saveSaleButton.disabled = true;
            saveSaleButton.textContent = "Opslaan...";

            await updateFirestoreSaleAndStock(
                editingSale,
                nextLines,
                editingSalePayment,
                false
            );

            closeSaleEditor();
            await loadAdminProducts();
            await loadSalesAdministration();
        } catch (error) {
            console.error("Sale bewerken mislukt:", error);
            window.alert(
                error.message ||
                "Sale bewerken is mislukt."
            );
        } finally {
            saveSaleButton.disabled = false;
            saveSaleButton.textContent =
                "Wijzigingen opslaan";
        }
    }
);


cancelSaleButton?.addEventListener(
    "click",
    async () => {
        if (!editingSale) return;

        if (editingSale.pendingLocal) {
            window.alert(
                "Deze verkoop wacht nog op synchronisatie. Synchroniseer hem eerst voordat je hem annuleert."
            );
            return;
        }

        const confirmed =
            window.confirm(
                `Verkoop van "${editingSale.productName}" annuleren?\n\nDe voorraad wordt volledig hersteld. De transactie blijft als geannuleerd in de historie bewaard.`
            );

        if (!confirmed) return;

        try {
            cancelSaleButton.disabled = true;
            cancelSaleButton.textContent =
                "Annuleren...";

            await updateFirestoreSaleAndStock(
                editingSale,
                [],
                editingSale.paymentMethod,
                true
            );

            closeSaleEditor();
            await loadAdminProducts();
            await loadSalesAdministration();
        } catch (error) {
            console.error("Sale annuleren mislukt:", error);
            window.alert(
                error.message ||
                "Sale annuleren is mislukt."
            );
        } finally {
            cancelSaleButton.disabled = false;
            cancelSaleButton.textContent =
                "Verkoop annuleren";
        }
    }
);


function pdfEscape(value) {
    return String(value ?? "")
        .replaceAll("\\", "\\\\")
        .replaceAll("(", "\\(")
        .replaceAll(")", "\\)")
        .replace(/[^\x20-\x7E]/g, (char) => {
            const map = {
                "€": "EUR ",
                "×": "x",
                "·": "-",
                "–": "-",
                "—": "-",
                "é": "e",
                "ë": "e",
                "ï": "i",
                "ö": "o",
                "ü": "u",
                "É": "E"
            };
            return map[char] ?? "";
        });
}


function pdfText(x, y, size, text, bold = false) {
    const font = bold ? "F2" : "F1";
    return `BT /${font} ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET\n`;
}


function pdfLine(x1, y1, x2, y2, width = 0.6) {
    return `${width} w ${x1} ${y1} m ${x2} ${y2} l S\n`;
}


function pdfRect(x, y, width, height, gray = 0.96) {
    return `${gray} g ${x} ${y} ${width} ${height} re f 0 g\n`;
}


function buildSalesPdfBytes() {

    const sales = filteredSales();

    let revenue = 0;
    let card = 0;
    let cash = 0;
    let merch = 0;
    let band = 0;
    let items = 0;

    const productMap = new Map();

    sales.forEach((sale) => {
        const parts = saleRevenueParts(sale);

        revenue += parts.total;
        merch += parts.merchGirl;
        band += parts.band;
        if (sale.paymentMethod === "pin") card += parts.total;
        if (sale.paymentMethod === "cash") cash += parts.total;
        items += Number(sale.itemCount || sale.quantity || 1);

        const key = sale.productName || "Product";

        if (!productMap.has(key)) {
            productMap.set(key, {
                name: key,
                items: 0,
                revenue: 0,
                variants: new Map()
            });
        }

        const product = productMap.get(key);
        product.items += Number(sale.itemCount || sale.quantity || 1);
        product.revenue += parts.total;

        if (Array.isArray(sale.lines)) {
            sale.lines.forEach((line) => {
                if (!line.variant) return;
                product.variants.set(
                    line.variant,
                    (product.variants.get(line.variant) || 0) +
                    Number(line.quantity || 0)
                );
            });
        } else if (sale.variant) {
            product.variants.set(
                sale.variant,
                (product.variants.get(sale.variant) || 0) +
                Number(sale.quantity || 1)
            );
        }
    });

    const fromLabel = salesFrom?.value
        ? new Date(`${salesFrom.value}T12:00:00`).toLocaleDateString("nl-NL")
        : "begin";

    const toLabel = salesTo?.value
        ? new Date(`${salesTo.value}T12:00:00`).toLocaleDateString("nl-NL")
        : "heden";

    const sourceLabel =
        salesSource?.value === "show-mode"
            ? "Show mode"
            : salesSource?.value === "webshop"
                ? "Webshop"
                : "Alle verkopen";

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const left = 46;
    const right = 549;
    const bottom = 48;

    const pages = [];
    let content = "";
    let y = 0;

    function newPage(first = false) {
        if (!first && content) {
            pages.push(content);
        }

        content = "";
        y = 790;

        content += pdfText(left, y, 20, "VOLTAGE AVENUE", true);
        y -= 24;
        content += pdfText(left, y, 10, "MERCH SALES REPORT", true);
        y -= 13;
        content += pdfText(
            left,
            y,
            8,
            `${fromLabel} t/m ${toLabel}  |  ${sourceLabel}`
        );
        y -= 12;
        content += pdfLine(left, y, right, y, 1.2);
        y -= 22;
    }

    function ensureSpace(height) {
        if (y - height < bottom) {
            newPage();
        }
    }

    function sectionTitle(title) {
        ensureSpace(34);
        y -= 4;
        content += pdfText(left, y, 10, title.toUpperCase(), true);
        y -= 9;
        content += pdfLine(left, y, right, y, 0.5);
        y -= 15;
    }

    newPage(true);

    // Summary cards
    const cards = [
        ["OMZET", formatAdminPrice(revenue)],
        ["MERCH GIRL", formatAdminPrice(merch)],
        ["BAND", formatAdminPrice(band)]
    ];

    cards.forEach((card, index) => {
        const x = left + index * 171;
        content += pdfRect(x, y - 54, 158, 54, 0.95);
        content += pdfText(x + 10, y - 17, 7, card[0], true);
        content += pdfText(x + 10, y - 39, 15, card[1], true);
    });

    y -= 72;
    content += pdfText(
        left,
        y,
        9,
        `${items} items  |  ${sales.length} transacties  |  Pin ${formatAdminPrice(card)}  |  Contant ${formatAdminPrice(cash)}`
    );
    y -= 25;

    sectionTitle("Verkoop per product");

    [...productMap.values()]
        .sort((a, b) => b.revenue - a.revenue)
        .forEach((product) => {
            ensureSpace(48);

            content += pdfText(left, y, 10, product.name, true);
            content += pdfText(
                455,
                y,
                10,
                formatAdminPrice(product.revenue),
                true
            );
            y -= 13;

            let detail = `${product.items} stuks`;

            if (product.variants.size > 0) {
                const variants = [...product.variants.entries()]
                    .map(([name, count]) => `${name} ${count}`)
                    .join("  |  ");
                detail += `  |  ${variants}`;
            }

            content += pdfText(left, y, 8, detail);
            y -= 12;
            content += pdfLine(left, y, right, y, 0.25);
            y -= 12;
        });

    sectionTitle("Opbrengstverdeling");

    content += pdfText(left, y, 9, "Merch Girl", true);
    content += pdfText(455, y, 9, formatAdminPrice(merch), true);
    y -= 16;
    content += pdfText(left, y, 9, "Voltage Avenue", true);
    content += pdfText(455, y, 9, formatAdminPrice(band), true);
    y -= 16;


    y -= 8;
    sectionTitle("Transacties");

    sales.forEach((sale) => {
        ensureSpace(42);

        const date = saleDate(sale);
        const parts = saleRevenueParts(sale);

        const time = new Intl.DateTimeFormat(
            "nl-NL",
            {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            }
        ).format(date);

        content += pdfText(left, y, 8, time);
        content += pdfText(112, y, 8, sale.productName || "Verkoop", true);
        content += pdfText(455, y, 8, formatAdminPrice(parts.total), true);
        y -= 12;

        const details = saleSummaryText(sale);
        const paymentLabel =
            sale.paymentMethod === "pin"
                ? "Pin"
                : sale.paymentMethod === "cash"
                    ? "Contant"
                    : "Onbekend";

        content += pdfText(
            112,
            y,
            7,
            `${details} | ${paymentLabel}`.slice(0, 72)
        );

        if (sale.revenueSplit) {
            content += pdfText(
                350,
                y,
                7,
                `MG ${sale.revenueSplit.merchGirl}% / Band ${sale.revenueSplit.band}%`
            );
        }

        y -= 13;
        content += pdfLine(left, y, right, y, 0.2);
        y -= 9;
    });

    // footer
    ensureSpace(28);
    y -= 6;
    content += pdfLine(left, y, right, y, 0.5);
    y -= 14;
    content += pdfText(
        left,
        y,
        7,
        `Gegenereerd ${new Date().toLocaleString("nl-NL")} - Voltage Avenue Merch Admin`
    );

    pages.push(content);

    // Build minimal multi-page PDF, no external library/CDN required.
    const objects = [];
    const addObject = (value) => {
        objects.push(value);
        return objects.length;
    };

    const fontRegularId =
        addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

    const fontBoldId =
        addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

    const pageObjectIds = [];
    const contentObjectIds = [];

    // Reserve page tree + catalog after fonts by placeholder.
    const pagesTreeId = addObject("");
    const catalogId = addObject("");

    pages.forEach((pageContent) => {
        const stream =
            `<< /Length ${new TextEncoder().encode(pageContent).length} >>\nstream\n${pageContent}endstream`;

        const contentId = addObject(stream);
        contentObjectIds.push(contentId);

        const pageId = addObject("");
        pageObjectIds.push(pageId);
    });

    objects[pagesTreeId - 1] =
        `<< /Type /Pages /Kids [${pageObjectIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;

    objects[catalogId - 1] =
        `<< /Type /Catalog /Pages ${pagesTreeId} 0 R >>`;

    pageObjectIds.forEach((pageId, index) => {
        objects[pageId - 1] =
            `<< /Type /Page /Parent ${pagesTreeId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentObjectIds[index]} 0 R >>`;
    });

    let pdf = "%PDF-1.4\n";
    const offsets = [0];

    objects.forEach((object, index) => {
        offsets[index + 1] =
            new TextEncoder().encode(pdf).length;

        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefOffset =
        new TextEncoder().encode(pdf).length;

    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";

    for (let index = 1; index <= objects.length; index += 1) {
        pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
    }

    pdf +=
        `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\n` +
        `startxref\n${xrefOffset}\n%%EOF`;

    return new TextEncoder().encode(pdf);
}


function downloadSalesPdf() {

    const bytes = buildSalesPdfBytes();

    const blob = new Blob(
        [bytes],
        { type: "application/pdf" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const from = salesFrom?.value || "alles";
    const to = salesTo?.value || "heden";

    link.href = url;
    link.download =
        `Voltage-Avenue-Verkooprapport_${from}_tot_${to}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(
        () => URL.revokeObjectURL(url),
        1000
    );
}



salesList?.addEventListener(
    "click",
    (event) => {

        const button =
            event.target.closest(
                "[data-sale-edit-id]"
            );

        if (!button) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const sale =
            loadedSales.find(
                (item) =>
                    item.id ===
                    button.dataset.saleEditId
            );

        if (!sale) {
            window.alert(
                "Deze verkoop kon niet meer worden gevonden. Vernieuw de verkopenlijst en probeer opnieuw."
            );
            return;
        }

        if (sale.pendingLocal) {
            window.alert(
                "Deze verkoop wacht nog op synchronisatie. Zodra hij gesynchroniseerd is kun je hem bewerken."
            );
            return;
        }

        openSaleEditor(sale);

    }
);


function csvCell(value) {

    const text =
        String(value ?? "");

    return (
        '"' +
        text.replaceAll('"', '""') +
        '"'
    );

}


function exportSalesCsv() {

    const sales =
        filteredSales();

    const rows = [[
        "Datum",
        "Tijd",
        "Product",
        "Details",
        "Items",
        "Omzet",
        "Merch Girl %",
        "Merch Girl bedrag",
        "Band %",
        "Band bedrag",
        "Betaalwijze",
        "Bron",
        "Sync"
    ]];


    sales.forEach(
        (sale) => {

            const date =
                saleDate(sale);

            const parts =
                saleRevenueParts(sale);

            rows.push([
                date.toLocaleDateString("nl-NL"),
                date.toLocaleTimeString(
                    "nl-NL",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                ),
                sale.productName || "",
                saleSummaryText(sale),
                sale.itemCount ||
                    sale.quantity ||
                    1,
                parts.total.toFixed(2),
                sale.revenueSplit?.merchGirl ?? "",
                parts.merchGirl.toFixed(2),
                sale.revenueSplit?.band ?? "",
                parts.band.toFixed(2),
                sale.paymentMethod === "pin"
                    ? "Pin"
                    : sale.paymentMethod === "cash"
                        ? "Contant"
                        : "",
                sale.source || "",
                sale.pendingLocal
                    ? "Wacht op sync"
                    : "Gesynchroniseerd"
            ]);

        }
    );


    const csv =
        "\uFEFF" +
        rows
            .map(
                (row) =>
                    row
                        .map(csvCell)
                        .join(";")
            )
            .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    const from =
        salesFrom?.value || "alles";

    const to =
        salesTo?.value || "alles";

    link.href = url;
    link.download =
        `voltage-avenue-verkopen_${from}_tot_${to}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

}


[
    salesFrom,
    salesTo,
    salesSource
]
    .filter(Boolean)
    .forEach(
        (control) => {

            control.addEventListener(
                "change",
                renderSalesAdministration
            );

        }
    );


salesTodayButton?.addEventListener(
    "click",
    () => {

        const today =
            localDateValue(
                new Date()
            );

        salesFrom.value = today;
        salesTo.value = today;

        renderSalesAdministration();

    }
);


salesAllButton?.addEventListener(
    "click",
    () => {

        salesFrom.value = "";
        salesTo.value = "";

        renderSalesAdministration();

    }
);


exportSalesButton?.addEventListener(
    "click",
    exportSalesCsv
);


downloadSalesPdfButton?.addEventListener(
    "click",
    downloadSalesPdf
);


navigationButtons.forEach(
    (button) => {

        if (
            button.dataset.adminPage ===
            "sales"
        ) {

            button.addEventListener(
                "click",
                loadSalesAdministration
            );

        }

    }
);


// ========================================
// START ADMIN
// ========================================

loadShopImages();
