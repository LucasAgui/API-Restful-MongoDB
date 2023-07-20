const { connectToDb, disconnect, generateCode } = require('../mongodb.js');
const express = require('express');
const server = express();
const COLLECTION_NAME = 'computacion';
const messageNotFound = JSON.stringify({
    message: 'El codigo no pertenece a un producto exixtente'
});
const messageMissingData = JSON.stringify({ message: 'Faltan datos' });
const messageErrorServer = JSON.stringify({
    message: 'Se produjo un error en el servidor'
});

server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Traer TODOS los productos o FILTRAR POR NOMBRE
server.get('/productos', async (req, res) => {
    const { nombre } = req.query;
    let productos = [];

    try {
        const collection = await connectToDb(COLLECTION_NAME);
        if (nombre) productos = await collection.find({ nombre }).toArray();
        else productos = await collection.find().toArray();
        res.status(200).send(JSON.stringify(productos, null, '\t'));
    } catch (error) {
        res.status(500).send(messageErrorServer);
    } finally {
        disconnect();
    }
});
// Traer UN PRODUCTO en específico por CÓDIGO
server.get('/productos/:codigo', async (req, res) => {
    const { codigo } = req.params;
    try {
        const collection = await connectToDb(COLLECTION_NAME);
        const productoFiltrado = await collection.findOne({
            codigo: Number(codigo)
        });
        if (!productoFiltrado) res.status(400).send(messageNotFound);
        res.status(200).send(JSON.stringify(productoFiltrado, null, '\t'));
    } catch (error) {
        res.status(500).send(messageErrorServer);
    } finally {
        disconnect();
    }
});

// Traer UNO O MÁS productos por nombre o parte del mismo
server.get('/productos/nombre/:nombre', async (req, res) => {
    const nombre = req.params.nombre;
    console.log(nombre);
    let productoNombre = RegExp(nombre, 'i');
    try {
        const collection = await connectToDb(COLLECTION_NAME);
        const productosFiltrados = await collection
            .find({ nombre: productoNombre })
            .toArray();
        if (productosFiltrados.length === 0)
            res.status(400).send(messageNotFound);
        res.status(200).send(JSON.stringify(productosFiltrados, null, '\t'));
    } catch (error) {
        res.status(500).send(messageErrorServer);
    } finally {
        disconnect();
    }
});

// Traer TODOS los productos por una categoría específica
server.get('/productos/categoria/:categoria', async (req, res) => {
    const categoria = req.params.categoria;
    console.log(categoria);
    let productoCategoria = RegExp(categoria, 'i');
    try {
        const collection = await connectToDb(COLLECTION_NAME);
        const productosFiltrados = await collection
            .find({ nombre: productoCategoria })
            .toArray();

        if (productosFiltrados.length === 0)
            res.status(400).send(messageNotFound);
        res.status(200).send(JSON.stringify(productosFiltrados, null, '\t'));
    } catch (error) {
        res.status(500).send(messageErrorServer);
    } finally {
        disconnect();
    }
});

// AGREGAR UN producto
server.post('/productos', async (req, res) => {
    const { nombre, precio, categoria } = req.body;
    if (!nombre || !precio || !categoria) {
        res.status(400).send(
            `${messageMissingData} Nombre, categoría y precio son necesarios. `
        );
    }
    const collection = await connectToDb(COLLECTION_NAME);
    const nuevoProducto = {
        codigo: await generateCode(collection),
        nombre,
        precio,
        categoria
    };
    await collection.insertOne(nuevoProducto);
    res.status(200).send(JSON.stringify({ productoInsertado: nuevoProducto }));
    disconnect();
});

// MODIFICAR UN producto SENTERO o SOLO EL PRECIO
server.put('/productos/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { nombre, precio, categoria } = req.body;
    if ((!codigo || !precio || !categoria || !nombre) && (!codigo, !precio)) {
        res.status(400).send(messageMissingData);
    }
    try {
        const collection = await connectToDb(COLLECTION_NAME);
        let productoModificado = await collection.findOne({
            codigo: { $eq: Number(codigo) }
        });
        // if (!productoModificado) return res.status(400).send(messageNotFound);
        if (precio && !nombre && !categoria) productoModificado = { precio };
        else productoModificado = { nombre, precio, categoria };

        await collection.updateOne(
            { codigo: Number(codigo) },
            { $set: productoModificado }
        );
        res.status(200).send('Se ha modificado el producto correctamente');
    } catch (error) {
        console.log(error.message);
        // res.status(500).send(messageErrorServer);
    } finally {
        await disconnect();
    }
});

// MODIFICAR PRECIO de un producto en específico
server.put('/productos/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { precio } = req.body;
    if (!precio) {
        res.status(400).send(messageMissingData);
    }
    try {
        const collection = await connectToDb(COLLECTION_NAME);
        let productoModificado = await collection.findOne({
            codigo: { $eq: Number(codigo) }
        });
        if (!productoModificado) return res.status(400).send(messageNotFound);
        productoModificado = { precio };
        console.log(productoModificado);
        await collection.updateOne(
            { codigo: Number(codigo) },
            { $set: productoModificado }
        );
        res.status(200).send(JSON.stringify(productoModificado, null, '\t'));
    } catch (error) {
        console.log(error.message);
        res.status(500).send(messageErrorServer);
    } finally {
        await disconnect();
    }
});

// ELIMINAR UN producto
server.delete('/productos/:codigo', async (req, res) => {
    const { codigo } = req.params;
    try {
        const collection = await connectToDb(COLLECTION_NAME);
        let productoParaEliminar = await collection.findOne({
            codigo: { $eq: Number(codigo) }
        });
        if (!productoParaEliminar) return res.status(400).send(messageNotFound);
        await collection.deleteOne({ codigo: { $eq: Number(codigo) } });
        res.status(200).send(
            `Eliminaste el siguiente producto: ${JSON.stringify(
                productoParaEliminar
            )}`
        );
    } catch (error) {
        console.log(error.message);
        res.status(500).send(messageErrorServer);
    } finally {
        await disconnect();
    }
});

// Manejo de RUTAS
server.get('/*', (req, res) => {
    res.status(404).send('No se ha encontrado la página que estas buscando');
});

server.listen(process.env.SERVER_PORT, process.env.SERVER_HOST, () => {
    console.log(
        `Servidor escuchando en http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/productos`
    );
});
