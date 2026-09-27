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


if (productForm) {

    productForm.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();


            const images =
                getSelectedImagePaths();


            console.log(
                "Geselecteerde productfoto's:",
                images
            );


            console.log(
                "Productformulier klaar voor Firebase."
            );

        }
    );

}


// ========================================
// START ADMIN
// ========================================

loadShopImages();
