const mysql = require('mysql2/promise');

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const N = 50;
const startDate = new Date('2026-03-01T00:00:00');
const endDate = new Date('2026-06-06T20:00:00');

async function seed() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'proyectopdv'
  });

  console.log('Connected to DB. Seeding 50 records per table...');

  try {
    // 1. Usuarios
    const roles = ['Administrador', 'Cajero', 'Gerente'];
    const users = [];
    for (let i = 1; i <= N; i++) {
      const u = [
        `user_bulk_${i}`,
        'hash123',
        randomItem(roles),
        `Usuario Generico ${i}`,
        'Sucursal Centro',
        1
      ];
      users.push(u);
    }
    const [resUsers] = await connection.query(`INSERT INTO usuarios (username, password, rol, nombre_completo, sucursal, activo) VALUES ?`, [users]);
    console.log('Inserted Usuarios');

    // 2. Proveedores
    const suppliers = [];
    for (let i = 1; i <= N; i++) {
      suppliers.push([
        `Proveedor Masivo ${i} S.A.`,
        `Contacto ${i}`,
        `555-000-${String(i).padStart(4, '0')}`,
        `PROV${String(i).padStart(6, '0')}XYZ`,
        1
      ]);
    }
    await connection.query(`INSERT INTO proveedores (nombre, contacto, telefono, rfc, activo) VALUES ?`, [suppliers]);
    console.log('Inserted Proveedores');

    // 3. Categorias
    const cats = [];
    for (let i = 1; i <= N; i++) {
      cats.push([`Categoria Extra ${i}`, `cat-extra-${i}`]);
    }
    await connection.query(`INSERT INTO categorias_producto (name, slug) VALUES ?`, [cats]);
    console.log('Inserted Categorias');

    // Fetch categorical IDs to use in products
    const [dbCats] = await connection.query('SELECT id FROM categorias_producto');
    const catIds = dbCats.map(c => c.id);

    // 4. Productos
    const products = [];
    for (let i = 1; i <= N; i++) {
      products.push([
        `Producto Masivo ${i}`,
        randomItem(catIds),
        `750${String(randomInt(1000000000, 9999999999))}`,
        Number((Math.random() * 100).toFixed(2)),
        randomInt(50, 200),
        randomInt(5, 20),
        'pzas'
      ]);
    }
    await connection.query(`INSERT INTO productos (nombre, categoria_id, codigo_barras, precio, stock, stock_minimo, unidad) VALUES ?`, [products]);
    console.log('Inserted Productos');

    const [dbUsers] = await connection.query('SELECT id FROM usuarios');
    const userIds = dbUsers.map(u => u.id);

    const [dbProducts] = await connection.query('SELECT id, precio FROM productos');
    const prodList = dbProducts;

    const [dbSuppliers] = await connection.query('SELECT id FROM proveedores');
    const suppIds = dbSuppliers.map(s => s.id);

    // 5. Caja Turnos (necesarios para ventas y cortes)
    const turnos = [];
    for (let i = 1; i <= N; i++) {
      const start = randomDate(startDate, endDate);
      const end = new Date(start.getTime() + randomInt(4, 12) * 3600000);
      turnos.push([
        randomItem(userIds),
        formatDate(start),
        formatDate(end),
        randomInt(500, 2000), // saldo inicial
        'Cerrado'
      ]);
    }
    await connection.query(`INSERT INTO caja_turnos (usuario_id, fecha_inicio, fecha_fin, saldo_inicial, estado) VALUES ?`, [turnos]);
    console.log('Inserted Turnos');

    const [dbTurnos] = await connection.query('SELECT id FROM caja_turnos');
    const turnoIds = dbTurnos.map(t => t.id);

    // 6. Ventas
    // To avoid triggers messing up the exact historical dates, we might insert the details carefully, 
    // but trigger uses CURRENT_TIMESTAMP or it inherits the insert? The trigger uses NOW() for auditoria, but ventas has su propia fecha_hora.
    // Wait, the trigger TRG_VentaDetalle_AfterInsert just reduces stock.
    const ventas = [];
    for (let i = 1; i <= N; i++) {
      ventas.push([
        randomItem(turnoIds),
        'Efectivo',
        0, // total will be updated by trigger or we can set it.
        0, // recibido
        0, // cambio
        'Pagado',
        formatDate(randomDate(startDate, endDate))
      ]);
    }
    await connection.query(`INSERT INTO ventas (turno_id, metodo_pago, total, cantidad_recibida, cambio, estado, fecha_hora) VALUES ?`, [ventas]);
    
    // Retrieve sales to insert details
    const [dbVentas] = await connection.query('SELECT id, fecha_hora FROM ventas ORDER BY id DESC LIMIT ?', [N]);
    
    const ventaDetalles = [];
    const updateVentas = [];
    for (const v of dbVentas) {
      const numItems = randomInt(1, 5);
      let totalVenta = 0;
      for (let j = 0; j < numItems; j++) {
        const prod = randomItem(prodList);
        const qty = randomInt(1, 5);
        const subtotal = qty * prod.precio;
        totalVenta += subtotal;
        ventaDetalles.push([v.id, prod.id, qty, prod.precio, subtotal]);
      }
      updateVentas.push([v.id, totalVenta]);
    }
    await connection.query(`INSERT INTO venta_detalles (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ?`, [ventaDetalles]);
    
    for (const v of updateVentas) {
      await connection.query(`UPDATE ventas SET total = ?, cantidad_recibida = ?, cambio = 0 WHERE id = ?`, [v[1], v[1], v[0]]);
    }
    console.log('Inserted Ventas and Detalles');

    // 7. Mermas
    const mermas = [];
    for (let i = 1; i <= N; i++) {
      mermas.push([
        randomItem(prodList).id,
        randomInt(1, 5),
        randomItem(['Caducidad', 'Empaque dañado', 'Producto roto']),
        formatDate(randomDate(startDate, endDate)),
        randomItem(userIds)
      ]);
    }
    await connection.query(`INSERT INTO mermas (producto_id, cantidad, motivo, fecha_hora, usuario_id) VALUES ?`, [mermas]);
    console.log('Inserted Mermas');

    // 8. Compras
    const compras = [];
    for (let i = 1; i <= N; i++) {
      compras.push([
        randomItem(suppIds),
        randomItem(userIds),
        0, // total
        'Completada',
        formatDate(randomDate(startDate, endDate))
      ]);
    }
    await connection.query(`INSERT INTO compras (proveedor_id, usuario_id, total, estado, fecha_solicitud) VALUES ?`, [compras]);
    
    const [dbCompras] = await connection.query('SELECT id FROM compras ORDER BY id DESC LIMIT ?', [N]);
    const compraDetalles = [];
    const updateCompras = [];
    for (const c of dbCompras) {
      const numItems = randomInt(1, 4);
      let totalCompra = 0;
      for (let j = 0; j < numItems; j++) {
        const prod = randomItem(prodList);
        const qty = randomInt(10, 50);
        const cost = prod.precio * 0.6; // 60% of retail price
        const subtotal = qty * cost;
        totalCompra += subtotal;
        compraDetalles.push([c.id, prod.id, qty, cost, subtotal]);
      }
      updateCompras.push([c.id, totalCompra]);
    }
    await connection.query(`INSERT INTO compra_detalles (compra_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ?`, [compraDetalles]);
    for (const c of updateCompras) {
      await connection.query(`UPDATE compras SET total = ? WHERE id = ?`, [c[1], c[0]]);
    }
    console.log('Inserted Compras');

    // 9. Caja Movimientos
    const movimientos = [];
    for (let i = 1; i <= N; i++) {
      movimientos.push([
        randomItem(turnoIds),
        randomItem(['ENTRADA', 'SALIDA']),
        randomItem(['Fondo extra', 'Pago a proveedor', 'Retiro de efectivo', 'Servicios']),
        randomInt(100, 1000),
        formatDate(randomDate(startDate, endDate))
      ]);
    }
    await connection.query(`INSERT INTO caja_movimientos (turno_id, tipo, concepto, monto, fecha_hora) VALUES ?`, [movimientos]);
    console.log('Inserted Movimientos');

    // 10. Auditoria Registros
    const auditoria = [];
    for (let i = 1; i <= N; i++) {
      auditoria.push([
        formatDate(randomDate(startDate, endDate)),
        `Usuario Generico ${randomInt(1, 10)}`,
        randomItem(['LOGIN', 'CANCELACION', 'CAMBIO_DE_PRECIO', 'EDICION', 'MERMA']),
        `Acción realizada en el sistema con ID ${randomInt(100, 999)}`
      ]);
    }
    await connection.query(`INSERT INTO auditoria_registros (fecha_hora, usuario_nombre, evento, detalle) VALUES ?`, [auditoria]);
    console.log('Inserted Auditoria');

    // 11. Caja Cortes
    const cortes = [];
    for (let i = 1; i <= N; i++) {
      cortes.push([
        randomItem(turnoIds),
        randomInt(2000, 5000),
        randomInt(1800, 5000),
        formatDate(randomDate(startDate, endDate))
      ]);
    }
    await connection.query(`INSERT INTO caja_cortes (turno_id, total_calculado, total_real, fecha_corte) VALUES ?`, [cortes]);
    console.log('Inserted Cortes');

    // 12. Reportes
    const reportes = [];
    for (let i = 1; i <= N; i++) {
      reportes.push([
        randomItem(['Ventas por dia', 'Top productos vendidos', 'Reporte de Mermas', 'Movimientos de caja']),
        randomItem(userIds),
        formatDate(randomDate(startDate, endDate))
      ]);
    }
    await connection.query(`INSERT INTO reportes (tipo, generado_por, fecha_generacion) VALUES ?`, [reportes]);
    console.log('Inserted Reportes');

    console.log('ALL SEEDING COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await connection.end();
  }
}

seed();
