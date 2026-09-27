// ========================================
// VOLTAGE AVENUE - MERCH ADMIN
// ========================================


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

    // ----------------------------------------
    // Juiste inhoud tonen
    // ----------------------------------------

    adminPages.forEach((page) => {

        const isActive =
            page.dataset.adminContent === pageName;

        page.classList.toggle(
            "is-active",
            isActive
        );

    });


    // ----------------------------------------
    // Juiste navigatieknop actief maken
    // ----------------------------------------

    navigationButtons.forEach((button) => {

        const isActive =
            button.dataset.adminPage === pageName;

        button.classList.toggle(
            "is-active",
            isActive
        );

    });


    // ----------------------------------------
    // Op mobiel weer naar boven
    // ----------------------------------------

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
// PRODUCT TOEVOEGEN KNOP
// ========================================

const openNewProductButton =
    document.querySelector(
        "[data-open-new-product]"
    );

if (openNewProductButton) {

    openNewProductButton.addEventListener(
        "click",
        () => {

            openAdminPage("new-product");

        }
    );

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


    // Met varianten:
    // toon variantbeheer
    variantsSection.hidden =
        !hasVariants;


    // Zonder varianten:
    // toon gewone voorraad
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


    // ----------------------------------------
    // Variantnaam
    // ----------------------------------------

    const nameInput =
        document.createElement("input");

    nameInput.type = "text";

    nameInput.placeholder =
        "Bijvoorbeeld: M";

    nameInput.setAttribute(
        "aria-label",
        "Variant"
    );


    // ----------------------------------------
    // Voorraad
    // ----------------------------------------

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


    // ----------------------------------------
    // Verwijderen
    // ----------------------------------------

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


    // ----------------------------------------
    // Rij samenstellen
    // ----------------------------------------

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


            // Cursor meteen in nieuwe variant
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
//
// Event delegation:
// werkt ook voor varianten die later
// dynamisch zijn toegevoegd.
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


            // Minimaal één invoerrij laten staan
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
// PRODUCTFORMULIER
// ========================================

const productForm =
    document.querySelector(
        "[data-product-form]"
    );


if (productForm) {

    productForm.addEventListener(
        "submit",
        (event) => {

            // Nog niet daadwerkelijk opslaan.
            // Firestore koppelen we hierna.
            event.preventDefault();

            console.log(
                "Productformulier klaar voor Firebase."
            );

        }
    );

}
