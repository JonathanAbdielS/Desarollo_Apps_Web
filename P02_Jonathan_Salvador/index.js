import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, findProduct,productListToHTML } from './data_handler.js';
import { ShoppingCart } from './shopping_cart.js';
import { generateUUID } from './utils.js';
import { Product } from './product.js';

const prod1 = new Product(generateUUID(), "Guanabana", "Las mejor Wanabana", "url", "pieza", 15, 3.6, "Fruta");
createProduct(prod1);
//-------------
// index.js


// 1. Obtener todos los productos
console.log("Todos los productos:");
console.log(getProducts());

// 2. Obtener un producto por su UUID
const productId = "df2008a5-1c40-4dd1-9db7-8aacc03ae2fb";
console.log(`Producto con UUID ${productId}:`);
console.log(getProductById(productId));

// 3. Crear un nuevo producto
const newProduct = createProduct(
    new Product(
        generateUUID(), // Se generará automáticamente
        "Naranja",
        "Naranjas dulces y jugosas de Veracruz.",
        "https://images.freeimages.com/images/large-previews/5a2/orange-1327498.jpg",
        "pieza",
        25,
        4.0,
        "Fruta"
    )
);
console.log("Nuevo producto creado:");
console.log(newProduct);
console.log("La UUID del nuevo producto", newProduct.uuid);
// 4. Actualizar un producto
const updatedProduct = new Product(
    newProduct.uuid,
    newProduct.title,
    newProduct.description,
    newProduct.imageUrl,
    newProduct.unit,
    newProduct.stock,
    4.5, // Actualizar el precio
    newProduct.category
);

const result = updateProduct(newProduct.uuid, updatedProduct);
console.log("Producto actualizado:");
console.log(result);

// 5. Eliminar un producto
const deletedProduct = deleteProduct(newProduct.uuid);
console.log("Producto eliminado:");
console.log(deletedProduct);

// 6. Búsqueda de productos
console.log("Búsqueda por categoría (Fruta):");
console.log(findProduct("Fruta:"));

console.log("Búsqueda por nombre (Manzana):");
console.log(findProduct(":Manzana"));

console.log("Búsqueda combinada (Fruta: Plátano):");
console.log(findProduct("Fruta: Plátano"));

//-------------------------------
const cart = new ShoppingCart();
cart.addItem(prod1.uuid, 2);
console.log(getProducts());

// 1. Agregar productos al carrito
cart.addItem("df2008a5-1c40-4dd1-9db7-8aacc03ae2fb", 2); // 2 plátanos
cart.addItem("a1b2c3d4-e5f6-4a3b-9c8d-1e2f3a4b5c6d", 3); // 3 manzanas
cart.addItem("b2c3d4e5-f6a7-4b8c-9d1e-2f3a4b5c6d7e", 1); // 1 lechuga
cart.addItem("c3d4e5f6-a7b8-4c9d-1e2f-3a4b5c6d7e8f", 2); // 2 kg de pollo

console.log("Carrito después de agregar productos:");
console.log(cart.proxies);

// 2. Actualizar un producto en el carrito
cart.updateItem("df2008a5-1c40-4dd1-9db7-8aacc03ae2fb", 5); // Cambiar a 5 plátanos
console.log("Carrito después de actualizar un producto:");
console.log(cart.proxies);

// 3. Eliminar un producto del carrito
cart.removeItem("b2c3d4e5-f6a7-4b8c-9d1e-2f3a4b5c6d7e"); // Eliminar lechuga
console.log("Carrito después de eliminar un producto:");
console.log(cart.proxies);

// 4. Calcular el total de la compra
const total = cart.calculateTotal();
console.log("Total de la compra:", total);

// --
const jsonProduct = JSON.stringify({
    "uuid": "${generateUUID()}",
    "title": "Plátano",
    "description": "Los mejores plátanos de México, directo desde Tabasco.",
    "imageUrl": "https://images.freeimages.com/images/large-previews/4ec/banana-s-1326714.jpg",
    "unit": "pieza",
    "stock": 15,
    "pricePerUnit": 3.6,
    "category": "Fruta"
});

const product = Product.createFromJson(jsonProduct);
console.log("Producto creado desde JSON:");
console.log(product);

//.-.-.-.-.

//.-.-.-.-..-

const productListElement = document.getElementById("product-list");
const products = getProducts();
productListToHTML(products, productListElement);