// ========================================
// VOLTAGE AVENUE - FIREBASE
// ========================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc
} from
    "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

import {
    getAuth
} from
    "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";


// ========================================
// FIREBASE CONFIG
// ========================================

const firebaseConfig = {
    apiKey: "AIzaSyDSM1OySy_zHhq-kAoT6Mo7oz1qCcMVJv0",
    authDomain: "voltage-avenue-merch.firebaseapp.com",
    projectId: "voltage-avenue-merch",
    storageBucket: "voltage-avenue-merch.firebasestorage.app",
    messagingSenderId: "841673224576",
    appId: "1:841673224576:web:3fb1d7f6b8d8eec2891165"
};


// ========================================
// FIREBASE STARTEN
// ========================================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// ========================================
// GEDEELDE FIREBASE SERVICES
//
// De webshop gebruikt db.
// De admin gebruikt db + auth.
// ========================================

export {
    app,
    db,
    auth
};


// ========================================
// PRODUCT-ID UIT URL HALEN
//
// Voorbeeld:
// /shop/product/?id=shirt
//
// productId wordt dan:
// shirt
// ========================================

function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}


// ========================================
// PRIJS OPMAKEN
//
// 15     → € 15,00
// 19.95  → € 19,95
// ========================================

function formatPrice(price) {
    return new Intl.NumberFormat("nl-NL", {
        style: "currency",
        currency: "EUR"
    }).format(price);
}


// ========================================
// AFBEELDINGSPAD OMZETTEN
//
// Firestore:
// assets/images/shop/foto.png
//
// Productpagina:
// ../../assets/images/shop/foto.png
// ========================================

function getProductImagePath(imagePath) {
    return `../../${imagePath}`;
}


// ========================================
// PRODUCT OPHALEN UIT FIRESTORE
// ========================================

