const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, '../database/pdv_mysql.sql');
let content = fs.readFileSync(dbFile, 'utf8');

const marker = '-- INSERT SCRIPT GENERATED';
if (content.includes(marker)) {
  content = content.substring(0, content.indexOf(marker));
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
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

let sql = `-- INSERT SCRIPT GENERATED\n`;

// 1. Usuarios
let userStartId = 1000;
let userSql = 'INSERT INTO usuarios (id, username, password, role, nombre_completo, estado) VALUES\n';
let userVals = [];
for (let i = 1; i <= N; i++) {
  let r = randomItem(['admin', 'vendedor', 'supervisor']);
  userVals.push(`(${userStartId + i}, 'user_bulk_${i}', 'hash123', '${r}', 'Usuario Generico ${i}', 'activo')`);
}
sql += userSql + userVals.join(',\n') + ';\n\n';


// 2. Proveedores
let suppStartId = 1000;
let suppSql = 'INSERT INTO proveedores (id, nombre, contacto, telefono, rfc, activo) VALUES\n';
let suppVals = [];
for (let i = 1; i <= N; i++) {
  suppVals.push(`(${suppStartId + i}, 'Proveedor Masivo ${i} S.A.', 'Contacto ${i}', '555-000-${String(i).padStart(4, '0')}', 'PROV${String(i).padStart(6, '0')}XYZ', 1)`);
}
sql += suppSql + suppVals.join(',\n') + ';\n\n';


// 3. Categorias
let catStartId = 1000;
let catSql = 'INSERT INTO categorias_producto (id, nombre, slug) VALUES\n';
let catVals = [];
for (let i = 1; i <= N; i++) {
  catVals.push(`(${catStartId + i}, 'Categoria Extra ${i}', 'cat-extra-${i}')`);
}
sql += catSql + catVals.join(',\n') + ';\n\n';


// 4. Productos
let prodStartId = 1000;
let prodSql = 'INSERT INTO productos (id, nombre, categoria_id, codigo_barras, precio, stock, stock_minimo, unidad) VALUES\n';
let prodVals = [];
for (let i = 1; i <= N; i++) {
  let price = Number((Math.random() * 100).toFixed(2));
  prodVals.push(`(${prodStartId + i}, 'Producto Masivo ${i}', ${catStartId + randomInt(1, N)}, '750${String(randomInt(100000000, 999999999))}', ${price}, ${randomInt(50, 200)}, ${randomInt(5, 20)}, 'pzas')`);
}
sql += prodSql + prodVals.join(',\n') + ';\n\n';


// 5. Caja Turnos
let turnoStartId = 1000;
let turnoSql = 'INSERT INTO caja_turnos (id, turno_codigo, usuario_id, hora_apertura, monto_inicial, hora_cierre, estado) VALUES\n';
let turnoVals = [];
for (let i = 1; i <= N; i++) {
  const start = randomDate(startDate, endDate);
  const end = new Date(start.getTime() + randomInt(4, 12) * 3600000);
  turnoVals.push(`(${turnoStartId + i}, 'turno-${i}-${start.getTime()}', ${userStartId + randomInt(1, N)}, '${formatDate(start)}', ${randomInt(500, 2000)}, '${formatDate(end)}', 'cerrado')`);
}
sql += turnoSql + turnoVals.join(',\n') + ';\n\n';


// 6. Ventas y Detalles
let ventaStartId = 1000;
let vdStartId = 1000;
let vSql = 'INSERT INTO ventas (id, ticket_id, fecha_hora, usuario_id, cliente_nombre, subtotal, iva, total, metodo_pago, estado, efectivo_recibido, cambio) VALUES\n';
let vdSql = 'INSERT INTO venta_detalles (id, venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal) VALUES\n';
let vVals = [];
let vdVals = [];

let vdCount = 1;
for (let i = 1; i <= N; i++) {
  const date = randomDate(startDate, endDate);
  const numItems = randomInt(1, 5);
  let totalVenta = 0;
  
  for (let j = 0; j < numItems; j++) {
    const pId = prodStartId + randomInt(1, N);
    const qty = randomInt(1, 5);
    const price = randomInt(10, 100);
    const subtotal = qty * price;
    totalVenta += subtotal;
    vdVals.push(`(${vdStartId + vdCount}, ${ventaStartId + i}, ${pId}, 'Producto Masivo', ${qty}, ${price}, ${subtotal})`);
    vdCount++;
  }
  
  const subtotalNeto = (totalVenta / 1.16).toFixed(2);
  const iva = (totalVenta - subtotalNeto).toFixed(2);
  vVals.push(`(${ventaStartId + i}, 'TK-2026-B${i.toString().padStart(4, '0')}', '${formatDate(date)}', ${userStartId + randomInt(1, N)}, 'Cliente ${i}', ${subtotalNeto}, ${iva}, ${totalVenta}, 'Efectivo', 'Pagado', ${totalVenta}, 0)`);
}
sql += vSql + vVals.join(',\n') + ';\n\n';
sql += vdSql + vdVals.join(',\n') + ';\n\n';


// 7. Mermas
let mermasSql = 'INSERT INTO mermas (producto_id, cantidad, motivo, fecha_hora, usuario_id) VALUES\n';
let mermasVals = [];
for (let i = 1; i <= N; i++) {
  mermasVals.push(`(${prodStartId + randomInt(1, N)}, ${randomInt(1, 5)}, '${randomItem(['Caducidad', 'Empaque dañado', 'Producto roto'])}', '${formatDate(randomDate(startDate, endDate))}', ${userStartId + randomInt(1, N)})`);
}
sql += mermasSql + mermasVals.join(',\n') + ';\n\n';


// 8. Compras y Detalles
let compraStartId = 1000;
let cdStartId = 1000;
let cSql = 'INSERT INTO compras (id, proveedor_id, usuario_id, fecha_hora, total, estado) VALUES\n';
let cdSql = 'INSERT INTO compra_detalles (id, compra_id, producto_id, producto_nombre, cantidad, costo_unitario, subtotal) VALUES\n';
let cVals = [];
let cdVals = [];

let cdCount = 1;
for (let i = 1; i <= N; i++) {
  const date = randomDate(startDate, endDate);
  const numItems = randomInt(1, 4);
  let totalCompra = 0;
  
  for (let j = 0; j < numItems; j++) {
    const pId = prodStartId + randomInt(1, N);
    const qty = randomInt(10, 50);
    const cost = randomInt(5, 50);
    const subtotal = qty * cost;
    totalCompra += subtotal;
    cdVals.push(`(${cdStartId + cdCount}, ${compraStartId + i}, ${pId}, 'Producto Masivo', ${qty}, ${cost}, ${subtotal})`);
    cdCount++;
  }
  
  cVals.push(`(${compraStartId + i}, ${suppStartId + randomInt(1, N)}, ${userStartId + randomInt(1, N)}, '${formatDate(date)}', ${totalCompra}, 'Completado')`);
}
sql += cSql + cVals.join(',\n') + ';\n\n';
sql += cdSql + cdVals.join(',\n') + ';\n\n';


// 9. Caja Movimientos
let movSql = 'INSERT INTO caja_movimientos (turno_id, fecha_hora, tipo, categoria, concepto, monto) VALUES\n';
let movVals = [];
for (let i = 1; i <= N; i++) {
  movVals.push(`(${turnoStartId + randomInt(1, N)}, '${formatDate(randomDate(startDate, endDate))}', '${randomItem(['entrada', 'retiro'])}', '${randomItem(['operativo', 'proveedor', 'otro'])}', '${randomItem(['Fondo extra', 'Pago a proveedor', 'Retiro de efectivo', 'Servicios'])}', ${randomInt(100, 1000)})`);
}
sql += movSql + movVals.join(',\n') + ';\n\n';


// 10. Auditoria Registros
let audSql = 'INSERT INTO auditoria_registros (fecha_hora, usuario_id, usuario_nombre, evento, detalle) VALUES\n';
let audVals = [];
for (let i = 1; i <= N; i++) {
  let uid = userStartId + randomInt(1, N);
  audVals.push(`('${formatDate(randomDate(startDate, endDate))}', ${uid}, 'Usuario Generico ${uid}', '${randomItem(['LOGIN', 'CANCELACION', 'CAMBIO_DE_PRECIO', 'EDICION', 'MERMA'])}', 'Acción realizada en el sistema con ID ${randomInt(100, 999)}')`);
}
sql += audSql + audVals.join(',\n') + ';\n\n';


// 11. Caja Cortes
let cortesSql = 'INSERT INTO caja_cortes (turno_id, fecha_hora, esperado, contado, diferencia) VALUES\n';
let cortesVals = [];
for (let i = 1; i <= N; i++) {
  let esp = randomInt(2000, 5000);
  let cont = randomInt(1800, 5000);
  cortesVals.push(`(${turnoStartId + randomInt(1, N)}, '${formatDate(randomDate(startDate, endDate))}', ${esp}, ${cont}, ${cont - esp})`);
}
sql += cortesSql + cortesVals.join(',\n') + ';\n\n';


// 12. Reportes
let repSql = 'INSERT INTO reportes (modulo, nombre, desde, hasta, generado_por, generado_por_nombre, generado_en) VALUES\n';
let repVals = [];
for (let i = 1; i <= N; i++) {
  let uid = userStartId + randomInt(1, N);
  let date = randomDate(startDate, endDate);
  repVals.push(`('${randomItem(['ventas', 'tesoreria'])}', 'Reporte Masivo ${i}', '${formatDateOnly(new Date(date.getTime() - 7*86400000))}', '${formatDateOnly(date)}', ${uid}, 'Usuario Generico ${uid}', '${formatDate(date)}')`);
}
sql += repSql + repVals.join(',\n') + ';\n\n';


fs.writeFileSync(dbFile, content + sql);
console.log('Successfully generated and appended correct SQL schema!');
