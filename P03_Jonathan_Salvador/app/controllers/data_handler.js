const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/products.json');

function readProducts() {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}

function saveProducts(products) {
    fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf-8');
}

module.exports = {
    readProducts,
    saveProducts
};