async function loadProduct() {

    try {

        // ----------------------------------------
        // Product-ID bepalen
        // ----------------------------------------

        const productId = getProductIdFromUrl();

        if (!productId) {
            console.error("Geen product-ID gevonden in de URL.");
            return;
        }


        // ----------------------------------------
        // Product uit Firestore ophalen
        // ----------------------------------------

        const productRef =
            doc(db, "products", productId);

        const productSnapshot =
            await getDoc(productRef);


        // ----------------------------------------
        // Product bestaat niet
        // ----------------------------------------

        if (!productSnapshot.exists()) {
            console.error(
                `Product '${productId}' bestaat niet.`
            );
            return;
        }


        // ----------------------------------------
        // Productdata
        // ----------------------------------------

        const product =
            productSnapshot.data();

        console.log("🔥 Firebase werkt!");
        console.log(`Product geladen: ${productId}`);
        console.log(product);


        // ========================================
        // PRODUCTNAAM
        // ========================================

        const nameElement =
            document.querySelector(
                "[data-product-name]"
            );

        if (nameElement && product.name) {
            nameElement.textContent =
                product.name;
        }


        // ========================================
        // PRODUCTBESCHRIJVING
        // ========================================

        const descriptionElement =
            document.querySelector(
                "[data-product-description]"
            );

        if (
            descriptionElement &&
            product.description
        ) {
            descriptionElement.textContent =
                product.description;
        }


        // ========================================
        // PRIJS
        // ========================================

        const priceElement =
            document.querySelector(
                "[data-product-price]"
            );

        if (
            priceElement &&
            product.price !== undefined
        ) {
            priceElement.textContent =
                formatPrice(product.price);
        }


        // ========================================
        // VARIANTEN / OPTIES
        // ========================================

        const optionsSection =
            document.querySelector(
                "[data-product-options]"
            );

        const optionTitle =
            document.querySelector(
                "[data-product-option-title]"
            );

        const optionButtons =
            document.querySelector(
                "[data-product-option-buttons]"
            );

        const hasVariants =
            Boolean(product.hasVariants) ||
            (
                product.stock &&
                typeof product.stock === "object" &&
                !Array.isArray(product.stock)
            );


        if (
            optionsSection &&
            optionButtons
        ) {

            optionButtons.innerHTML = "";

            if (hasVariants) {

                const variants =
                    Object.entries(
                        product.stock || {}
                    );

                if (optionTitle) {

                    const label =
                        product.variantLabel ||
                        "Variant";

                    optionTitle.textContent =
                        `Kies je ${label.toLowerCase()}`;

                }

                variants.forEach(
                    ([variant, amount]) => {

                        const button =
                            document.createElement(
                                "button"
                            );

                        button.className =
                            "size-option";

                        button.type =
                            "button";

                        button.textContent =
                            variant;

                        button.disabled =
                            Number(amount) <= 0;

                        button.setAttribute(
                            "aria-label",
                            `${variant}: ${Number(amount) || 0} op voorraad`
                        );

                        button.addEventListener(
                            "click",
                            () => {

                                optionButtons
                                    .querySelectorAll(
                                        ".size-option"
                                    )
                                    .forEach(
                                        (item) =>
                                            item.classList.remove(
                                                "is-selected"
                                            )
                                    );

                                button.classList.add(
                                    "is-selected"
                                );

                            }
                        );

                        optionButtons.appendChild(
                            button
                        );

                    }
                );

                optionsSection.hidden =
                    false;

            }

            else {

                optionsSection.hidden =
                    true;

            }

        }


        // ========================================
        // PRODUCTMETA
        // ========================================

        const metaElement =
            document.querySelector(
                "[data-product-meta]"
            );

        if (metaElement) {

            metaElement.innerHTML = "";

            const metaItems = [
                [
                    "Categorie",
                    product.category || "Merch"
                ]
            ];


            if (hasVariants) {

                metaItems.push([
                    product.variantLabel ||
                    "Varianten",
                    Object.keys(
                        product.stock || {}
                    ).join(" · ")
                ]);

            }

            else {

                metaItems.push([
                    "Voorraad",
                    `${Number(product.stock) || 0}`
                ]);

            }


            metaItems.forEach(
                ([label, value]) => {

                    const row =
                        document.createElement(
                            "div"
                        );

                    const labelElement =
                        document.createElement(
                            "span"
                        );

                    labelElement.textContent =
                        label;

                    const valueElement =
                        document.createElement(
                            "strong"
                        );

                    valueElement.textContent =
                        value;

                    row.append(
                        labelElement,
                        valueElement
                    );

                    metaElement.appendChild(
                        row
                    );

                }
            );

        }


        // ========================================
        // PRODUCTAFBEELDINGEN
        // ========================================

        if (
            Array.isArray(product.images) &&
            product.images.length > 0
        ) {

            // ------------------------------------
            // HOOFDAFBEELDING
            // ------------------------------------

            const mainImage =
                document.querySelector(
                    "[data-product-main-image]"
                );

            const firstImagePath =
                getProductImagePath(
                    product.images[0]
                );

            if (mainImage) {

                mainImage.src =
                    firstImagePath;

                mainImage.alt =
                    product.name ||
                    "Voltage Avenue merch";

            }


            // ------------------------------------
            // THUMBNAILS CONTAINER
            // ------------------------------------

            const thumbnailsContainer =
                document.querySelector(
                    ".product-thumbnails"
                );


            if (thumbnailsContainer) {

                // Oude hardcoded thumbnails verwijderen
                thumbnailsContainer.innerHTML = "";


                // Elke Firebase-afbeelding krijgt
                // automatisch een thumbnail
                product.images.forEach(
                    (imagePath, index) => {

                        const fullImagePath =
                            getProductImagePath(
                                imagePath
                            );


                        // -------------------------
                        // Thumbnailknop
                        // -------------------------

                        const button =
                            document.createElement(
                                "button"
                            );

                        button.type = "button";

                        button.className =
                            "product-thumbnail";

                        if (index === 0) {
                            button.classList.add(
                                "is-active"
                            );
                        }


                        button.setAttribute(
                            "data-gallery-thumbnail",
                            ""
                        );

                        button.setAttribute(
                            "data-image",
                            fullImagePath
                        );

                        button.setAttribute(
                            "data-alt",
                            `${product.name} - foto ${index + 1}`
                        );

                        button.setAttribute(
                            "aria-label",
                            `Bekijk productfoto ${index + 1}`
                        );

                        button.setAttribute(
                            "aria-pressed",
                            index === 0
                                ? "true"
                                : "false"
                        );


                        // -------------------------
                        // Afbeelding in thumbnail
                        // -------------------------

                        const image =
                            document.createElement(
                                "img"
                            );

                        image.src =
                            fullImagePath;

                        image.alt = "";


                        // -------------------------
                        // Samenvoegen
                        // -------------------------

                        button.appendChild(image);

                        thumbnailsContainer.appendChild(
                            button
                        );

                    }
                );

            }


            // ====================================
            // LIGHTBOX STARTAFBEELDING
            // ====================================

            const lightboxImage =
                document.querySelector(
                    "[data-lightbox-image]"
                );

            if (lightboxImage) {

                lightboxImage.src =
                    firstImagePath;

                lightboxImage.alt =
                    product.name ||
                    "Voltage Avenue merch";

            }


            // ====================================
            // GALERIJ VERTELLEN:
            // FIREBASE IS KLAAR
            // ====================================

            document.dispatchEvent(
                new CustomEvent(
                    "productGalleryUpdated"
                )
            );

        }


        // ========================================
        // META DESCRIPTION
        // ========================================

        const metaDescription =
            document.querySelector(
                'meta[name="description"]'
            );

        if (
            metaDescription &&
            product.description
        ) {
            metaDescription.setAttribute(
                "content",
                product.description
            );
        }


        // ========================================
        // PAGINATITEL
        // ========================================

        if (product.name) {

            document.title =
                `${product.name} | Voltage Avenue`;

        }

    }

    catch (error) {

        console.error(
            "Er ging iets mis bij het laden van het product:",
            error
        );

    }

}


// ========================================
// PRODUCT LADEN
//
// firebase.js wordt ook door de admin gebruikt.
// Daarom starten we productlogica alleen wanneer
// we daadwerkelijk op een productpagina zitten.
// ========================================

if (
    document.querySelector(
        "[data-product-name]"
    )
) {
    loadProduct();
}