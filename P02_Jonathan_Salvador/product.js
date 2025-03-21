import { generateUUID } from './utils.js';

class ProductException {
    constructor(error) {
        this.error = error;
        this.message = "ProductException: ";
        if (error) {
            this.message += error;
        }
    }
}

class Product {
    constructor(uuid, title, description, imageUrl, unit, stock, pricePerUnit, category) {
        this._uuid = uuid || generateUUID();
        this.title = title;
        this.description = description;
        this.imageUrl = imageUrl;
        this.unit = unit;
        this.stock = stock;
        this.pricePerUnit = pricePerUnit;
        this.category = category;
    }

    get uuid() {
        return this._uuid;
    }

    set uuid(value) {
        throw new ProductException("No se puede modificar el UUID manualmente.");
    }

    get title() {
        return this._title;
    }

    set title(value) {
        if (!value || typeof value !== 'string' || value.trim() === '') {
            throw new ProductException("El título no puede estar vacío.");
        }
        this._title = value;
    }

    get description() {
        return this._description;
    }

    set description(value) {
        if (!value || typeof value !== 'string' || value.trim() === '') {
            throw new ProductException("La descripción no puede estar vacía.");
        }
        this._description = value;
    }

    get imageUrl() {
        return this._imageUrl;
    }

    set imageUrl(value) {
        if (!value || typeof value !== 'string' || value.trim() === '') {
            throw new ProductException("La URL de la imagen no puede estar vacía.");
        }
        this._imageUrl = value;
    }

    get unit() {
        return this._unit;
    }

    set unit(value) {
        if (!value || typeof value !== 'string' || value.trim() === '') {
            throw new ProductException("La unidad no puede estar vacía.");
        }
        this._unit = value;
    }

    get stock() {
        return this._stock;
    }

    set stock(value) {
        if (typeof value !== 'number' || value < 0) {
            throw new ProductException("El stock debe ser un número positivo.");
        }
        this._stock = value;
    }

    get pricePerUnit() {
        return this._pricePerUnit;
    }

    set pricePerUnit(value) {
        if (typeof value !== 'number' || value < 0) {
            throw new ProductException("El precio por unidad debe ser un número positivo.");
        }
        this._pricePerUnit = value;
    }

    get category() {
        return this._category;
    }

    set category(value) {
        if (!value || typeof value !== 'string' || value.trim() === '') {
            throw new ProductException("La categoría no puede estar vacía.");
        }
        this._category = value;
    }

    // estáticos
    static createFromJson(jsonValue) {
        try {
            const obj = JSON.parse(jsonValue);
            return Product.createFromObject(obj);
        } catch (error) {
            throw new ProductException("Error al parsear JSON: " + error.message);
        }
    }

    static createFromObject(obj) {
        const cleanedObj = Product.cleanObject(obj);
        console.log(cleanedObj);
        return new Product(
            cleanedObj.uuid,
            cleanedObj.title,
            cleanedObj.description,
            cleanedObj.imageUrl,
            cleanedObj.unit,
            cleanedObj.stock,
            cleanedObj.pricePerUnit,
            cleanedObj.category
        );
    }

    static cleanObject(obj) {
        const validKeys = ["uuid", "title", "description", "imageUrl", "unit", "stock", "pricePerUnit", "category"];
        const cleanedObj = {};
        for (const key of validKeys) {
            if (obj.hasOwnProperty(key)) {
                cleanedObj[key] = obj[key];
            }
        }
        return cleanedObj;
    }

    // toHTML
    toHTML() {
        return `
            <div class="card product mb-3" style="width: 18rem;">
                <img src="${this.imageUrl}" class="card-img-top" alt="${this.title}" style="height: 200px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title">${this.title}</h5>
                    <p class="card-text">${this.description}</p>
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item"><strong>Unidad:</strong> ${this.unit}</li>
                        <li class="list-group-item"><strong>Stock:</strong> ${this.stock}</li>
                        <li class="list-group-item"><strong>Precio:</strong> $${this.pricePerUnit.toFixed(2)}</li>
                        <li class="list-group-item"><strong>Categoría:</strong> ${this.category}</li>
                    </ul>
                    <div class="card-body">
                    </div>
                </div>
            </div>
        `;
    }
}

export { Product, ProductException };