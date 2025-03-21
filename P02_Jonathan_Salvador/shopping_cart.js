import { getProductById } from './data_handler.js';

class ShoppingCartException {
    constructor(error) {
        this.error = error;
        this.message = "ShoppingCartException: ";
        if (error) {
            this.message += error;
        }
    }
}

class ProductProxy {
    constructor(productUuid, amount) {
        this.productUuid = productUuid;
        this.amount = amount;
    }
}

class ShoppingCart {
    constructor() {
        this._proxies = [];
        this._products = [];
    }

    addItem(productUuid, amount) {
        if (amount <= 0) {
            throw new ShoppingCartException("La cantidad debe ser mayor que 0.");
        }

        const product = getProductById(productUuid);
        if (!product) {
            throw new ShoppingCartException("Producto no encontrado.");
        }

        const existingProxy = this._proxies.find(proxy => proxy.productUuid === productUuid);
        if (existingProxy) {
            existingProxy.amount += amount;
        } else {
            this._proxies.push(new ProductProxy(productUuid, amount));
            this._products.push({ ...product });
        }
    }

    updateItem(productUuid, newAmount) {
        if (newAmount < 0) {
            throw new ShoppingCartException("La cantidad no puede ser negativa.");
        }

        const existingProxy = this._proxies.find(proxy => proxy.productUuid === productUuid);
        if (!existingProxy) {
            throw new ShoppingCartException("Producto no encontrado en el carrito.");
        }

        if (newAmount === 0) {
            this.removeItem(productUuid);
        } else {
            existingProxy.amount = newAmount;
        }
    }

    removeItem(productUuid) {
        const proxyIndex = this._proxies.findIndex(proxy => proxy.productUuid === productUuid);
        if (proxyIndex === -1) {
            throw new ShoppingCartException("Producto no encontrado en el carrito.");
        }

        this._proxies.splice(proxyIndex, 1);
        this._products.splice(proxyIndex, 1);
    }



    calculateTotal() {
        return this._proxies.reduce((total, proxy) => {
            const product = this._products.find(p => p._uuid == proxy.productUuid);
            if (!product) {
                throw new ShoppingCartException(`Producto con UUID ${proxy.productUuid} no encontrado.`);
            }
            return total + (product._pricePerUnit * proxy.amount);
        }, 0);
    }

    get proxies() {
        return [...this._proxies];
    }

    get products() {
        return [...this._products];
    }
}

export { ShoppingCart, ProductProxy, ShoppingCartException };