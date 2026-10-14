const fs = require("fs");
const path = require("path");

const shopImagesDirectory = path.join(
    __dirname,
    "..",
    "assets",
    "images",
    "shop"
);

const outputFile = path.join(
    __dirname,
    "..",
    "shop-images.json"
);

const allowedExtensions = new Set([
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".avif"
]);

const images = fs
    .readdirSync(shopImagesDirectory, {
        withFileTypes: true
    })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)

    // Alleen genummerde productafbeeldingen:
    // 01_..., 02_..., 03_..., enz.
    .filter((fileName) => /^\d+_/.test(fileName))

    // Alleen ondersteunde afbeeldingsformaten
    .filter((fileName) =>
        allowedExtensions.has(
            path.extname(fileName).toLowerCase()
        )
    )

    // Natuurlijk sorteren: 2 vóór 10
    .sort((a, b) =>
        a.localeCompare(b, undefined, {
            numeric: true,
            sensitivity: "base"
        })
    );

const shopImages = {
    generated: new Date()
        .toISOString()
        .slice(0, 10),

    basePath: "assets/images/shop/",

    images
};

fs.writeFileSync(
    outputFile,
    `${JSON.stringify(shopImages, null, 2)}\n`,
    "utf8"
);

console.log(
    `shop-images.json bijgewerkt met ${images.length} productafbeeldingen.`
);