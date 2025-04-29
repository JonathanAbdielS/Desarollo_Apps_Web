const path = require('path');

function getHomePage(req, res) {
    res.sendFile(path.join(__dirname, '../views/home.html'));
}

function getShoppingCartPage(req, res) {
    res.sendFile(path.join(__dirname, '../views/shopping_cart.html'));
}

function ping(req, res) {
    res.send('e-commerce app práctica 3');
}

module.exports = {
    getHomePage,
    getShoppingCartPage,
    ping
};
