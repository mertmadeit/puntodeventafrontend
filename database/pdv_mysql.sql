Drop database if exists PuntoDeVentaDB;
CREATE DATABASE IF NOT EXISTS PuntoDeVentaDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE PuntoDeVentaDB;

SET NAMES utf8mb4;
SET time_zone = '+00:00';

DROP TABLE IF EXISTS reportes;
DROP TABLE IF EXISTS caja_cortes;
DROP TABLE IF EXISTS caja_movimientos;
DROP TABLE IF EXISTS caja_turnos;
DROP TABLE IF EXISTS auditoria_registros;
DROP TABLE IF EXISTS venta_detalles;
DROP TABLE IF EXISTS ventas;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS categorias_producto;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  nombre_completo VARCHAR(100) NOT NULL,
  estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  image_url LONGTEXT NULL
) ENGINE=InnoDB;

CREATE TABLE categorias_producto (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  slug VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE productos (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(160) NOT NULL,
  categoria_id BIGINT UNSIGNED NOT NULL,
  codigo_barras VARCHAR(32) NULL UNIQUE,
  precio DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 0,
  unidad VARCHAR(20) NOT NULL DEFAULT 'pzas',
  imagen_url TEXT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias_producto(id),
  INDEX idx_productos_nombre (nombre),
  INDEX idx_productos_stock (stock, stock_minimo)
) ENGINE=InnoDB;

CREATE TABLE ventas (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  ticket_id VARCHAR(40) NOT NULL UNIQUE,
  fecha_hora DATETIME NOT NULL,
  usuario_id BIGINT NOT NULL,
  cliente_nombre VARCHAR(120) NOT NULL DEFAULT 'Publico general',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  iva DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  metodo_pago ENUM('Efectivo', 'Tarjeta', 'Transferencia') NOT NULL,
  estado ENUM('Pagado', 'Cancelado', 'Devuelto') NOT NULL DEFAULT 'Pagado',
  efectivo_recibido DECIMAL(10,2) NULL,
  cambio DECIMAL(10,2) NULL,
  motivo_cancelacion VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ventas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_ventas_fecha (fecha_hora),
  INDEX idx_ventas_estado (estado),
  INDEX idx_ventas_metodo (metodo_pago)
) ENGINE=InnoDB;

CREATE TABLE venta_detalles (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  venta_id BIGINT UNSIGNED NOT NULL,
  producto_id BIGINT UNSIGNED NULL,
  producto_nombre VARCHAR(160) NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_detalles_venta FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  CONSTRAINT fk_detalles_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
  INDEX idx_detalles_venta (venta_id)
) ENGINE=InnoDB;

CREATE TABLE auditoria_registros (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  fecha_hora DATETIME NOT NULL,
  usuario_id BIGINT NULL,
  usuario_nombre VARCHAR(120) NOT NULL,
  evento ENUM('LOGIN', 'CANCELACION', 'CAMBIO_DE_PRECIO', 'EDICION', 'MERMA') NOT NULL,
  detalle VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_auditoria_fecha (fecha_hora),
  INDEX idx_auditoria_evento (evento)
) ENGINE=InnoDB;

CREATE TABLE caja_turnos (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  turno_codigo VARCHAR(60) NOT NULL UNIQUE,
  usuario_id BIGINT NOT NULL,
  hora_apertura DATETIME NOT NULL,
  monto_inicial DECIMAL(10,2) NOT NULL,
  hora_cierre DATETIME NULL,
  estado ENUM('abierto', 'cerrado') NOT NULL DEFAULT 'abierto',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_turno_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_turno_estado (estado)
) ENGINE=InnoDB;

CREATE TABLE caja_movimientos (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  turno_id BIGINT UNSIGNED NOT NULL,
  fecha_hora DATETIME NOT NULL,
  tipo ENUM('entrada', 'retiro') NOT NULL,
  categoria ENUM('operativo', 'proveedor', 'otro') NOT NULL,
  concepto VARCHAR(255) NOT NULL,
  proveedor_nombre VARCHAR(120) NULL,
  monto DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mov_turno FOREIGN KEY (turno_id) REFERENCES caja_turnos(id) ON DELETE CASCADE,
  INDEX idx_mov_fecha (fecha_hora),
  INDEX idx_mov_tipo (tipo)
) ENGINE=InnoDB;

CREATE TABLE caja_cortes (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  turno_id BIGINT UNSIGNED NOT NULL,
  fecha_hora DATETIME NOT NULL,
  esperado DECIMAL(10,2) NOT NULL,
  contado DECIMAL(10,2) NOT NULL,
  diferencia DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_corte_turno FOREIGN KEY (turno_id) REFERENCES caja_turnos(id) ON DELETE CASCADE,
  INDEX idx_corte_fecha (fecha_hora)
) ENGINE=InnoDB;

CREATE TABLE reportes (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  modulo ENUM('ventas', 'tesoreria') NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  desde DATE NULL,
  hasta DATE NULL,
  generado_por BIGINT NULL,
  generado_por_nombre VARCHAR(120) NOT NULL,
  generado_en DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reporte_usuario FOREIGN KEY (generado_por) REFERENCES usuarios(id),
  INDEX idx_reportes_modulo (modulo),
  INDEX idx_reportes_fecha (generado_en)
) ENGINE=InnoDB;


CREATE TABLE proveedores (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  contacto VARCHAR(120) NULL,
  telefono VARCHAR(50) NULL,
  rfc VARCHAR(50) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_proveedores_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE compras (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  proveedor_id BIGINT UNSIGNED NOT NULL,
  usuario_id BIGINT NOT NULL,
  fecha_hora DATETIME NOT NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  estado ENUM('Completado', 'Cancelado') NOT NULL DEFAULT 'Completado',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_compras_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
  CONSTRAINT fk_compras_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_compras_fecha (fecha_hora)
) ENGINE=InnoDB;

CREATE TABLE compra_detalles (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  compra_id BIGINT UNSIGNED NOT NULL,
  producto_id BIGINT UNSIGNED NOT NULL,
  producto_nombre VARCHAR(160) NOT NULL,
  cantidad INT NOT NULL,
  costo_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_compra_detalles_compra FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
  CONSTRAINT fk_compra_detalles_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB;

CREATE TABLE mermas (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  producto_id BIGINT UNSIGNED NOT NULL,
  cantidad INT NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  fecha_hora DATETIME NOT NULL,
  usuario_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mermas_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
  CONSTRAINT fk_mermas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

INSERT INTO usuarios (id, username, password, role, nombre_completo, estado, image_url) VALUES
  (1, 'admin', 'admin', 'admin', 'Mert Made It', 'activo', NULL),
  (2, 'juan', 'admin', 'vendedor', 'Juan Perez', 'activo', NULL),
  (3, 'ana', 'admin', 'vendedor', 'Ana Diaz', 'activo', NULL),
  (4, 'carlos', 'admin', 'supervisor', 'Carlos Perez', 'activo', NULL),
  (5, 'laura', 'admin', 'supervisor', 'Laura Gomez', 'activo', NULL),
  (6, 'pedro', 'admin', 'vendedor', 'Pedro Pascal', 'activo', NULL);

INSERT INTO proveedores (id, nombre, contacto, telefono, rfc) VALUES (1, 'Proveedor General', 'Ventas', '555-0000', 'XAXX010101000');

INSERT INTO categorias_producto (id, nombre, slug) VALUES
  (1, 'Bebidas', 'bebidas'),
  (2, 'Snacks', 'snacks'),
  (3, 'Lacteos', 'lacteos'),
  (4, 'Panaderia', 'panaderia'),
  (5, 'Limpieza', 'limpieza'),
  (6, 'Abarrotes', 'abarrotes'),
  (7, 'Botanas', 'botanas');

INSERT INTO productos (id, nombre, categoria_id, codigo_barras, precio, stock, stock_minimo, unidad) VALUES
  (1, 'Coca-Cola 600ml', 1, '7501055310248', 3.50, 8, 10, 'pzas'),
  (2, 'Sabritas Clasicas 45g', 7, '7501030412001', 2.80, 36, 12, 'pzas'),
  (3, 'Arroz Costeno 1kg', 6, '7750123456789', 5.90, 18, 8, 'bolsas'),
  (4, 'Leche Gloria 400g', 3, '7750903001234', 4.20, 0, 6, 'latas'),
  (5, 'Aceite Primor 1L', 6, '7750676004321', 9.50, 5, 7, 'botellas'),
  (6, 'Galletas Oreo 108g', 2, '7501000108880', 3.20, 21, 9, 'pzas'),
  (7, 'Inca Kola 500ml', 1, '7501055300129', 3.50, 36, 8, 'pzas'),
  (8, 'Agua San Luis 625ml', 1, '7501055300136', 2.00, 60, 10, 'pzas'),
  (9, 'Detergente 500g', 5, '7501055900015', 8.00, 22, 6, 'pzas'),
  (10, 'Lejia 1L', 5, '7501055900022', 3.50, 30, 8, 'botellas'),
  (11, 'Pan dulce unidad', 4, NULL, 1.20, 80, 15, 'pzas'),
  (12, 'Bolsa plastica', 6, NULL, 0.20, 200, 50, 'pzas'),
  (13, 'Hielo bolsa', 1, NULL, 4.00, 20, 5, 'bolsas');

INSERT INTO ventas (id, ticket_id, fecha_hora, usuario_id, cliente_nombre, subtotal, iva, total, metodo_pago, estado, efectivo_recibido, cambio, motivo_cancelacion) VALUES
  (1, 'TK-2026-0001', '2026-04-04 09:12:00', 2, 'Maria Lopez', 106.36, 19.14, 125.50, 'Efectivo', 'Pagado', 130.00, 4.50, NULL),
  (2, 'TK-2026-0002', '2026-04-03 15:47:00', 3, 'Carlos Rios', 245.68, 44.22, 289.90, 'Tarjeta', 'Cancelado', NULL, NULL, 'Cobro duplicado'),
  (3, 'TK-2026-0003', '2026-04-01 11:05:00', 2, 'Publico general', 62.71, 11.29, 74.00, 'Transferencia', 'Devuelto', NULL, NULL, NULL);

INSERT INTO venta_detalles (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal) VALUES
  (1, NULL, 'Rosas', 3, 30.00, 90.00),
  (1, NULL, 'Fertilizante', 1, 16.36, 16.36),
  (2, NULL, 'Maceta', 2, 80.00, 160.00),
  (2, NULL, 'Sustrato', 1, 85.68, 85.68),
  (3, NULL, 'Tulipanes', 1, 40.00, 40.00),
  (3, NULL, 'Regadera', 1, 22.71, 22.71);

INSERT INTO auditoria_registros (fecha_hora, usuario_id, usuario_nombre, evento, detalle) VALUES
  ('2026-04-04 08:15:32', 2, 'Juan Perez', 'LOGIN', 'Inicio de sesion exitoso desde caja principal.'),
  ('2026-04-04 09:21:10', 3, 'Ana Diaz', 'CAMBIO_DE_PRECIO', 'Cambio de precio de Sabritas de S/ 22.00 a S/ 20.00.'),
  ('2026-04-04 10:03:47', 2, 'Juan Perez', 'EDICION', 'Edicion de datos del producto Arroz Costeno 1kg.'),
  ('2026-04-04 10:17:58', 3, 'Ana Diaz', 'CANCELACION', 'Cancelacion de ticket TK-2026-0018 por cobro duplicado.');

INSERT INTO caja_turnos (id, turno_codigo, usuario_id, hora_apertura, monto_inicial, estado) VALUES
  (1, 'turno-manana-juan', 2, '2026-04-06 08:00:00', 250.00, 'abierto'),
  (2, 'turno-tarde-ana', 3, '2026-04-06 14:00:00', 300.00, 'abierto');

INSERT INTO caja_movimientos (turno_id, fecha_hora, tipo, categoria, concepto, proveedor_nombre, monto) VALUES
  (1, '2026-04-06 08:45:00', 'entrada', 'operativo', 'Cambio para caja', NULL, 80.00),
  (1, '2026-04-06 10:20:00', 'retiro', 'operativo', 'Pago de limpieza', NULL, 35.00),
  (1, '2026-04-06 11:10:00', 'retiro', 'proveedor', 'Reposicion de pan', 'Panaderia San Pedro', 120.00);

INSERT INTO caja_cortes (turno_id, fecha_hora, esperado, contado, diferencia) VALUES
  (1, '2026-04-06 20:15:00', 2185.00, 2180.00, -5.00);

INSERT INTO reportes (modulo, nombre, desde, hasta, generado_por, generado_por_nombre, generado_en) VALUES
  ('ventas', 'Ventas por dia', '2026-04-01', '2026-04-08', 2, 'Juan Perez', '2026-04-08 09:10:00'),
  ('ventas', 'Ventas por metodo de pago', '2026-04-01', '2026-04-08', 3, 'Ana Diaz', '2026-04-08 09:25:00'),
  ('ventas', 'Top productos vendidos', '2026-03-01', '2026-03-31', 1, 'Mert Made It', '2026-04-01 08:05:00'),
  ('tesoreria', 'Cortes y movimientos', '2026-04-01', '2026-04-08', 1, 'Mert Made It', '2026-04-08 10:00:00');

CREATE OR REPLACE VIEW vw_dashboard_resumen AS
SELECT
  (SELECT COUNT(*) FROM usuarios) AS total_usuarios,
  (SELECT COUNT(*) FROM usuarios) AS usuarios_activos,
  (SELECT COUNT(*) FROM productos WHERE stock <= stock_minimo) AS productos_faltantes,
  (SELECT COALESCE(SUM(total), 0) FROM ventas WHERE estado = 'Pagado') AS ventas_pagadas_total,
  (SELECT COALESCE(SUM(total), 0) FROM ventas WHERE estado = 'Cancelado') AS ventas_canceladas_total;

-- Datos recientes para pruebas de dashboard (mayo 2026)
INSERT INTO ventas (ticket_id, fecha_hora, usuario_id, cliente_nombre, subtotal, iva, total, metodo_pago, estado, efectivo_recibido, cambio, motivo_cancelacion) VALUES
  ('TK-2026-0101', '2026-05-15 09:18:00', 2, 'Cliente mostrador', 45.76, 8.24, 54.00, 'Efectivo', 'Pagado', 60.00, 6.00, NULL),
  ('TK-2026-0102', '2026-05-15 10:42:00', 3, 'Publico general', 84.75, 15.25, 100.00, 'Tarjeta', 'Pagado', NULL, NULL, NULL),
  ('TK-2026-0103', '2026-05-15 12:05:00', 2, 'Mariana Quispe', 63.56, 11.44, 75.00, 'Transferencia', 'Pagado', NULL, NULL, NULL),
  ('TK-2026-0104', '2026-05-14 08:33:00', 2, 'Cliente A', 38.14, 6.86, 45.00, 'Efectivo', 'Pagado', 50.00, 5.00, NULL),
  ('TK-2026-0105', '2026-05-14 11:20:00', 3, 'Cliente B', 67.80, 12.20, 80.00, 'Tarjeta', 'Pagado', NULL, NULL, NULL),
  ('TK-2026-0106', '2026-05-13 09:55:00', 2, 'Cliente C', 50.85, 9.15, 60.00, 'Efectivo', 'Pagado', 70.00, 10.00, NULL),
  ('TK-2026-0107', '2026-05-12 17:40:00', 3, 'Cliente D', 93.22, 16.78, 110.00, 'Transferencia', 'Pagado', NULL, NULL, NULL),
  ('TK-2026-0108', '2026-05-10 13:05:00', 2, 'Cliente E', 42.37, 7.63, 50.00, 'Efectivo', 'Pagado', 60.00, 10.00, NULL),
  ('TK-2026-0109', '2026-05-09 15:18:00', 3, 'Cliente F', 76.27, 13.73, 90.00, 'Tarjeta', 'Pagado', NULL, NULL, NULL),
  ('TK-2026-0110', '2026-05-08 19:02:00', 2, 'Cliente G', 59.32, 10.68, 70.00, 'Efectivo', 'Pagado', 100.00, 30.00, NULL);

INSERT INTO venta_detalles (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
SELECT v.id, p.id, p.nombre, 3, p.precio, ROUND(p.precio * 3, 2)
FROM ventas v
JOIN productos p ON p.id = 1
WHERE v.ticket_id = 'TK-2026-0101';

INSERT INTO venta_detalles (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
SELECT v.id, p.id, p.nombre, 5, p.precio, ROUND(p.precio * 5, 2)
FROM ventas v
JOIN productos p ON p.id = 2
WHERE v.ticket_id = 'TK-2026-0102';

INSERT INTO venta_detalles (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
SELECT v.id, p.id, p.nombre, 6, p.precio, ROUND(p.precio * 6, 2)
FROM ventas v
JOIN productos p ON p.id = 8
WHERE v.ticket_id = 'TK-2026-0103';

INSERT INTO venta_detalles (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
SELECT v.id, p.id, p.nombre, 2, p.precio, ROUND(p.precio * 2, 2)
FROM ventas v
JOIN productos p ON p.id = 1
WHERE v.ticket_id = 'TK-2026-0104';

INSERT INTO venta_detalles (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
SELECT v.id, p.id, p.nombre, 4, p.precio, ROUND(p.precio * 4, 2)
FROM ventas v
JOIN productos p ON p.id = 2
WHERE v.ticket_id = 'TK-2026-0105';

INSERT INTO auditoria_registros (fecha_hora, usuario_id, usuario_nombre, evento, detalle) VALUES
  ('2026-05-15 08:58:21', 2, 'Juan Perez', 'LOGIN', 'Inicio de sesion exitoso en caja principal.'),
  ('2026-05-15 10:45:09', 3, 'Ana Diaz', 'EDICION', 'Ajuste de stock en Agua San Luis 625ml.');


-- -----------------------------------------------------------------------------
-- RUTINAS, FUNCIONES Y DISPARADORES (TRIGGERS)
-- -----------------------------------------------------------------------------
DELIMITER $$

-- 1. Función: Calcular Cambio
CREATE FUNCTION FN_CalcularCambio(p_efectivo DECIMAL(10,2), p_total DECIMAL(10,2))
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE v_cambio DECIMAL(10,2);
    IF p_efectivo < p_total THEN
        RETURN 0.00;
    ELSE
        SET v_cambio = p_efectivo - p_total;
        RETURN v_cambio;
    END IF;
END$$

-- 2. Disparador: Descuento de Stock al vender
CREATE TRIGGER TRG_VentaDetalle_AfterInsert
AFTER INSERT ON venta_detalles
FOR EACH ROW
BEGIN
    IF NEW.producto_id IS NOT NULL THEN
        UPDATE productos 
        SET stock = stock - NEW.cantidad
        WHERE id = NEW.producto_id;
    END IF;
END$$

-- 3. Disparador: Devolución de Stock al cancelar/devolver venta

-- Disparador: Suma de Stock al comprar
CREATE TRIGGER TRG_CompraDetalle_AfterInsert
AFTER INSERT ON compra_detalles
FOR EACH ROW
BEGIN
    IF NEW.producto_id IS NOT NULL THEN
        UPDATE productos 
        SET stock = stock + NEW.cantidad
        WHERE id = NEW.producto_id;
    END IF;
END$$

CREATE TRIGGER TRG_Ventas_AfterUpdate
AFTER UPDATE ON ventas
FOR EACH ROW
BEGIN
    IF (OLD.estado = 'Pagado' AND (NEW.estado = 'Cancelado' OR NEW.estado = 'Devuelto')) THEN
        -- Retornar stock de los detalles
        UPDATE productos p
        INNER JOIN venta_detalles vd ON p.id = vd.producto_id
        SET p.stock = p.stock + vd.cantidad
        WHERE vd.venta_id = NEW.id AND vd.producto_id IS NOT NULL;
    END IF;
END$$

-- 4. Disparador: Auditoría de cambio de precio en productos
CREATE TRIGGER TRG_Productos_BeforeUpdate
BEFORE UPDATE ON productos
FOR EACH ROW
BEGIN
    IF OLD.precio <> NEW.precio THEN
        INSERT INTO auditoria_registros (fecha_hora, usuario_nombre, evento, detalle)
        VALUES (
            NOW(), 
            'Sistema (Trigger)', 
            'CAMBIO_DE_PRECIO', 
            CONCAT('El producto ', OLD.nombre, ' cambio su precio de $', OLD.precio, ' a $', NEW.precio)
        );
    END IF;
END$$

-- 5. Procedimiento: Corte de Caja (esperado)
CREATE PROCEDURE SP_CorteCaja(IN p_turno_id BIGINT)
BEGIN
    DECLARE v_monto_inicial DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_total_ventas DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_total_entradas DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_total_retiros DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_esperado DECIMAL(10,2) DEFAULT 0.00;

    -- Obtener monto inicial
    SELECT monto_inicial INTO v_monto_inicial 
    FROM caja_turnos 
    WHERE id = p_turno_id;

    -- Obtener total de ventas en efectivo en el rango de este turno
    SELECT COALESCE(SUM(total), 0) INTO v_total_ventas
    FROM ventas v
    JOIN caja_turnos t ON t.id = p_turno_id
    WHERE v.usuario_id = t.usuario_id 
      AND v.estado = 'Pagado'
      AND v.metodo_pago = 'Efectivo'
      AND v.fecha_hora >= t.hora_apertura
      AND (t.hora_cierre IS NULL OR v.fecha_hora <= t.hora_cierre);

    -- Obtener total de movimientos (entradas y retiros)
    SELECT 
        COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN monto ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN tipo = 'retiro' THEN monto ELSE 0 END), 0)
    INTO v_total_entradas, v_total_retiros
    FROM caja_movimientos
    WHERE turno_id = p_turno_id;

    -- Calculo esperado
    SET v_esperado = v_monto_inicial + v_total_ventas + v_total_entradas - v_total_retiros;

    -- Retornar resumen
    SELECT 
        v_monto_inicial AS monto_inicial,
        v_total_ventas AS ventas_efectivo,
        v_total_entradas AS total_entradas,
        v_total_retiros AS total_retiros,
        v_esperado AS total_esperado_caja;
END$$

-- 6. Procedimiento: Top Productos Vendidos
CREATE PROCEDURE SP_TopProductosVendidos(IN p_desde DATE, IN p_hasta DATE, IN p_limite INT)
BEGIN
    SELECT 
        p.id, 
        p.nombre, 
        p.codigo_barras, 
        SUM(vd.cantidad) as cantidad_vendida,
        SUM(vd.subtotal) as recaudacion
    FROM venta_detalles vd
    JOIN ventas v ON vd.venta_id = v.id
    JOIN productos p ON vd.producto_id = p.id
    WHERE v.estado = 'Pagado'
      AND DATE(v.fecha_hora) >= p_desde 
      AND DATE(v.fecha_hora) <= p_hasta
    GROUP BY p.id
    ORDER BY cantidad_vendida DESC
    LIMIT p_limite;
END$$

-- 7. Procedimiento: Reporte de Ventas Diarias
CREATE PROCEDURE SP_ReporteVentasDiarias(IN p_desde DATE, IN p_hasta DATE)
BEGIN
    SELECT 
        DATE(fecha_hora) AS fecha,
        COUNT(id) AS cantidad_tickets,
        COALESCE(SUM(CASE WHEN metodo_pago = 'Efectivo' THEN total ELSE 0 END), 0) AS total_efectivo,
        COALESCE(SUM(CASE WHEN metodo_pago = 'Tarjeta' THEN total ELSE 0 END), 0) AS total_tarjeta,
        COALESCE(SUM(CASE WHEN metodo_pago = 'Transferencia' THEN total ELSE 0 END), 0) AS total_transferencia,
        COALESCE(SUM(total), 0) AS gran_total
    FROM ventas
    WHERE estado = 'Pagado'
      AND DATE(fecha_hora) >= p_desde
      AND DATE(fecha_hora) <= p_hasta
    GROUP BY DATE(fecha_hora)
    ORDER BY fecha DESC;
END$$

-- 8. Procedimiento: Crear Venta Completa desde JSON
CREATE PROCEDURE SP_CrearVentaJSON(
    IN p_ticket_id VARCHAR(40),
    IN p_usuario_id BIGINT,
    IN p_cliente_nombre VARCHAR(120),
    IN p_metodo_pago VARCHAR(20),
    IN p_efectivo_recibido DECIMAL(10,2),
    IN p_detalles_json JSON
)
BEGIN
    DECLARE v_venta_id BIGINT;
    DECLARE v_subtotal DECIMAL(10,2) DEFAULT 0;
    DECLARE v_iva DECIMAL(10,2) DEFAULT 0;
    DECLARE v_total DECIMAL(10,2) DEFAULT 0;
    DECLARE v_cambio DECIMAL(10,2) DEFAULT 0;
    
    DECLARE i INT DEFAULT 0;
    DECLARE v_count INT;
    
    DECLARE v_prod_id BIGINT;
    DECLARE v_prod_nombre VARCHAR(160);
    DECLARE v_cantidad INT;
    DECLARE v_precio DECIMAL(10,2);
    DECLARE v_det_subtotal DECIMAL(10,2);

    -- Iniciar Transaccion Segura
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Calcular totales desde el JSON
    SET v_count = JSON_LENGTH(p_detalles_json);
    
    WHILE i < v_count DO
        SET v_cantidad = JSON_UNQUOTE(JSON_EXTRACT(p_detalles_json, CONCAT('$[', i, '].cantidad')));
        SET v_precio = JSON_UNQUOTE(JSON_EXTRACT(p_detalles_json, CONCAT('$[', i, '].precio')));
        SET v_total = v_total + (v_cantidad * v_precio);
        SET i = i + 1;
    END WHILE;
    
    SET v_subtotal = ROUND(v_total / 1.16, 2);
    SET v_iva = v_total - v_subtotal;
    
    IF p_metodo_pago = 'Efectivo' THEN
        SET v_cambio = FN_CalcularCambio(p_efectivo_recibido, v_total);
    END IF;

    -- Insertar Cabecera
    INSERT INTO ventas (
        ticket_id, fecha_hora, usuario_id, cliente_nombre, 
        subtotal, iva, total, metodo_pago, estado, 
        efectivo_recibido, cambio
    ) VALUES (
        p_ticket_id, NOW(), p_usuario_id, p_cliente_nombre,
        v_subtotal, v_iva, v_total, p_metodo_pago, 'Pagado',
        p_efectivo_recibido, v_cambio
    );

    SET v_venta_id = LAST_INSERT_ID();

    -- Insertar Detalles (El Trigger de detalle descontara stock automaticamente)
    SET i = 0;
    WHILE i < v_count DO
        SET v_prod_id = JSON_UNQUOTE(JSON_EXTRACT(p_detalles_json, CONCAT('$[', i, '].producto_id')));
        SET v_prod_nombre = JSON_UNQUOTE(JSON_EXTRACT(p_detalles_json, CONCAT('$[', i, '].nombre')));
        SET v_cantidad = JSON_UNQUOTE(JSON_EXTRACT(p_detalles_json, CONCAT('$[', i, '].cantidad')));
        SET v_precio = JSON_UNQUOTE(JSON_EXTRACT(p_detalles_json, CONCAT('$[', i, '].precio')));
        SET v_det_subtotal = v_cantidad * v_precio;

        INSERT INTO venta_detalles (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
        VALUES (v_venta_id, v_prod_id, v_prod_nombre, v_cantidad, v_precio, v_det_subtotal);

        SET i = i + 1;
    END WHILE;

    COMMIT;
    
    -- Retornar la venta creada
    SELECT * FROM ventas WHERE id = v_venta_id;
END$$

DELIMITER ;

-- --------------------------------------------------------
-- 15. Estructura de la tabla mermas (Shrinkage / Spoilage)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS mermas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  producto_id BIGINT UNSIGNED NOT NULL,
  cantidad INT NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_id BIGINT NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (producto_id) REFERENCES productos(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$

-- Disparador: Resta de Stock al registrar merma
CREATE TRIGGER TRG_Mermas_AfterInsert
AFTER INSERT ON mermas
FOR EACH ROW
BEGIN
    UPDATE productos 
    SET stock = stock - NEW.cantidad
    WHERE id = NEW.producto_id;
END$$

DELIMITER ;
-- Extra Datos solicitados: mas productos, ventas, mermas, compras, reporte y usuario.

INSERT INTO productos (id, nombre, categoria_id, codigo_barras, precio, stock, stock_minimo, unidad) VALUES
  (14, 'Doritos Nacho 58g', 7, '7501030412002', 3.00, 25, 10, 'pzas'),
  (15, 'Sprite 600ml', 1, '7501055310249', 3.50, 15, 10, 'pzas'),
  (16, 'Yogurt Fresa 250ml', 3, '7501055310250', 4.00, 12, 5, 'pzas'),
  (17, 'Pan Bimbo Blanco', 4, '7501055310251', 15.00, 8, 4, 'pzas'),
  (18, 'Jabon Zote 400g', 5, '7501055310252', 12.00, 20, 5, 'pzas'),
  (19, 'Frijoles Isadora', 6, '7501055310253', 18.00, 10, 5, 'pzas'),
  (20, 'Cheetos Torciditos 50g', 7, '7501030412003', 2.80, 30, 12, 'pzas');

INSERT INTO ventas (ticket_id, fecha_hora, usuario_id, cliente_nombre, subtotal, iva, total, metodo_pago, estado, efectivo_recibido, cambio, motivo_cancelacion) VALUES
  ('TK-2026-0111', '2026-05-16 09:18:00', 2, 'Cliente H', 45.76, 8.24, 54.00, 'Efectivo', 'Pagado', 60.00, 6.00, NULL),
  ('TK-2026-0112', '2026-05-16 10:42:00', 3, 'Publico general', 84.75, 15.25, 100.00, 'Tarjeta', 'Pagado', NULL, NULL, NULL),
  ('TK-2026-0113', '2026-05-16 12:05:00', 2, 'Mariana Quispe', 63.56, 11.44, 75.00, 'Transferencia', 'Pagado', NULL, NULL, NULL),
  ('TK-2026-0114', '2026-05-17 08:33:00', 2, 'Cliente I', 38.14, 6.86, 45.00, 'Efectivo', 'Pagado', 50.00, 5.00, NULL),
  ('TK-2026-0115', '2026-05-17 11:20:00', 3, 'Cliente J', 67.80, 12.20, 80.00, 'Tarjeta', 'Pagado', NULL, NULL, NULL),
  ('TK-2026-0116', '2026-05-18 09:55:00', 2, 'Cliente K', 50.85, 9.15, 60.00, 'Efectivo', 'Pagado', 70.00, 10.00, NULL),
  ('TK-2026-0117', '2026-05-18 17:40:00', 3, 'Cliente L', 93.22, 16.78, 110.00, 'Transferencia', 'Pagado', NULL, NULL, NULL);

INSERT INTO venta_detalles (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
VALUES ((SELECT id FROM ventas WHERE ticket_id = 'TK-2026-0111'), 14, 'Doritos Nacho 58g', 3, 3.00, 9.00);

INSERT INTO venta_detalles (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
VALUES ((SELECT id FROM ventas WHERE ticket_id = 'TK-2026-0112'), 15, 'Sprite 600ml', 1, 3.50, 3.50);

INSERT INTO venta_detalles (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
VALUES ((SELECT id FROM ventas WHERE ticket_id = 'TK-2026-0113'), 16, 'Yogurt Fresa 250ml', 2, 4.00, 8.00);

INSERT INTO venta_detalles (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
VALUES ((SELECT id FROM ventas WHERE ticket_id = 'TK-2026-0114'), 17, 'Pan Bimbo Blanco', 5, 15.00, 75.00);

INSERT INTO venta_detalles (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
VALUES ((SELECT id FROM ventas WHERE ticket_id = 'TK-2026-0115'), 18, 'Jabon Zote 400g', 1, 12.00, 12.00);

INSERT INTO venta_detalles (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
VALUES ((SELECT id FROM ventas WHERE ticket_id = 'TK-2026-0116'), 19, 'Frijoles Isadora', 4, 18.00, 72.00);

INSERT INTO venta_detalles (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
VALUES ((SELECT id FROM ventas WHERE ticket_id = 'TK-2026-0117'), 20, 'Cheetos Torciditos 50g', 2, 2.80, 5.60);

INSERT INTO compras (id, proveedor_id, usuario_id, fecha_hora, total, estado) VALUES
  (1, 1, 1, '2026-05-10 08:00:00', 100.00, 'Completado'),
  (2, 1, 1, '2026-05-11 08:00:00', 150.00, 'Completado'),
  (3, 1, 1, '2026-05-12 08:00:00', 200.00, 'Completado'),
  (4, 1, 1, '2026-05-13 08:00:00', 250.00, 'Completado'),
  (5, 1, 1, '2026-05-14 08:00:00', 300.00, 'Completado'),
  (6, 1, 1, '2026-05-15 08:00:00', 350.00, 'Completado'),
  (7, 1, 1, '2026-05-16 08:00:00', 400.00, 'Completado'),
  (8, 1, 1, '2026-05-17 08:00:00', 450.00, 'Completado'),
  (9, 1, 1, '2026-05-18 08:00:00', 500.00, 'Completado'),
  (10, 1, 1, '2026-05-19 08:00:00', 550.00, 'Completado');

INSERT INTO compra_detalles (compra_id, producto_id, producto_nombre, cantidad, costo_unitario, subtotal) VALUES
  (1, 1, 'Coca-Cola 600ml', 10, 2.50, 25.00),
  (2, 2, 'Sabritas Clasicas 45g', 20, 2.00, 40.00),
  (3, 3, 'Arroz Costeno 1kg', 30, 4.00, 120.00),
  (4, 4, 'Leche Gloria 400g', 40, 3.00, 120.00),
  (5, 5, 'Aceite Primor 1L', 50, 8.00, 400.00),
  (6, 6, 'Galletas Oreo 108g', 60, 2.00, 120.00),
  (7, 7, 'Inca Kola 500ml', 70, 2.50, 175.00),
  (8, 8, 'Agua San Luis 625ml', 80, 1.50, 120.00),
  (9, 9, 'Detergente 500g', 90, 6.00, 540.00),
  (10, 10, 'Lejia 1L', 100, 2.50, 250.00);

INSERT INTO mermas (producto_id, cantidad, motivo, fecha_hora, usuario_id) VALUES
  (1, 1, 'Caducado', '2026-05-12 10:00:00', 2),
  (2, 2, 'Roto', '2026-05-13 11:00:00', 3),
  (3, 1, 'Perdido', '2026-05-14 12:00:00', 2),
  (4, 3, 'Caducado', '2026-05-15 13:00:00', 3),
  (5, 1, 'Roto', '2026-05-16 14:00:00', 2),
  (6, 2, 'Perdido', '2026-05-17 15:00:00', 3),
  (7, 1, 'Caducado', '2026-05-18 16:00:00', 2),
  (8, 2, 'Roto', '2026-05-19 17:00:00', 3),
  (9, 1, 'Perdido', '2026-05-20 18:00:00', 2),
  (10, 3, 'Caducado', '2026-05-21 19:00:00', 3);

INSERT INTO reportes (modulo, nombre, desde, hasta, generado_por, generado_por_nombre, generado_en) VALUES
  ('tesoreria', 'Reporte de Mermas Mensual', '2026-05-01', '2026-05-31', 1, 'Mert Made It', '2026-06-01 10:00:00');


-- INSERT SCRIPT GENERATED
INSERT INTO usuarios (id, username, password, role, nombre_completo, estado) VALUES
(1001, 'user_bulk_1', 'hash123', 'admin', 'Usuario Generico 1', 'activo'),
(1002, 'user_bulk_2', 'hash123', 'supervisor', 'Usuario Generico 2', 'activo'),
(1003, 'user_bulk_3', 'hash123', 'admin', 'Usuario Generico 3', 'activo'),
(1004, 'user_bulk_4', 'hash123', 'admin', 'Usuario Generico 4', 'activo'),
(1005, 'user_bulk_5', 'hash123', 'admin', 'Usuario Generico 5', 'activo'),
(1006, 'user_bulk_6', 'hash123', 'vendedor', 'Usuario Generico 6', 'activo'),
(1007, 'user_bulk_7', 'hash123', 'supervisor', 'Usuario Generico 7', 'activo'),
(1008, 'user_bulk_8', 'hash123', 'supervisor', 'Usuario Generico 8', 'activo'),
(1009, 'user_bulk_9', 'hash123', 'supervisor', 'Usuario Generico 9', 'activo'),
(1010, 'user_bulk_10', 'hash123', 'admin', 'Usuario Generico 10', 'activo'),
(1011, 'user_bulk_11', 'hash123', 'vendedor', 'Usuario Generico 11', 'activo'),
(1012, 'user_bulk_12', 'hash123', 'admin', 'Usuario Generico 12', 'activo'),
(1013, 'user_bulk_13', 'hash123', 'vendedor', 'Usuario Generico 13', 'activo'),
(1014, 'user_bulk_14', 'hash123', 'supervisor', 'Usuario Generico 14', 'activo'),
(1015, 'user_bulk_15', 'hash123', 'vendedor', 'Usuario Generico 15', 'activo'),
(1016, 'user_bulk_16', 'hash123', 'supervisor', 'Usuario Generico 16', 'activo'),
(1017, 'user_bulk_17', 'hash123', 'vendedor', 'Usuario Generico 17', 'activo'),
(1018, 'user_bulk_18', 'hash123', 'vendedor', 'Usuario Generico 18', 'activo'),
(1019, 'user_bulk_19', 'hash123', 'admin', 'Usuario Generico 19', 'activo'),
(1020, 'user_bulk_20', 'hash123', 'vendedor', 'Usuario Generico 20', 'activo'),
(1021, 'user_bulk_21', 'hash123', 'admin', 'Usuario Generico 21', 'activo'),
(1022, 'user_bulk_22', 'hash123', 'vendedor', 'Usuario Generico 22', 'activo'),
(1023, 'user_bulk_23', 'hash123', 'vendedor', 'Usuario Generico 23', 'activo'),
(1024, 'user_bulk_24', 'hash123', 'supervisor', 'Usuario Generico 24', 'activo'),
(1025, 'user_bulk_25', 'hash123', 'admin', 'Usuario Generico 25', 'activo'),
(1026, 'user_bulk_26', 'hash123', 'vendedor', 'Usuario Generico 26', 'activo'),
(1027, 'user_bulk_27', 'hash123', 'admin', 'Usuario Generico 27', 'activo'),
(1028, 'user_bulk_28', 'hash123', 'admin', 'Usuario Generico 28', 'activo'),
(1029, 'user_bulk_29', 'hash123', 'vendedor', 'Usuario Generico 29', 'activo'),
(1030, 'user_bulk_30', 'hash123', 'vendedor', 'Usuario Generico 30', 'activo'),
(1031, 'user_bulk_31', 'hash123', 'admin', 'Usuario Generico 31', 'activo'),
(1032, 'user_bulk_32', 'hash123', 'supervisor', 'Usuario Generico 32', 'activo'),
(1033, 'user_bulk_33', 'hash123', 'vendedor', 'Usuario Generico 33', 'activo'),
(1034, 'user_bulk_34', 'hash123', 'vendedor', 'Usuario Generico 34', 'activo'),
(1035, 'user_bulk_35', 'hash123', 'supervisor', 'Usuario Generico 35', 'activo'),
(1036, 'user_bulk_36', 'hash123', 'supervisor', 'Usuario Generico 36', 'activo'),
(1037, 'user_bulk_37', 'hash123', 'vendedor', 'Usuario Generico 37', 'activo'),
(1038, 'user_bulk_38', 'hash123', 'admin', 'Usuario Generico 38', 'activo'),
(1039, 'user_bulk_39', 'hash123', 'admin', 'Usuario Generico 39', 'activo'),
(1040, 'user_bulk_40', 'hash123', 'vendedor', 'Usuario Generico 40', 'activo'),
(1041, 'user_bulk_41', 'hash123', 'vendedor', 'Usuario Generico 41', 'activo'),
(1042, 'user_bulk_42', 'hash123', 'vendedor', 'Usuario Generico 42', 'activo'),
(1043, 'user_bulk_43', 'hash123', 'supervisor', 'Usuario Generico 43', 'activo'),
(1044, 'user_bulk_44', 'hash123', 'supervisor', 'Usuario Generico 44', 'activo'),
(1045, 'user_bulk_45', 'hash123', 'supervisor', 'Usuario Generico 45', 'activo'),
(1046, 'user_bulk_46', 'hash123', 'supervisor', 'Usuario Generico 46', 'activo'),
(1047, 'user_bulk_47', 'hash123', 'vendedor', 'Usuario Generico 47', 'activo'),
(1048, 'user_bulk_48', 'hash123', 'admin', 'Usuario Generico 48', 'activo'),
(1049, 'user_bulk_49', 'hash123', 'supervisor', 'Usuario Generico 49', 'activo'),
(1050, 'user_bulk_50', 'hash123', 'vendedor', 'Usuario Generico 50', 'activo');

INSERT INTO proveedores (id, nombre, contacto, telefono, rfc, activo) VALUES
(1001, 'Proveedor Masivo 1 S.A.', 'Contacto 1', '555-000-0001', 'PROV000001XYZ', 1),
(1002, 'Proveedor Masivo 2 S.A.', 'Contacto 2', '555-000-0002', 'PROV000002XYZ', 1),
(1003, 'Proveedor Masivo 3 S.A.', 'Contacto 3', '555-000-0003', 'PROV000003XYZ', 1),
(1004, 'Proveedor Masivo 4 S.A.', 'Contacto 4', '555-000-0004', 'PROV000004XYZ', 1),
(1005, 'Proveedor Masivo 5 S.A.', 'Contacto 5', '555-000-0005', 'PROV000005XYZ', 1),
(1006, 'Proveedor Masivo 6 S.A.', 'Contacto 6', '555-000-0006', 'PROV000006XYZ', 1),
(1007, 'Proveedor Masivo 7 S.A.', 'Contacto 7', '555-000-0007', 'PROV000007XYZ', 1),
(1008, 'Proveedor Masivo 8 S.A.', 'Contacto 8', '555-000-0008', 'PROV000008XYZ', 1),
(1009, 'Proveedor Masivo 9 S.A.', 'Contacto 9', '555-000-0009', 'PROV000009XYZ', 1),
(1010, 'Proveedor Masivo 10 S.A.', 'Contacto 10', '555-000-0010', 'PROV000010XYZ', 1),
(1011, 'Proveedor Masivo 11 S.A.', 'Contacto 11', '555-000-0011', 'PROV000011XYZ', 1),
(1012, 'Proveedor Masivo 12 S.A.', 'Contacto 12', '555-000-0012', 'PROV000012XYZ', 1),
(1013, 'Proveedor Masivo 13 S.A.', 'Contacto 13', '555-000-0013', 'PROV000013XYZ', 1),
(1014, 'Proveedor Masivo 14 S.A.', 'Contacto 14', '555-000-0014', 'PROV000014XYZ', 1),
(1015, 'Proveedor Masivo 15 S.A.', 'Contacto 15', '555-000-0015', 'PROV000015XYZ', 1),
(1016, 'Proveedor Masivo 16 S.A.', 'Contacto 16', '555-000-0016', 'PROV000016XYZ', 1),
(1017, 'Proveedor Masivo 17 S.A.', 'Contacto 17', '555-000-0017', 'PROV000017XYZ', 1),
(1018, 'Proveedor Masivo 18 S.A.', 'Contacto 18', '555-000-0018', 'PROV000018XYZ', 1),
(1019, 'Proveedor Masivo 19 S.A.', 'Contacto 19', '555-000-0019', 'PROV000019XYZ', 1),
(1020, 'Proveedor Masivo 20 S.A.', 'Contacto 20', '555-000-0020', 'PROV000020XYZ', 1),
(1021, 'Proveedor Masivo 21 S.A.', 'Contacto 21', '555-000-0021', 'PROV000021XYZ', 1),
(1022, 'Proveedor Masivo 22 S.A.', 'Contacto 22', '555-000-0022', 'PROV000022XYZ', 1),
(1023, 'Proveedor Masivo 23 S.A.', 'Contacto 23', '555-000-0023', 'PROV000023XYZ', 1),
(1024, 'Proveedor Masivo 24 S.A.', 'Contacto 24', '555-000-0024', 'PROV000024XYZ', 1),
(1025, 'Proveedor Masivo 25 S.A.', 'Contacto 25', '555-000-0025', 'PROV000025XYZ', 1),
(1026, 'Proveedor Masivo 26 S.A.', 'Contacto 26', '555-000-0026', 'PROV000026XYZ', 1),
(1027, 'Proveedor Masivo 27 S.A.', 'Contacto 27', '555-000-0027', 'PROV000027XYZ', 1),
(1028, 'Proveedor Masivo 28 S.A.', 'Contacto 28', '555-000-0028', 'PROV000028XYZ', 1),
(1029, 'Proveedor Masivo 29 S.A.', 'Contacto 29', '555-000-0029', 'PROV000029XYZ', 1),
(1030, 'Proveedor Masivo 30 S.A.', 'Contacto 30', '555-000-0030', 'PROV000030XYZ', 1),
(1031, 'Proveedor Masivo 31 S.A.', 'Contacto 31', '555-000-0031', 'PROV000031XYZ', 1),
(1032, 'Proveedor Masivo 32 S.A.', 'Contacto 32', '555-000-0032', 'PROV000032XYZ', 1),
(1033, 'Proveedor Masivo 33 S.A.', 'Contacto 33', '555-000-0033', 'PROV000033XYZ', 1),
(1034, 'Proveedor Masivo 34 S.A.', 'Contacto 34', '555-000-0034', 'PROV000034XYZ', 1),
(1035, 'Proveedor Masivo 35 S.A.', 'Contacto 35', '555-000-0035', 'PROV000035XYZ', 1),
(1036, 'Proveedor Masivo 36 S.A.', 'Contacto 36', '555-000-0036', 'PROV000036XYZ', 1),
(1037, 'Proveedor Masivo 37 S.A.', 'Contacto 37', '555-000-0037', 'PROV000037XYZ', 1),
(1038, 'Proveedor Masivo 38 S.A.', 'Contacto 38', '555-000-0038', 'PROV000038XYZ', 1),
(1039, 'Proveedor Masivo 39 S.A.', 'Contacto 39', '555-000-0039', 'PROV000039XYZ', 1),
(1040, 'Proveedor Masivo 40 S.A.', 'Contacto 40', '555-000-0040', 'PROV000040XYZ', 1),
(1041, 'Proveedor Masivo 41 S.A.', 'Contacto 41', '555-000-0041', 'PROV000041XYZ', 1),
(1042, 'Proveedor Masivo 42 S.A.', 'Contacto 42', '555-000-0042', 'PROV000042XYZ', 1),
(1043, 'Proveedor Masivo 43 S.A.', 'Contacto 43', '555-000-0043', 'PROV000043XYZ', 1),
(1044, 'Proveedor Masivo 44 S.A.', 'Contacto 44', '555-000-0044', 'PROV000044XYZ', 1),
(1045, 'Proveedor Masivo 45 S.A.', 'Contacto 45', '555-000-0045', 'PROV000045XYZ', 1),
(1046, 'Proveedor Masivo 46 S.A.', 'Contacto 46', '555-000-0046', 'PROV000046XYZ', 1),
(1047, 'Proveedor Masivo 47 S.A.', 'Contacto 47', '555-000-0047', 'PROV000047XYZ', 1),
(1048, 'Proveedor Masivo 48 S.A.', 'Contacto 48', '555-000-0048', 'PROV000048XYZ', 1),
(1049, 'Proveedor Masivo 49 S.A.', 'Contacto 49', '555-000-0049', 'PROV000049XYZ', 1),
(1050, 'Proveedor Masivo 50 S.A.', 'Contacto 50', '555-000-0050', 'PROV000050XYZ', 1);

INSERT INTO categorias_producto (id, nombre, slug) VALUES
(1001, 'Categoria Extra 1', 'cat-extra-1'),
(1002, 'Categoria Extra 2', 'cat-extra-2'),
(1003, 'Categoria Extra 3', 'cat-extra-3'),
(1004, 'Categoria Extra 4', 'cat-extra-4'),
(1005, 'Categoria Extra 5', 'cat-extra-5'),
(1006, 'Categoria Extra 6', 'cat-extra-6'),
(1007, 'Categoria Extra 7', 'cat-extra-7'),
(1008, 'Categoria Extra 8', 'cat-extra-8'),
(1009, 'Categoria Extra 9', 'cat-extra-9'),
(1010, 'Categoria Extra 10', 'cat-extra-10'),
(1011, 'Categoria Extra 11', 'cat-extra-11'),
(1012, 'Categoria Extra 12', 'cat-extra-12'),
(1013, 'Categoria Extra 13', 'cat-extra-13'),
(1014, 'Categoria Extra 14', 'cat-extra-14'),
(1015, 'Categoria Extra 15', 'cat-extra-15'),
(1016, 'Categoria Extra 16', 'cat-extra-16'),
(1017, 'Categoria Extra 17', 'cat-extra-17'),
(1018, 'Categoria Extra 18', 'cat-extra-18'),
(1019, 'Categoria Extra 19', 'cat-extra-19'),
(1020, 'Categoria Extra 20', 'cat-extra-20'),
(1021, 'Categoria Extra 21', 'cat-extra-21'),
(1022, 'Categoria Extra 22', 'cat-extra-22'),
(1023, 'Categoria Extra 23', 'cat-extra-23'),
(1024, 'Categoria Extra 24', 'cat-extra-24'),
(1025, 'Categoria Extra 25', 'cat-extra-25'),
(1026, 'Categoria Extra 26', 'cat-extra-26'),
(1027, 'Categoria Extra 27', 'cat-extra-27'),
(1028, 'Categoria Extra 28', 'cat-extra-28'),
(1029, 'Categoria Extra 29', 'cat-extra-29'),
(1030, 'Categoria Extra 30', 'cat-extra-30'),
(1031, 'Categoria Extra 31', 'cat-extra-31'),
(1032, 'Categoria Extra 32', 'cat-extra-32'),
(1033, 'Categoria Extra 33', 'cat-extra-33'),
(1034, 'Categoria Extra 34', 'cat-extra-34'),
(1035, 'Categoria Extra 35', 'cat-extra-35'),
(1036, 'Categoria Extra 36', 'cat-extra-36'),
(1037, 'Categoria Extra 37', 'cat-extra-37'),
(1038, 'Categoria Extra 38', 'cat-extra-38'),
(1039, 'Categoria Extra 39', 'cat-extra-39'),
(1040, 'Categoria Extra 40', 'cat-extra-40'),
(1041, 'Categoria Extra 41', 'cat-extra-41'),
(1042, 'Categoria Extra 42', 'cat-extra-42'),
(1043, 'Categoria Extra 43', 'cat-extra-43'),
(1044, 'Categoria Extra 44', 'cat-extra-44'),
(1045, 'Categoria Extra 45', 'cat-extra-45'),
(1046, 'Categoria Extra 46', 'cat-extra-46'),
(1047, 'Categoria Extra 47', 'cat-extra-47'),
(1048, 'Categoria Extra 48', 'cat-extra-48'),
(1049, 'Categoria Extra 49', 'cat-extra-49'),
(1050, 'Categoria Extra 50', 'cat-extra-50');

INSERT INTO productos (id, nombre, categoria_id, codigo_barras, precio, stock, stock_minimo, unidad) VALUES
(1001, 'Producto Masivo 1', 1028, '750792876596', 73.76, 166, 16, 'pzas'),
(1002, 'Producto Masivo 2', 1045, '750977082574', 2.91, 149, 18, 'pzas'),
(1003, 'Producto Masivo 3', 1031, '750354309631', 25.02, 118, 10, 'pzas'),
(1004, 'Producto Masivo 4', 1024, '750211165099', 71.75, 171, 8, 'pzas'),
(1005, 'Producto Masivo 5', 1022, '750421850697', 84.78, 69, 15, 'pzas'),
(1006, 'Producto Masivo 6', 1040, '750931684331', 96.72, 147, 13, 'pzas'),
(1007, 'Producto Masivo 7', 1027, '750647804939', 1.16, 97, 11, 'pzas'),
(1008, 'Producto Masivo 8', 1035, '750291444628', 87.19, 178, 12, 'pzas'),
(1009, 'Producto Masivo 9', 1033, '750644953758', 11.91, 192, 13, 'pzas'),
(1010, 'Producto Masivo 10', 1034, '750233516463', 16.76, 104, 7, 'pzas'),
(1011, 'Producto Masivo 11', 1027, '750589275940', 31.24, 146, 8, 'pzas'),
(1012, 'Producto Masivo 12', 1026, '750870666874', 74.04, 140, 11, 'pzas'),
(1013, 'Producto Masivo 13', 1039, '750547664758', 30.5, 87, 18, 'pzas'),
(1014, 'Producto Masivo 14', 1024, '750126573117', 10.44, 183, 6, 'pzas'),
(1015, 'Producto Masivo 15', 1011, '750663945749', 78.42, 177, 12, 'pzas'),
(1016, 'Producto Masivo 16', 1044, '750969329634', 31.97, 108, 17, 'pzas'),
(1017, 'Producto Masivo 17', 1006, '750848388502', 63, 140, 20, 'pzas'),
(1018, 'Producto Masivo 18', 1007, '750519357678', 55.46, 64, 6, 'pzas'),
(1019, 'Producto Masivo 19', 1012, '750444078556', 80.76, 93, 9, 'pzas'),
(1020, 'Producto Masivo 20', 1047, '750827638852', 58.05, 191, 19, 'pzas'),
(1021, 'Producto Masivo 21', 1044, '750743606271', 41.42, 133, 12, 'pzas'),
(1022, 'Producto Masivo 22', 1011, '750279215089', 71.18, 138, 11, 'pzas'),
(1023, 'Producto Masivo 23', 1011, '750223125782', 38.75, 74, 19, 'pzas'),
(1024, 'Producto Masivo 24', 1038, '750131697136', 44.12, 61, 10, 'pzas'),
(1025, 'Producto Masivo 25', 1003, '750176292560', 17.78, 172, 8, 'pzas'),
(1026, 'Producto Masivo 26', 1029, '750123057798', 83.76, 185, 20, 'pzas'),
(1027, 'Producto Masivo 27', 1013, '750156309624', 92.2, 105, 5, 'pzas'),
(1028, 'Producto Masivo 28', 1025, '750880548551', 43.13, 162, 12, 'pzas'),
(1029, 'Producto Masivo 29', 1022, '750967694252', 32.23, 139, 16, 'pzas'),
(1030, 'Producto Masivo 30', 1044, '750143605640', 92.05, 89, 6, 'pzas'),
(1031, 'Producto Masivo 31', 1048, '750673906643', 80.17, 123, 16, 'pzas'),
(1032, 'Producto Masivo 32', 1007, '750905267440', 28.63, 164, 5, 'pzas'),
(1033, 'Producto Masivo 33', 1020, '750323634506', 95.76, 119, 18, 'pzas'),
(1034, 'Producto Masivo 34', 1010, '750353685718', 24.68, 113, 14, 'pzas'),
(1035, 'Producto Masivo 35', 1046, '750274895079', 56.5, 80, 11, 'pzas'),
(1036, 'Producto Masivo 36', 1009, '750149870986', 42.81, 150, 19, 'pzas'),
(1037, 'Producto Masivo 37', 1005, '750925878086', 29.77, 199, 14, 'pzas'),
(1038, 'Producto Masivo 38', 1047, '750828719016', 65.36, 88, 6, 'pzas'),
(1039, 'Producto Masivo 39', 1035, '750515655291', 85.58, 188, 16, 'pzas'),
(1040, 'Producto Masivo 40', 1032, '750364874073', 64.97, 82, 10, 'pzas'),
(1041, 'Producto Masivo 41', 1041, '750945580904', 39.06, 127, 20, 'pzas'),
(1042, 'Producto Masivo 42', 1008, '750600582410', 4.94, 133, 5, 'pzas'),
(1043, 'Producto Masivo 43', 1001, '750879133062', 65.45, 200, 18, 'pzas'),
(1044, 'Producto Masivo 44', 1047, '750820391270', 42.94, 114, 5, 'pzas'),
(1045, 'Producto Masivo 45', 1039, '750800210166', 77.72, 51, 17, 'pzas'),
(1046, 'Producto Masivo 46', 1004, '750372835933', 47.83, 103, 16, 'pzas'),
(1047, 'Producto Masivo 47', 1021, '750938048520', 83.1, 146, 20, 'pzas'),
(1048, 'Producto Masivo 48', 1013, '750849227334', 44.13, 82, 15, 'pzas'),
(1049, 'Producto Masivo 49', 1047, '750132804687', 22.68, 161, 13, 'pzas'),
(1050, 'Producto Masivo 50', 1043, '750763445973', 81.23, 88, 19, 'pzas');

INSERT INTO caja_turnos (id, turno_codigo, usuario_id, hora_apertura, monto_inicial, hora_cierre, estado) VALUES
(1001, 'turno-1-1778249663611', 1050, '2026-05-08 14:14:23', 1957, '2026-05-09 02:14:23', 'cerrado'),
(1002, 'turno-2-1777823676143', 1042, '2026-05-03 15:54:36', 776, '2026-05-03 20:54:36', 'cerrado'),
(1003, 'turno-3-1775721002064', 1027, '2026-04-09 07:50:02', 799, '2026-04-09 14:50:02', 'cerrado'),
(1004, 'turno-4-1776106665012', 1040, '2026-04-13 18:57:45', 1534, '2026-04-14 00:57:45', 'cerrado'),
(1005, 'turno-5-1775126592581', 1028, '2026-04-02 10:43:12', 1852, '2026-04-02 15:43:12', 'cerrado'),
(1006, 'turno-6-1772784782964', 1016, '2026-03-06 08:13:02', 776, '2026-03-06 14:13:02', 'cerrado'),
(1007, 'turno-7-1774961822286', 1005, '2026-03-31 12:57:02', 1027, '2026-04-01 00:57:02', 'cerrado'),
(1008, 'turno-8-1773817888310', 1015, '2026-03-18 07:11:28', 589, '2026-03-18 17:11:28', 'cerrado'),
(1009, 'turno-9-1777783340079', 1037, '2026-05-03 04:42:20', 1361, '2026-05-03 09:42:20', 'cerrado'),
(1010, 'turno-10-1780066347505', 1023, '2026-05-29 14:52:27', 1353, '2026-05-30 01:52:27', 'cerrado'),
(1011, 'turno-11-1779757576902', 1039, '2026-05-26 01:06:16', 1726, '2026-05-26 05:06:16', 'cerrado'),
(1012, 'turno-12-1778927355867', 1022, '2026-05-16 10:29:15', 1679, '2026-05-16 15:29:15', 'cerrado'),
(1013, 'turno-13-1773733435083', 1011, '2026-03-17 07:43:55', 1806, '2026-03-17 19:43:55', 'cerrado'),
(1014, 'turno-14-1774912185833', 1039, '2026-03-30 23:09:45', 741, '2026-03-31 07:09:45', 'cerrado'),
(1015, 'turno-15-1777128561189', 1028, '2026-04-25 14:49:21', 1761, '2026-04-25 21:49:21', 'cerrado'),
(1016, 'turno-16-1774434305461', 1006, '2026-03-25 10:25:05', 1585, '2026-03-25 19:25:05', 'cerrado'),
(1017, 'turno-17-1774304830416', 1043, '2026-03-23 22:27:10', 1781, '2026-03-24 06:27:10', 'cerrado'),
(1018, 'turno-18-1773674646247', 1008, '2026-03-16 15:24:06', 1613, '2026-03-17 03:24:06', 'cerrado'),
(1019, 'turno-19-1776403374392', 1023, '2026-04-17 05:22:54', 2000, '2026-04-17 16:22:54', 'cerrado'),
(1020, 'turno-20-1773434527252', 1024, '2026-03-13 20:42:07', 1256, '2026-03-14 01:42:07', 'cerrado'),
(1021, 'turno-21-1775897113443', 1031, '2026-04-11 08:45:13', 1388, '2026-04-11 13:45:13', 'cerrado'),
(1022, 'turno-22-1774300404763', 1001, '2026-03-23 21:13:24', 786, '2026-03-24 01:13:24', 'cerrado'),
(1023, 'turno-23-1780684314502', 1001, '2026-06-05 18:31:54', 1085, '2026-06-06 05:31:54', 'cerrado'),
(1024, 'turno-24-1777265344408', 1047, '2026-04-27 04:49:04', 1852, '2026-04-27 14:49:04', 'cerrado'),
(1025, 'turno-25-1773671795559', 1022, '2026-03-16 14:36:35', 1100, '2026-03-17 02:36:35', 'cerrado'),
(1026, 'turno-26-1778913082457', 1002, '2026-05-16 06:31:22', 1676, '2026-05-16 14:31:22', 'cerrado'),
(1027, 'turno-27-1777835645821', 1014, '2026-05-03 19:14:05', 1949, '2026-05-04 04:14:05', 'cerrado'),
(1028, 'turno-28-1773732446625', 1044, '2026-03-17 07:27:26', 642, '2026-03-17 19:27:26', 'cerrado'),
(1029, 'turno-29-1775323215201', 1039, '2026-04-04 17:20:15', 1288, '2026-04-05 05:20:15', 'cerrado'),
(1030, 'turno-30-1776204551822', 1016, '2026-04-14 22:09:11', 979, '2026-04-15 05:09:11', 'cerrado'),
(1031, 'turno-31-1774238701756', 1050, '2026-03-23 04:05:01', 841, '2026-03-23 09:05:01', 'cerrado'),
(1032, 'turno-32-1776285030491', 1035, '2026-04-15 20:30:30', 1536, '2026-04-16 06:30:30', 'cerrado'),
(1033, 'turno-33-1779220455706', 1014, '2026-05-19 19:54:15', 1400, '2026-05-20 03:54:15', 'cerrado'),
(1034, 'turno-34-1775764326197', 1012, '2026-04-09 19:52:06', 1081, '2026-04-10 01:52:06', 'cerrado'),
(1035, 'turno-35-1775170778013', 1033, '2026-04-02 22:59:38', 1493, '2026-04-03 06:59:38', 'cerrado'),
(1036, 'turno-36-1776387967959', 1027, '2026-04-17 01:06:07', 1554, '2026-04-17 13:06:07', 'cerrado'),
(1037, 'turno-37-1775362873139', 1005, '2026-04-05 04:21:13', 1551, '2026-04-05 10:21:13', 'cerrado'),
(1038, 'turno-38-1779499172423', 1017, '2026-05-23 01:19:32', 1322, '2026-05-23 08:19:32', 'cerrado'),
(1039, 'turno-39-1778569885748', 1010, '2026-05-12 07:11:25', 1839, '2026-05-12 19:11:25', 'cerrado'),
(1040, 'turno-40-1780317362139', 1044, '2026-06-01 12:36:02', 1480, '2026-06-01 17:36:02', 'cerrado'),
(1041, 'turno-41-1774223462377', 1007, '2026-03-22 23:51:02', 1643, '2026-03-23 07:51:02', 'cerrado'),
(1042, 'turno-42-1775084233279', 1045, '2026-04-01 22:57:13', 1433, '2026-04-02 10:57:13', 'cerrado'),
(1043, 'turno-43-1780451413532', 1041, '2026-06-03 01:50:13', 956, '2026-06-03 10:50:13', 'cerrado'),
(1044, 'turno-44-1777710277594', 1023, '2026-05-02 08:24:37', 591, '2026-05-02 20:24:37', 'cerrado'),
(1045, 'turno-45-1780194281892', 1008, '2026-05-31 02:24:41', 666, '2026-05-31 07:24:41', 'cerrado'),
(1046, 'turno-46-1778297043909', 1020, '2026-05-09 03:24:03', 1988, '2026-05-09 14:24:03', 'cerrado'),
(1047, 'turno-47-1774679448566', 1026, '2026-03-28 06:30:48', 548, '2026-03-28 10:30:48', 'cerrado'),
(1048, 'turno-48-1779387881733', 1031, '2026-05-21 18:24:41', 1979, '2026-05-22 05:24:41', 'cerrado'),
(1049, 'turno-49-1775722897875', 1006, '2026-04-09 08:21:37', 1178, '2026-04-09 19:21:37', 'cerrado'),
(1050, 'turno-50-1775784390864', 1001, '2026-04-10 01:26:30', 638, '2026-04-10 09:26:30', 'cerrado');

INSERT INTO ventas (id, ticket_id, fecha_hora, usuario_id, cliente_nombre, subtotal, iva, total, metodo_pago, estado, efectivo_recibido, cambio) VALUES
(1001, 'TK-2026-B0001', '2026-04-03 12:10:06', 1017, 'Cliente 1', 474.14, 75.86, 550, 'Efectivo', 'Pagado', 550, 0),
(1002, 'TK-2026-B0002', '2026-05-30 07:19:23', 1019, 'Cliente 2', 15.52, 2.48, 18, 'Efectivo', 'Pagado', 18, 0),
(1003, 'TK-2026-B0003', '2026-04-03 22:06:13', 1042, 'Cliente 3', 867.24, 138.76, 1006, 'Efectivo', 'Pagado', 1006, 0),
(1004, 'TK-2026-B0004', '2026-04-07 19:16:59', 1005, 'Cliente 4', 288.79, 46.21, 335, 'Efectivo', 'Pagado', 335, 0),
(1005, 'TK-2026-B0005', '2026-05-11 19:06:16', 1005, 'Cliente 5', 392.24, 62.76, 455, 'Efectivo', 'Pagado', 455, 0),
(1006, 'TK-2026-B0006', '2026-04-11 18:43:07', 1046, 'Cliente 6', 319.83, 51.17, 371, 'Efectivo', 'Pagado', 371, 0),
(1007, 'TK-2026-B0007', '2026-03-23 10:04:22', 1024, 'Cliente 7', 1055.17, 168.83, 1224, 'Efectivo', 'Pagado', 1224, 0),
(1008, 'TK-2026-B0008', '2026-05-13 20:20:30', 1001, 'Cliente 8', 71.55, 11.45, 83, 'Efectivo', 'Pagado', 83, 0),
(1009, 'TK-2026-B0009', '2026-03-30 09:42:45', 1003, 'Cliente 9', 211.21, 33.79, 245, 'Efectivo', 'Pagado', 245, 0),
(1010, 'TK-2026-B0010', '2026-04-29 05:34:22', 1042, 'Cliente 10', 443.97, 71.03, 515, 'Efectivo', 'Pagado', 515, 0),
(1011, 'TK-2026-B0011', '2026-04-28 20:24:07', 1001, 'Cliente 11', 950.86, 152.14, 1103, 'Efectivo', 'Pagado', 1103, 0),
(1012, 'TK-2026-B0012', '2026-05-19 10:16:26', 1008, 'Cliente 12', 214.66, 34.34, 249, 'Efectivo', 'Pagado', 249, 0),
(1013, 'TK-2026-B0013', '2026-05-18 11:57:37', 1016, 'Cliente 13', 819.83, 131.17, 951, 'Efectivo', 'Pagado', 951, 0),
(1014, 'TK-2026-B0014', '2026-03-11 20:18:03', 1037, 'Cliente 14', 515.52, 82.48, 598, 'Efectivo', 'Pagado', 598, 0),
(1015, 'TK-2026-B0015', '2026-03-19 08:17:58', 1050, 'Cliente 15', 156.90, 25.10, 182, 'Efectivo', 'Pagado', 182, 0),
(1016, 'TK-2026-B0016', '2026-06-03 00:59:36', 1045, 'Cliente 16', 163.79, 26.21, 190, 'Efectivo', 'Pagado', 190, 0),
(1017, 'TK-2026-B0017', '2026-03-18 14:28:42', 1013, 'Cliente 17', 695.69, 111.31, 807, 'Efectivo', 'Pagado', 807, 0),
(1018, 'TK-2026-B0018', '2026-05-26 17:08:26', 1012, 'Cliente 18', 317.24, 50.76, 368, 'Efectivo', 'Pagado', 368, 0),
(1019, 'TK-2026-B0019', '2026-03-03 21:53:01', 1011, 'Cliente 19', 200.00, 32.00, 232, 'Efectivo', 'Pagado', 232, 0),
(1020, 'TK-2026-B0020', '2026-05-01 10:01:18', 1047, 'Cliente 20', 530.17, 84.83, 615, 'Efectivo', 'Pagado', 615, 0),
(1021, 'TK-2026-B0021', '2026-04-06 18:35:17', 1046, 'Cliente 21', 301.72, 48.28, 350, 'Efectivo', 'Pagado', 350, 0),
(1022, 'TK-2026-B0022', '2026-03-14 04:49:12', 1035, 'Cliente 22', 1291.38, 206.62, 1498, 'Efectivo', 'Pagado', 1498, 0),
(1023, 'TK-2026-B0023', '2026-05-18 03:25:05', 1008, 'Cliente 23', 224.14, 35.86, 260, 'Efectivo', 'Pagado', 260, 0),
(1024, 'TK-2026-B0024', '2026-04-09 20:07:19', 1040, 'Cliente 24', 582.76, 93.24, 676, 'Efectivo', 'Pagado', 676, 0),
(1025, 'TK-2026-B0025', '2026-05-11 19:08:47', 1017, 'Cliente 25', 312.93, 50.07, 363, 'Efectivo', 'Pagado', 363, 0),
(1026, 'TK-2026-B0026', '2026-03-14 02:43:12', 1014, 'Cliente 26', 830.17, 132.83, 963, 'Efectivo', 'Pagado', 963, 0),
(1027, 'TK-2026-B0027', '2026-05-12 19:03:00', 1046, 'Cliente 27', 150.00, 24.00, 174, 'Efectivo', 'Pagado', 174, 0),
(1028, 'TK-2026-B0028', '2026-05-14 06:00:28', 1002, 'Cliente 28', 125.00, 20.00, 145, 'Efectivo', 'Pagado', 145, 0),
(1029, 'TK-2026-B0029', '2026-04-06 14:43:56', 1032, 'Cliente 29', 325.86, 52.14, 378, 'Efectivo', 'Pagado', 378, 0),
(1030, 'TK-2026-B0030', '2026-03-26 00:36:22', 1023, 'Cliente 30', 837.93, 134.07, 972, 'Efectivo', 'Pagado', 972, 0),
(1031, 'TK-2026-B0031', '2026-03-24 12:38:35', 1049, 'Cliente 31', 786.21, 125.79, 912, 'Efectivo', 'Pagado', 912, 0),
(1032, 'TK-2026-B0032', '2026-05-10 01:26:28', 1040, 'Cliente 32', 103.45, 16.55, 120, 'Efectivo', 'Pagado', 120, 0),
(1033, 'TK-2026-B0033', '2026-03-07 14:30:09', 1018, 'Cliente 33', 748.28, 119.72, 868, 'Efectivo', 'Pagado', 868, 0),
(1034, 'TK-2026-B0034', '2026-03-04 14:27:31', 1019, 'Cliente 34', 699.14, 111.86, 811, 'Efectivo', 'Pagado', 811, 0),
(1035, 'TK-2026-B0035', '2026-05-27 04:40:10', 1007, 'Cliente 35', 906.90, 145.10, 1052, 'Efectivo', 'Pagado', 1052, 0),
(1036, 'TK-2026-B0036', '2026-04-27 10:56:06', 1023, 'Cliente 36', 234.48, 37.52, 272, 'Efectivo', 'Pagado', 272, 0),
(1037, 'TK-2026-B0037', '2026-06-04 03:53:39', 1033, 'Cliente 37', 62.93, 10.07, 73, 'Efectivo', 'Pagado', 73, 0),
(1038, 'TK-2026-B0038', '2026-04-01 21:25:44', 1043, 'Cliente 38', 29.31, 4.69, 34, 'Efectivo', 'Pagado', 34, 0),
(1039, 'TK-2026-B0039', '2026-05-03 22:39:59', 1038, 'Cliente 39', 722.41, 115.59, 838, 'Efectivo', 'Pagado', 838, 0),
(1040, 'TK-2026-B0040', '2026-04-03 22:03:11', 1003, 'Cliente 40', 159.48, 25.52, 185, 'Efectivo', 'Pagado', 185, 0),
(1041, 'TK-2026-B0041', '2026-05-07 01:46:44', 1035, 'Cliente 41', 65.52, 10.48, 76, 'Efectivo', 'Pagado', 76, 0),
(1042, 'TK-2026-B0042', '2026-04-05 10:20:59', 1038, 'Cliente 42', 117.24, 18.76, 136, 'Efectivo', 'Pagado', 136, 0),
(1043, 'TK-2026-B0043', '2026-05-15 14:40:10', 1039, 'Cliente 43', 434.48, 69.52, 504, 'Efectivo', 'Pagado', 504, 0),
(1044, 'TK-2026-B0044', '2026-05-29 22:07:38', 1023, 'Cliente 44', 468.97, 75.03, 544, 'Efectivo', 'Pagado', 544, 0),
(1045, 'TK-2026-B0045', '2026-05-29 17:32:13', 1008, 'Cliente 45', 50.86, 8.14, 59, 'Efectivo', 'Pagado', 59, 0),
(1046, 'TK-2026-B0046', '2026-05-10 11:47:43', 1040, 'Cliente 46', 230.17, 36.83, 267, 'Efectivo', 'Pagado', 267, 0),
(1047, 'TK-2026-B0047', '2026-04-01 09:49:26', 1033, 'Cliente 47', 515.52, 82.48, 598, 'Efectivo', 'Pagado', 598, 0),
(1048, 'TK-2026-B0048', '2026-04-18 07:43:04', 1018, 'Cliente 48', 718.97, 115.03, 834, 'Efectivo', 'Pagado', 834, 0),
(1049, 'TK-2026-B0049', '2026-05-16 15:37:51', 1002, 'Cliente 49', 362.07, 57.93, 420, 'Efectivo', 'Pagado', 420, 0),
(1050, 'TK-2026-B0050', '2026-04-10 12:40:10', 1039, 'Cliente 50', 157.76, 25.24, 183, 'Efectivo', 'Pagado', 183, 0);

INSERT INTO venta_detalles (id, venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal) VALUES
(1001, 1001, 1035, 'Producto Masivo', 4, 95, 380),
(1002, 1001, 1005, 'Producto Masivo', 2, 85, 170),
(1003, 1002, 1035, 'Producto Masivo', 1, 18, 18),
(1004, 1003, 1006, 'Producto Masivo', 4, 57, 228),
(1005, 1003, 1014, 'Producto Masivo', 3, 88, 264),
(1006, 1003, 1002, 'Producto Masivo', 3, 50, 150),
(1007, 1003, 1006, 'Producto Masivo', 4, 91, 364),
(1008, 1004, 1030, 'Producto Masivo', 1, 76, 76),
(1009, 1004, 1026, 'Producto Masivo', 3, 18, 54),
(1010, 1004, 1049, 'Producto Masivo', 1, 80, 80),
(1011, 1004, 1047, 'Producto Masivo', 2, 42, 84),
(1012, 1004, 1023, 'Producto Masivo', 1, 41, 41),
(1013, 1005, 1003, 'Producto Masivo', 1, 69, 69),
(1014, 1005, 1029, 'Producto Masivo', 1, 30, 30),
(1015, 1005, 1012, 'Producto Masivo', 2, 76, 152),
(1016, 1005, 1031, 'Producto Masivo', 4, 51, 204),
(1017, 1006, 1010, 'Producto Masivo', 1, 75, 75),
(1018, 1006, 1049, 'Producto Masivo', 4, 74, 296),
(1019, 1007, 1030, 'Producto Masivo', 4, 99, 396),
(1020, 1007, 1035, 'Producto Masivo', 4, 48, 192),
(1021, 1007, 1033, 'Producto Masivo', 2, 38, 76),
(1022, 1007, 1048, 'Producto Masivo', 3, 50, 150),
(1023, 1007, 1003, 'Producto Masivo', 5, 82, 410),
(1024, 1008, 1049, 'Producto Masivo', 1, 83, 83),
(1025, 1009, 1047, 'Producto Masivo', 5, 49, 245),
(1026, 1010, 1001, 'Producto Masivo', 3, 44, 132),
(1027, 1010, 1025, 'Producto Masivo', 5, 72, 360),
(1028, 1010, 1031, 'Producto Masivo', 1, 23, 23),
(1029, 1011, 1032, 'Producto Masivo', 3, 59, 177),
(1030, 1011, 1012, 'Producto Masivo', 5, 87, 435),
(1031, 1011, 1008, 'Producto Masivo', 2, 97, 194),
(1032, 1011, 1038, 'Producto Masivo', 3, 99, 297),
(1033, 1012, 1014, 'Producto Masivo', 3, 83, 249),
(1034, 1013, 1001, 'Producto Masivo', 2, 55, 110),
(1035, 1013, 1016, 'Producto Masivo', 4, 89, 356),
(1036, 1013, 1044, 'Producto Masivo', 5, 27, 135),
(1037, 1013, 1032, 'Producto Masivo', 5, 70, 350),
(1038, 1014, 1019, 'Producto Masivo', 1, 56, 56),
(1039, 1014, 1009, 'Producto Masivo', 2, 59, 118),
(1040, 1014, 1006, 'Producto Masivo', 5, 17, 85),
(1041, 1014, 1034, 'Producto Masivo', 5, 60, 300),
(1042, 1014, 1042, 'Producto Masivo', 3, 13, 39),
(1043, 1015, 1047, 'Producto Masivo', 1, 59, 59),
(1044, 1015, 1038, 'Producto Masivo', 3, 24, 72),
(1045, 1015, 1025, 'Producto Masivo', 1, 51, 51),
(1046, 1016, 1025, 'Producto Masivo', 2, 95, 190),
(1047, 1017, 1010, 'Producto Masivo', 4, 91, 364),
(1048, 1017, 1044, 'Producto Masivo', 3, 95, 285),
(1049, 1017, 1006, 'Producto Masivo', 2, 42, 84),
(1050, 1017, 1011, 'Producto Masivo', 1, 74, 74),
(1051, 1018, 1036, 'Producto Masivo', 2, 100, 200),
(1052, 1018, 1032, 'Producto Masivo', 4, 42, 168),
(1053, 1019, 1025, 'Producto Masivo', 4, 58, 232),
(1054, 1020, 1041, 'Producto Masivo', 2, 65, 130),
(1055, 1020, 1033, 'Producto Masivo', 1, 40, 40),
(1056, 1020, 1008, 'Producto Masivo', 5, 89, 445),
(1057, 1021, 1035, 'Producto Masivo', 1, 87, 87),
(1058, 1021, 1035, 'Producto Masivo', 3, 51, 153),
(1059, 1021, 1046, 'Producto Masivo', 1, 92, 92),
(1060, 1021, 1041, 'Producto Masivo', 1, 18, 18),
(1061, 1022, 1031, 'Producto Masivo', 5, 95, 475),
(1062, 1022, 1016, 'Producto Masivo', 5, 79, 395),
(1063, 1022, 1041, 'Producto Masivo', 1, 93, 93),
(1064, 1022, 1003, 'Producto Masivo', 5, 57, 285),
(1065, 1022, 1024, 'Producto Masivo', 5, 50, 250),
(1066, 1023, 1007, 'Producto Masivo', 5, 52, 260),
(1067, 1024, 1006, 'Producto Masivo', 5, 38, 190),
(1068, 1024, 1044, 'Producto Masivo', 5, 20, 100),
(1069, 1024, 1019, 'Producto Masivo', 5, 64, 320),
(1070, 1024, 1020, 'Producto Masivo', 2, 33, 66),
(1071, 1025, 1004, 'Producto Masivo', 3, 27, 81),
(1072, 1025, 1026, 'Producto Masivo', 2, 69, 138),
(1073, 1025, 1050, 'Producto Masivo', 2, 72, 144),
(1074, 1026, 1037, 'Producto Masivo', 3, 92, 276),
(1075, 1026, 1030, 'Producto Masivo', 5, 71, 355),
(1076, 1026, 1025, 'Producto Masivo', 1, 68, 68),
(1077, 1026, 1044, 'Producto Masivo', 2, 54, 108),
(1078, 1026, 1044, 'Producto Masivo', 3, 52, 156),
(1079, 1027, 1037, 'Producto Masivo', 2, 87, 174),
(1080, 1028, 1023, 'Producto Masivo', 5, 29, 145),
(1081, 1029, 1048, 'Producto Masivo', 3, 48, 144),
(1082, 1029, 1003, 'Producto Masivo', 3, 78, 234),
(1083, 1030, 1047, 'Producto Masivo', 3, 94, 282),
(1084, 1030, 1035, 'Producto Masivo', 2, 90, 180),
(1085, 1030, 1014, 'Producto Masivo', 5, 58, 290),
(1086, 1030, 1021, 'Producto Masivo', 4, 55, 220),
(1087, 1031, 1007, 'Producto Masivo', 3, 76, 228),
(1088, 1031, 1029, 'Producto Masivo', 2, 28, 56),
(1089, 1031, 1043, 'Producto Masivo', 5, 53, 265),
(1090, 1031, 1024, 'Producto Masivo', 2, 45, 90),
(1091, 1031, 1011, 'Producto Masivo', 3, 91, 273),
(1092, 1032, 1044, 'Producto Masivo', 3, 40, 120),
(1093, 1033, 1035, 'Producto Masivo', 5, 92, 460),
(1094, 1033, 1037, 'Producto Masivo', 4, 85, 340),
(1095, 1033, 1034, 'Producto Masivo', 2, 34, 68),
(1096, 1034, 1007, 'Producto Masivo', 4, 38, 152),
(1097, 1034, 1041, 'Producto Masivo', 3, 81, 243),
(1098, 1034, 1041, 'Producto Masivo', 3, 19, 57),
(1099, 1034, 1045, 'Producto Masivo', 5, 56, 280),
(1100, 1034, 1043, 'Producto Masivo', 1, 79, 79),
(1101, 1035, 1009, 'Producto Masivo', 5, 17, 85),
(1102, 1035, 1024, 'Producto Masivo', 4, 23, 92),
(1103, 1035, 1035, 'Producto Masivo', 5, 77, 385),
(1104, 1035, 1018, 'Producto Masivo', 5, 98, 490),
(1105, 1036, 1037, 'Producto Masivo', 4, 68, 272),
(1106, 1037, 1033, 'Producto Masivo', 2, 20, 40),
(1107, 1037, 1044, 'Producto Masivo', 1, 33, 33),
(1108, 1038, 1007, 'Producto Masivo', 2, 17, 34),
(1109, 1039, 1033, 'Producto Masivo', 4, 32, 128),
(1110, 1039, 1044, 'Producto Masivo', 5, 94, 470),
(1111, 1039, 1023, 'Producto Masivo', 4, 60, 240),
(1112, 1040, 1021, 'Producto Masivo', 2, 40, 80),
(1113, 1040, 1008, 'Producto Masivo', 3, 35, 105),
(1114, 1041, 1028, 'Producto Masivo', 4, 19, 76),
(1115, 1042, 1050, 'Producto Masivo', 4, 34, 136),
(1116, 1043, 1043, 'Producto Masivo', 2, 63, 126),
(1117, 1043, 1026, 'Producto Masivo', 2, 69, 138),
(1118, 1043, 1015, 'Producto Masivo', 3, 80, 240),
(1119, 1044, 1032, 'Producto Masivo', 2, 65, 130),
(1120, 1044, 1024, 'Producto Masivo', 3, 76, 228),
(1121, 1044, 1048, 'Producto Masivo', 2, 27, 54),
(1122, 1044, 1033, 'Producto Masivo', 4, 33, 132),
(1123, 1045, 1038, 'Producto Masivo', 1, 59, 59),
(1124, 1046, 1020, 'Producto Masivo', 4, 42, 168),
(1125, 1046, 1034, 'Producto Masivo', 3, 33, 99),
(1126, 1047, 1010, 'Producto Masivo', 4, 82, 328),
(1127, 1047, 1041, 'Producto Masivo', 2, 35, 70),
(1128, 1047, 1002, 'Producto Masivo', 4, 50, 200),
(1129, 1048, 1018, 'Producto Masivo', 2, 60, 120),
(1130, 1048, 1028, 'Producto Masivo', 2, 55, 110),
(1131, 1048, 1031, 'Producto Masivo', 3, 83, 249),
(1132, 1048, 1031, 'Producto Masivo', 3, 85, 255),
(1133, 1048, 1013, 'Producto Masivo', 1, 100, 100),
(1134, 1049, 1045, 'Producto Masivo', 5, 84, 420),
(1135, 1050, 1019, 'Producto Masivo', 3, 49, 147),
(1136, 1050, 1005, 'Producto Masivo', 2, 18, 36);

INSERT INTO mermas (producto_id, cantidad, motivo, fecha_hora, usuario_id) VALUES
(1033, 4, 'Producto roto', '2026-03-23 02:34:29', 1047),
(1033, 4, 'Caducidad', '2026-05-22 23:14:00', 1012),
(1047, 2, 'Producto roto', '2026-04-03 08:31:21', 1019),
(1007, 2, 'Producto roto', '2026-05-10 04:20:09', 1045),
(1029, 2, 'Empaque dañado', '2026-05-12 06:42:06', 1041),
(1029, 1, 'Empaque dañado', '2026-05-04 05:42:49', 1014),
(1039, 1, 'Caducidad', '2026-05-17 04:56:03', 1003),
(1040, 5, 'Producto roto', '2026-05-21 12:25:25', 1030),
(1039, 1, 'Empaque dañado', '2026-04-09 14:34:04', 1013),
(1029, 3, 'Empaque dañado', '2026-03-21 00:18:16', 1027),
(1050, 1, 'Caducidad', '2026-04-02 02:09:50', 1049),
(1048, 3, 'Caducidad', '2026-05-05 13:18:02', 1048),
(1048, 4, 'Producto roto', '2026-04-17 07:12:01', 1044),
(1016, 5, 'Caducidad', '2026-03-27 17:59:19', 1029),
(1030, 3, 'Producto roto', '2026-03-10 15:26:24', 1050),
(1005, 1, 'Producto roto', '2026-05-10 07:58:53', 1036),
(1035, 3, 'Producto roto', '2026-03-25 08:23:05', 1041),
(1043, 1, 'Producto roto', '2026-05-30 19:49:16', 1014),
(1014, 2, 'Empaque dañado', '2026-05-27 03:53:17', 1010),
(1042, 4, 'Producto roto', '2026-04-27 13:45:45', 1048),
(1013, 2, 'Empaque dañado', '2026-04-29 10:00:08', 1042),
(1018, 4, 'Caducidad', '2026-05-11 16:04:31', 1024),
(1023, 1, 'Empaque dañado', '2026-03-11 01:57:42', 1025),
(1040, 1, 'Caducidad', '2026-04-07 23:32:49', 1047),
(1027, 2, 'Producto roto', '2026-05-17 17:32:31', 1046),
(1033, 4, 'Caducidad', '2026-05-19 01:36:11', 1040),
(1036, 5, 'Caducidad', '2026-03-16 07:56:55', 1017),
(1002, 1, 'Producto roto', '2026-04-11 04:28:42', 1034),
(1034, 4, 'Empaque dañado', '2026-03-29 08:06:48', 1035),
(1043, 5, 'Caducidad', '2026-05-16 05:47:22', 1014),
(1028, 4, 'Empaque dañado', '2026-05-26 01:07:25', 1039),
(1001, 2, 'Empaque dañado', '2026-04-28 01:38:33', 1035),
(1048, 2, 'Caducidad', '2026-06-02 02:16:32', 1016),
(1034, 3, 'Caducidad', '2026-04-26 09:44:43', 1047),
(1037, 5, 'Producto roto', '2026-05-06 02:06:54', 1001),
(1050, 1, 'Empaque dañado', '2026-05-27 09:44:08', 1013),
(1003, 3, 'Caducidad', '2026-05-20 20:03:23', 1003),
(1006, 1, 'Caducidad', '2026-03-04 07:01:40', 1044),
(1012, 3, 'Empaque dañado', '2026-05-14 21:47:29', 1030),
(1027, 2, 'Producto roto', '2026-05-07 03:48:50', 1024),
(1018, 1, 'Empaque dañado', '2026-04-16 13:16:43', 1029),
(1033, 5, 'Caducidad', '2026-03-31 15:13:41', 1012),
(1017, 1, 'Producto roto', '2026-05-29 06:18:12', 1044),
(1028, 2, 'Caducidad', '2026-05-28 20:34:44', 1042),
(1006, 2, 'Producto roto', '2026-03-18 06:27:32', 1013),
(1039, 4, 'Empaque dañado', '2026-03-15 04:47:00', 1038),
(1003, 5, 'Caducidad', '2026-04-12 21:44:41', 1046),
(1012, 1, 'Empaque dañado', '2026-03-17 21:24:58', 1043),
(1009, 5, 'Empaque dañado', '2026-03-10 17:02:42', 1040),
(1021, 2, 'Producto roto', '2026-03-07 20:39:18', 1047);

INSERT INTO compras (id, proveedor_id, usuario_id, fecha_hora, total, estado) VALUES
(1001, 1027, 1002, '2026-05-18 12:46:35', 2921, 'Completado'),
(1002, 1035, 1034, '2026-05-28 04:24:51', 3291, 'Completado'),
(1003, 1030, 1047, '2026-06-02 22:16:40', 1710, 'Completado'),
(1004, 1009, 1011, '2026-03-08 16:12:27', 321, 'Completado'),
(1005, 1026, 1033, '2026-05-04 15:02:17', 4427, 'Completado'),
(1006, 1018, 1023, '2026-05-15 06:43:05', 1751, 'Completado'),
(1007, 1008, 1010, '2026-05-13 07:29:11', 2549, 'Completado'),
(1008, 1049, 1033, '2026-04-11 12:25:16', 1582, 'Completado'),
(1009, 1020, 1026, '2026-03-05 09:18:32', 2673, 'Completado'),
(1010, 1013, 1044, '2026-03-21 07:04:21', 540, 'Completado'),
(1011, 1018, 1003, '2026-05-04 00:30:03', 2416, 'Completado'),
(1012, 1036, 1046, '2026-04-23 06:14:44', 133, 'Completado'),
(1013, 1007, 1045, '2026-03-30 04:23:15', 2835, 'Completado'),
(1014, 1038, 1004, '2026-05-07 12:18:02', 3511, 'Completado'),
(1015, 1025, 1012, '2026-03-02 13:40:36', 1989, 'Completado'),
(1016, 1002, 1046, '2026-03-23 14:47:29', 2178, 'Completado'),
(1017, 1015, 1028, '2026-05-12 21:08:15', 1518, 'Completado'),
(1018, 1014, 1038, '2026-04-21 02:03:34', 2662, 'Completado'),
(1019, 1045, 1001, '2026-04-29 03:36:36', 930, 'Completado'),
(1020, 1035, 1022, '2026-05-24 04:54:07', 1676, 'Completado'),
(1021, 1043, 1025, '2026-03-15 07:37:26', 3759, 'Completado'),
(1022, 1043, 1049, '2026-03-15 15:55:17', 851, 'Completado'),
(1023, 1013, 1042, '2026-05-20 16:54:36', 1546, 'Completado'),
(1024, 1034, 1015, '2026-03-23 21:53:56', 665, 'Completado'),
(1025, 1014, 1028, '2026-03-10 00:44:33', 1650, 'Completado'),
(1026, 1016, 1034, '2026-03-02 14:18:23', 3642, 'Completado'),
(1027, 1027, 1018, '2026-04-04 00:59:50', 720, 'Completado'),
(1028, 1007, 1015, '2026-04-25 01:22:34', 765, 'Completado'),
(1029, 1025, 1005, '2026-03-02 14:39:15', 1488, 'Completado'),
(1030, 1025, 1001, '2026-04-15 16:11:45', 2425, 'Completado'),
(1031, 1023, 1042, '2026-05-18 10:04:52', 1132, 'Completado'),
(1032, 1045, 1040, '2026-05-21 16:57:31', 1520, 'Completado'),
(1033, 1025, 1040, '2026-03-13 17:30:32', 1961, 'Completado'),
(1034, 1009, 1026, '2026-04-09 16:49:24', 576, 'Completado'),
(1035, 1017, 1035, '2026-04-23 06:30:55', 2110, 'Completado'),
(1036, 1030, 1045, '2026-03-10 09:28:43', 4063, 'Completado'),
(1037, 1046, 1046, '2026-03-07 10:20:08', 4125, 'Completado'),
(1038, 1017, 1035, '2026-05-28 00:40:12', 1865, 'Completado'),
(1039, 1035, 1043, '2026-04-18 01:42:35', 2971, 'Completado'),
(1040, 1023, 1025, '2026-05-07 23:58:16', 2485, 'Completado'),
(1041, 1038, 1046, '2026-06-06 01:45:22', 2356, 'Completado'),
(1042, 1011, 1012, '2026-06-02 12:43:04', 4329, 'Completado'),
(1043, 1010, 1017, '2026-04-09 09:32:37', 2510, 'Completado'),
(1044, 1034, 1037, '2026-03-05 12:31:53', 1803, 'Completado'),
(1045, 1047, 1040, '2026-04-25 00:45:40', 252, 'Completado'),
(1046, 1012, 1048, '2026-05-25 20:46:43', 1400, 'Completado'),
(1047, 1024, 1048, '2026-05-29 03:14:04', 1296, 'Completado'),
(1048, 1017, 1047, '2026-03-13 07:06:56', 1145, 'Completado'),
(1049, 1031, 1025, '2026-03-14 18:18:24', 3411, 'Completado'),
(1050, 1031, 1044, '2026-05-16 17:34:17', 663, 'Completado');

INSERT INTO compra_detalles (id, compra_id, producto_id, producto_nombre, cantidad, costo_unitario, subtotal) VALUES
(1001, 1001, 1047, 'Producto Masivo', 19, 19, 361),
(1002, 1001, 1027, 'Producto Masivo', 35, 40, 1400),
(1003, 1001, 1007, 'Producto Masivo', 20, 45, 900),
(1004, 1001, 1026, 'Producto Masivo', 26, 10, 260),
(1005, 1002, 1044, 'Producto Masivo', 16, 37, 592),
(1006, 1002, 1002, 'Producto Masivo', 11, 28, 308),
(1007, 1002, 1017, 'Producto Masivo', 48, 32, 1536),
(1008, 1002, 1032, 'Producto Masivo', 45, 19, 855),
(1009, 1003, 1004, 'Producto Masivo', 18, 11, 198),
(1010, 1003, 1029, 'Producto Masivo', 23, 38, 874),
(1011, 1003, 1019, 'Producto Masivo', 22, 29, 638),
(1012, 1004, 1042, 'Producto Masivo', 34, 6, 204),
(1013, 1004, 1007, 'Producto Masivo', 13, 9, 117),
(1014, 1005, 1007, 'Producto Masivo', 48, 17, 816),
(1015, 1005, 1038, 'Producto Masivo', 43, 27, 1161),
(1016, 1005, 1046, 'Producto Masivo', 49, 50, 2450),
(1017, 1006, 1038, 'Producto Masivo', 48, 6, 288),
(1018, 1006, 1003, 'Producto Masivo', 36, 10, 360),
(1019, 1006, 1002, 'Producto Masivo', 47, 17, 799),
(1020, 1006, 1005, 'Producto Masivo', 19, 16, 304),
(1021, 1007, 1042, 'Producto Masivo', 31, 25, 775),
(1022, 1007, 1006, 'Producto Masivo', 43, 29, 1247),
(1023, 1007, 1020, 'Producto Masivo', 17, 31, 527),
(1024, 1008, 1025, 'Producto Masivo', 28, 34, 952),
(1025, 1008, 1005, 'Producto Masivo', 35, 18, 630),
(1026, 1009, 1024, 'Producto Masivo', 20, 13, 260),
(1027, 1009, 1037, 'Producto Masivo', 49, 30, 1470),
(1028, 1009, 1005, 'Producto Masivo', 37, 13, 481),
(1029, 1009, 1013, 'Producto Masivo', 11, 42, 462),
(1030, 1010, 1020, 'Producto Masivo', 45, 12, 540),
(1031, 1011, 1007, 'Producto Masivo', 27, 6, 162),
(1032, 1011, 1043, 'Producto Masivo', 49, 46, 2254),
(1033, 1012, 1030, 'Producto Masivo', 19, 7, 133),
(1034, 1013, 1032, 'Producto Masivo', 11, 23, 253),
(1035, 1013, 1033, 'Producto Masivo', 13, 16, 208),
(1036, 1013, 1043, 'Producto Masivo', 20, 49, 980),
(1037, 1013, 1040, 'Producto Masivo', 41, 34, 1394),
(1038, 1014, 1016, 'Producto Masivo', 47, 47, 2209),
(1039, 1014, 1028, 'Producto Masivo', 31, 42, 1302),
(1040, 1015, 1007, 'Producto Masivo', 12, 31, 372),
(1041, 1015, 1031, 'Producto Masivo', 49, 33, 1617),
(1042, 1016, 1028, 'Producto Masivo', 26, 36, 936),
(1043, 1016, 1017, 'Producto Masivo', 46, 27, 1242),
(1044, 1017, 1047, 'Producto Masivo', 40, 8, 320),
(1045, 1017, 1045, 'Producto Masivo', 16, 43, 688),
(1046, 1017, 1002, 'Producto Masivo', 30, 17, 510),
(1047, 1018, 1015, 'Producto Masivo', 12, 23, 276),
(1048, 1018, 1043, 'Producto Masivo', 41, 23, 943),
(1049, 1018, 1032, 'Producto Masivo', 23, 41, 943),
(1050, 1018, 1010, 'Producto Masivo', 20, 25, 500),
(1051, 1019, 1041, 'Producto Masivo', 16, 30, 480),
(1052, 1019, 1050, 'Producto Masivo', 45, 10, 450),
(1053, 1020, 1037, 'Producto Masivo', 18, 34, 612),
(1054, 1020, 1041, 'Producto Masivo', 28, 38, 1064),
(1055, 1021, 1015, 'Producto Masivo', 17, 49, 833),
(1056, 1021, 1039, 'Producto Masivo', 23, 36, 828),
(1057, 1021, 1031, 'Producto Masivo', 40, 43, 1720),
(1058, 1021, 1037, 'Producto Masivo', 42, 9, 378),
(1059, 1022, 1008, 'Producto Masivo', 37, 23, 851),
(1060, 1023, 1027, 'Producto Masivo', 27, 8, 216),
(1061, 1023, 1012, 'Producto Masivo', 38, 35, 1330),
(1062, 1024, 1043, 'Producto Masivo', 35, 19, 665),
(1063, 1025, 1050, 'Producto Masivo', 50, 33, 1650),
(1064, 1026, 1017, 'Producto Masivo', 38, 22, 836),
(1065, 1026, 1022, 'Producto Masivo', 36, 34, 1224),
(1066, 1026, 1040, 'Producto Masivo', 26, 35, 910),
(1067, 1026, 1026, 'Producto Masivo', 48, 14, 672),
(1068, 1027, 1034, 'Producto Masivo', 20, 36, 720),
(1069, 1028, 1010, 'Producto Masivo', 45, 17, 765),
(1070, 1029, 1026, 'Producto Masivo', 48, 31, 1488),
(1071, 1030, 1030, 'Producto Masivo', 14, 11, 154),
(1072, 1030, 1017, 'Producto Masivo', 32, 26, 832),
(1073, 1030, 1033, 'Producto Masivo', 17, 31, 527),
(1074, 1030, 1011, 'Producto Masivo', 48, 19, 912),
(1075, 1031, 1006, 'Producto Masivo', 46, 7, 322),
(1076, 1031, 1011, 'Producto Masivo', 30, 27, 810),
(1077, 1032, 1003, 'Producto Masivo', 38, 40, 1520),
(1078, 1033, 1019, 'Producto Masivo', 37, 31, 1147),
(1079, 1033, 1044, 'Producto Masivo', 37, 22, 814),
(1080, 1034, 1033, 'Producto Masivo', 32, 18, 576),
(1081, 1035, 1007, 'Producto Masivo', 45, 15, 675),
(1082, 1035, 1008, 'Producto Masivo', 41, 35, 1435),
(1083, 1036, 1037, 'Producto Masivo', 47, 37, 1739),
(1084, 1036, 1018, 'Producto Masivo', 49, 40, 1960),
(1085, 1036, 1050, 'Producto Masivo', 26, 14, 364),
(1086, 1037, 1010, 'Producto Masivo', 32, 43, 1376),
(1087, 1037, 1043, 'Producto Masivo', 42, 29, 1218),
(1088, 1037, 1008, 'Producto Masivo', 24, 44, 1056),
(1089, 1037, 1021, 'Producto Masivo', 25, 19, 475),
(1090, 1038, 1031, 'Producto Masivo', 15, 31, 465),
(1091, 1038, 1007, 'Producto Masivo', 50, 28, 1400),
(1092, 1039, 1007, 'Producto Masivo', 46, 32, 1472),
(1093, 1039, 1004, 'Producto Masivo', 29, 13, 377),
(1094, 1039, 1044, 'Producto Masivo', 34, 33, 1122),
(1095, 1040, 1028, 'Producto Masivo', 14, 40, 560),
(1096, 1040, 1045, 'Producto Masivo', 21, 25, 525),
(1097, 1040, 1014, 'Producto Masivo', 50, 28, 1400),
(1098, 1041, 1016, 'Producto Masivo', 44, 41, 1804),
(1099, 1041, 1012, 'Producto Masivo', 23, 24, 552),
(1100, 1042, 1013, 'Producto Masivo', 18, 38, 684),
(1101, 1042, 1001, 'Producto Masivo', 36, 50, 1800),
(1102, 1042, 1041, 'Producto Masivo', 41, 45, 1845),
(1103, 1043, 1021, 'Producto Masivo', 26, 43, 1118),
(1104, 1043, 1045, 'Producto Masivo', 19, 24, 456),
(1105, 1043, 1012, 'Producto Masivo', 39, 24, 936),
(1106, 1044, 1029, 'Producto Masivo', 36, 15, 540),
(1107, 1044, 1008, 'Producto Masivo', 21, 13, 273),
(1108, 1044, 1041, 'Producto Masivo', 22, 45, 990),
(1109, 1045, 1022, 'Producto Masivo', 14, 18, 252),
(1110, 1046, 1048, 'Producto Masivo', 28, 50, 1400),
(1111, 1047, 1021, 'Producto Masivo', 48, 27, 1296),
(1112, 1048, 1032, 'Producto Masivo', 39, 25, 975),
(1113, 1048, 1017, 'Producto Masivo', 10, 17, 170),
(1114, 1049, 1014, 'Producto Masivo', 10, 48, 480),
(1115, 1049, 1030, 'Producto Masivo', 21, 50, 1050),
(1116, 1049, 1033, 'Producto Masivo', 29, 42, 1218),
(1117, 1049, 1050, 'Producto Masivo', 39, 17, 663),
(1118, 1050, 1047, 'Producto Masivo', 39, 17, 663);

INSERT INTO caja_movimientos (turno_id, fecha_hora, tipo, categoria, concepto, monto) VALUES
(1014, '2026-06-03 05:31:18', 'entrada', 'operativo', 'Servicios', 826),
(1002, '2026-05-29 01:27:24', 'entrada', 'operativo', 'Pago a proveedor', 854),
(1001, '2026-05-03 22:13:14', 'entrada', 'otro', 'Retiro de efectivo', 925),
(1013, '2026-04-17 03:36:42', 'entrada', 'operativo', 'Servicios', 372),
(1003, '2026-06-01 03:09:53', 'entrada', 'operativo', 'Fondo extra', 343),
(1042, '2026-05-25 15:27:04', 'entrada', 'otro', 'Servicios', 172),
(1015, '2026-05-06 02:37:39', 'entrada', 'otro', 'Fondo extra', 679),
(1048, '2026-05-23 09:58:28', 'retiro', 'proveedor', 'Fondo extra', 797),
(1012, '2026-05-22 19:27:25', 'entrada', 'otro', 'Servicios', 877),
(1032, '2026-04-15 08:01:50', 'retiro', 'operativo', 'Fondo extra', 896),
(1035, '2026-05-10 10:55:39', 'entrada', 'proveedor', 'Fondo extra', 968),
(1019, '2026-05-04 00:38:41', 'retiro', 'proveedor', 'Servicios', 793),
(1048, '2026-03-17 05:56:54', 'retiro', 'otro', 'Fondo extra', 419),
(1050, '2026-04-10 11:18:18', 'retiro', 'proveedor', 'Retiro de efectivo', 872),
(1045, '2026-04-09 07:32:26', 'retiro', 'operativo', 'Servicios', 149),
(1006, '2026-03-02 19:37:31', 'entrada', 'proveedor', 'Fondo extra', 331),
(1017, '2026-03-23 01:19:07', 'entrada', 'otro', 'Pago a proveedor', 980),
(1045, '2026-03-27 05:10:23', 'entrada', 'operativo', 'Retiro de efectivo', 334),
(1009, '2026-03-01 12:07:40', 'retiro', 'operativo', 'Pago a proveedor', 388),
(1042, '2026-04-13 01:34:06', 'entrada', 'otro', 'Retiro de efectivo', 135),
(1009, '2026-06-01 05:14:18', 'retiro', 'operativo', 'Retiro de efectivo', 411),
(1008, '2026-05-13 12:43:43', 'entrada', 'operativo', 'Fondo extra', 892),
(1026, '2026-05-23 12:00:30', 'retiro', 'otro', 'Pago a proveedor', 115),
(1047, '2026-06-03 07:18:20', 'entrada', 'operativo', 'Retiro de efectivo', 627),
(1013, '2026-03-02 01:43:06', 'entrada', 'proveedor', 'Retiro de efectivo', 900),
(1028, '2026-04-04 02:47:32', 'entrada', 'otro', 'Retiro de efectivo', 877),
(1039, '2026-06-05 18:28:56', 'retiro', 'proveedor', 'Retiro de efectivo', 950),
(1047, '2026-03-19 05:53:34', 'entrada', 'otro', 'Retiro de efectivo', 459),
(1049, '2026-03-28 21:45:35', 'retiro', 'operativo', 'Fondo extra', 990),
(1050, '2026-04-10 04:38:13', 'entrada', 'proveedor', 'Fondo extra', 262),
(1002, '2026-05-22 03:40:47', 'retiro', 'proveedor', 'Pago a proveedor', 537),
(1047, '2026-03-23 03:52:35', 'entrada', 'operativo', 'Retiro de efectivo', 947),
(1014, '2026-04-11 17:38:09', 'retiro', 'otro', 'Servicios', 163),
(1046, '2026-06-02 07:19:58', 'retiro', 'proveedor', 'Pago a proveedor', 493),
(1031, '2026-05-26 20:35:59', 'retiro', 'operativo', 'Retiro de efectivo', 137),
(1046, '2026-04-12 03:58:15', 'retiro', 'operativo', 'Servicios', 345),
(1026, '2026-03-04 09:50:31', 'entrada', 'proveedor', 'Fondo extra', 733),
(1013, '2026-05-23 20:39:24', 'entrada', 'proveedor', 'Pago a proveedor', 190),
(1030, '2026-03-02 15:52:40', 'retiro', 'operativo', 'Pago a proveedor', 938),
(1018, '2026-04-06 20:24:12', 'entrada', 'otro', 'Servicios', 322),
(1027, '2026-03-15 01:16:32', 'entrada', 'proveedor', 'Fondo extra', 275),
(1037, '2026-04-03 03:26:28', 'retiro', 'proveedor', 'Servicios', 504),
(1029, '2026-05-08 01:33:09', 'entrada', 'proveedor', 'Servicios', 565),
(1037, '2026-04-16 11:10:54', 'entrada', 'otro', 'Fondo extra', 416),
(1035, '2026-05-18 22:29:20', 'entrada', 'operativo', 'Pago a proveedor', 183),
(1028, '2026-04-11 11:48:27', 'entrada', 'proveedor', 'Retiro de efectivo', 253),
(1003, '2026-03-07 08:17:10', 'entrada', 'otro', 'Servicios', 686),
(1050, '2026-05-25 04:29:08', 'entrada', 'otro', 'Pago a proveedor', 198),
(1012, '2026-04-12 05:22:48', 'entrada', 'otro', 'Pago a proveedor', 122),
(1023, '2026-03-06 16:01:44', 'retiro', 'proveedor', 'Fondo extra', 979);

INSERT INTO auditoria_registros (fecha_hora, usuario_id, usuario_nombre, evento, detalle) VALUES
('2026-05-15 18:37:26', 1022, 'Usuario Generico 1022', 'CAMBIO_DE_PRECIO', 'Acción realizada en el sistema con ID 578'),
('2026-03-09 22:06:54', 1003, 'Usuario Generico 1003', 'CAMBIO_DE_PRECIO', 'Acción realizada en el sistema con ID 664'),
('2026-06-03 14:00:49', 1005, 'Usuario Generico 1005', 'CANCELACION', 'Acción realizada en el sistema con ID 723'),
('2026-04-11 21:45:14', 1040, 'Usuario Generico 1040', 'MERMA', 'Acción realizada en el sistema con ID 501'),
('2026-03-13 01:01:17', 1006, 'Usuario Generico 1006', 'EDICION', 'Acción realizada en el sistema con ID 404'),
('2026-03-25 09:09:19', 1045, 'Usuario Generico 1045', 'LOGIN', 'Acción realizada en el sistema con ID 564'),
('2026-03-18 11:05:21', 1024, 'Usuario Generico 1024', 'EDICION', 'Acción realizada en el sistema con ID 461'),
('2026-05-18 07:39:39', 1035, 'Usuario Generico 1035', 'CAMBIO_DE_PRECIO', 'Acción realizada en el sistema con ID 824'),
('2026-04-06 17:38:33', 1026, 'Usuario Generico 1026', 'CAMBIO_DE_PRECIO', 'Acción realizada en el sistema con ID 160'),
('2026-05-04 20:16:20', 1029, 'Usuario Generico 1029', 'EDICION', 'Acción realizada en el sistema con ID 716'),
('2026-04-10 18:24:37', 1022, 'Usuario Generico 1022', 'CAMBIO_DE_PRECIO', 'Acción realizada en el sistema con ID 996'),
('2026-04-21 14:47:54', 1018, 'Usuario Generico 1018', 'CAMBIO_DE_PRECIO', 'Acción realizada en el sistema con ID 498'),
('2026-05-05 05:54:24', 1035, 'Usuario Generico 1035', 'EDICION', 'Acción realizada en el sistema con ID 271'),
('2026-04-28 13:26:22', 1041, 'Usuario Generico 1041', 'EDICION', 'Acción realizada en el sistema con ID 966'),
('2026-04-26 05:59:54', 1006, 'Usuario Generico 1006', 'CAMBIO_DE_PRECIO', 'Acción realizada en el sistema con ID 374'),
('2026-05-28 04:33:37', 1015, 'Usuario Generico 1015', 'CAMBIO_DE_PRECIO', 'Acción realizada en el sistema con ID 643'),
('2026-03-07 08:12:29', 1001, 'Usuario Generico 1001', 'MERMA', 'Acción realizada en el sistema con ID 106'),
('2026-05-31 13:41:56', 1021, 'Usuario Generico 1021', 'MERMA', 'Acción realizada en el sistema con ID 397'),
('2026-05-09 19:59:18', 1043, 'Usuario Generico 1043', 'LOGIN', 'Acción realizada en el sistema con ID 860'),
('2026-04-19 23:51:44', 1045, 'Usuario Generico 1045', 'MERMA', 'Acción realizada en el sistema con ID 670'),
('2026-04-15 04:33:23', 1026, 'Usuario Generico 1026', 'CAMBIO_DE_PRECIO', 'Acción realizada en el sistema con ID 821'),
('2026-03-21 19:13:27', 1004, 'Usuario Generico 1004', 'MERMA', 'Acción realizada en el sistema con ID 805'),
('2026-04-05 15:33:32', 1018, 'Usuario Generico 1018', 'MERMA', 'Acción realizada en el sistema con ID 646'),
('2026-03-08 13:55:21', 1026, 'Usuario Generico 1026', 'CANCELACION', 'Acción realizada en el sistema con ID 706'),
('2026-05-03 00:25:25', 1041, 'Usuario Generico 1041', 'EDICION', 'Acción realizada en el sistema con ID 702'),
('2026-03-18 07:29:01', 1013, 'Usuario Generico 1013', 'EDICION', 'Acción realizada en el sistema con ID 201'),
('2026-06-05 12:26:54', 1031, 'Usuario Generico 1031', 'EDICION', 'Acción realizada en el sistema con ID 800'),
('2026-03-30 15:43:18', 1032, 'Usuario Generico 1032', 'CANCELACION', 'Acción realizada en el sistema con ID 921'),
('2026-04-20 23:37:15', 1013, 'Usuario Generico 1013', 'CANCELACION', 'Acción realizada en el sistema con ID 674'),
('2026-05-30 00:11:27', 1006, 'Usuario Generico 1006', 'EDICION', 'Acción realizada en el sistema con ID 947'),
('2026-04-27 10:59:34', 1006, 'Usuario Generico 1006', 'EDICION', 'Acción realizada en el sistema con ID 124'),
('2026-05-26 18:21:36', 1042, 'Usuario Generico 1042', 'LOGIN', 'Acción realizada en el sistema con ID 956'),
('2026-06-03 09:07:44', 1039, 'Usuario Generico 1039', 'CAMBIO_DE_PRECIO', 'Acción realizada en el sistema con ID 915'),
('2026-03-03 08:37:31', 1015, 'Usuario Generico 1015', 'EDICION', 'Acción realizada en el sistema con ID 765'),
('2026-03-29 22:19:32', 1015, 'Usuario Generico 1015', 'LOGIN', 'Acción realizada en el sistema con ID 283'),
('2026-03-31 22:34:39', 1025, 'Usuario Generico 1025', 'LOGIN', 'Acción realizada en el sistema con ID 514'),
('2026-05-19 11:46:22', 1026, 'Usuario Generico 1026', 'CAMBIO_DE_PRECIO', 'Acción realizada en el sistema con ID 167'),
('2026-04-16 23:56:51', 1042, 'Usuario Generico 1042', 'MERMA', 'Acción realizada en el sistema con ID 211'),
('2026-05-26 03:25:43', 1031, 'Usuario Generico 1031', 'EDICION', 'Acción realizada en el sistema con ID 294'),
('2026-04-30 15:14:41', 1017, 'Usuario Generico 1017', 'CAMBIO_DE_PRECIO', 'Acción realizada en el sistema con ID 726'),
('2026-04-10 10:11:46', 1033, 'Usuario Generico 1033', 'CANCELACION', 'Acción realizada en el sistema con ID 914'),
('2026-05-22 23:17:21', 1011, 'Usuario Generico 1011', 'EDICION', 'Acción realizada en el sistema con ID 583'),
('2026-03-24 10:46:06', 1016, 'Usuario Generico 1016', 'LOGIN', 'Acción realizada en el sistema con ID 425'),
('2026-05-15 18:53:17', 1046, 'Usuario Generico 1046', 'MERMA', 'Acción realizada en el sistema con ID 393'),
('2026-03-01 06:36:19', 1028, 'Usuario Generico 1028', 'CANCELACION', 'Acción realizada en el sistema con ID 407'),
('2026-04-25 14:25:34', 1005, 'Usuario Generico 1005', 'EDICION', 'Acción realizada en el sistema con ID 671'),
('2026-05-13 13:32:15', 1020, 'Usuario Generico 1020', 'CAMBIO_DE_PRECIO', 'Acción realizada en el sistema con ID 650'),
('2026-05-19 13:05:09', 1034, 'Usuario Generico 1034', 'CANCELACION', 'Acción realizada en el sistema con ID 961'),
('2026-04-25 06:58:34', 1045, 'Usuario Generico 1045', 'EDICION', 'Acción realizada en el sistema con ID 241'),
('2026-03-07 19:38:52', 1050, 'Usuario Generico 1050', 'EDICION', 'Acción realizada en el sistema con ID 648');

INSERT INTO caja_cortes (turno_id, fecha_hora, esperado, contado, diferencia) VALUES
(1035, '2026-04-16 05:09:08', 4477, 3060, -1417),
(1046, '2026-03-02 06:32:25', 2390, 2554, 164),
(1045, '2026-06-01 14:42:18', 4651, 3026, -1625),
(1050, '2026-04-15 05:54:03', 4984, 2886, -2098),
(1005, '2026-03-03 10:57:18', 3803, 4257, 454),
(1028, '2026-05-07 17:51:42', 4984, 3680, -1304),
(1021, '2026-03-23 19:01:37', 2517, 3428, 911),
(1042, '2026-05-20 01:05:28', 3521, 2599, -922),
(1009, '2026-06-04 07:53:42', 3017, 3082, 65),
(1025, '2026-05-18 13:01:40', 4802, 2850, -1952),
(1006, '2026-04-20 06:49:03', 3363, 1992, -1371),
(1012, '2026-04-12 16:51:06', 4611, 4446, -165),
(1032, '2026-06-04 10:40:33', 3817, 4678, 861),
(1022, '2026-03-06 13:36:22', 4511, 4613, 102),
(1045, '2026-04-11 01:59:09', 2625, 2264, -361),
(1003, '2026-04-07 03:28:31', 3787, 3460, -327),
(1050, '2026-04-08 16:06:53', 4593, 2916, -1677),
(1033, '2026-03-29 08:08:03', 4054, 2993, -1061),
(1010, '2026-03-11 17:31:27', 4242, 3196, -1046),
(1028, '2026-05-17 22:12:26', 3669, 3532, -137),
(1031, '2026-06-05 22:15:13', 3320, 4061, 741),
(1028, '2026-06-03 21:36:11', 4391, 2221, -2170),
(1042, '2026-03-27 11:03:05', 2202, 4943, 2741),
(1028, '2026-05-25 15:03:11', 3548, 2166, -1382),
(1039, '2026-03-05 12:06:05', 2344, 4787, 2443),
(1044, '2026-03-23 13:27:25', 3822, 4059, 237),
(1014, '2026-05-27 09:15:42', 3676, 2439, -1237),
(1038, '2026-04-29 14:11:07', 3925, 3815, -110),
(1038, '2026-04-11 11:44:45', 4510, 2643, -1867),
(1005, '2026-03-19 03:40:01', 2372, 2064, -308),
(1006, '2026-05-18 21:19:13', 4057, 2258, -1799),
(1002, '2026-05-12 19:19:12', 4453, 4077, -376),
(1012, '2026-03-04 00:27:46', 2551, 2100, -451),
(1041, '2026-03-24 13:55:20', 2148, 1919, -229),
(1048, '2026-04-04 07:18:21', 4414, 1968, -2446),
(1020, '2026-03-03 11:49:21', 3711, 4142, 431),
(1029, '2026-05-09 10:47:08', 4307, 3193, -1114),
(1018, '2026-05-01 04:25:31', 4068, 2970, -1098),
(1012, '2026-04-23 13:22:24', 4717, 2193, -2524),
(1015, '2026-05-04 19:16:32', 4726, 4052, -674),
(1037, '2026-06-04 13:06:15', 3810, 2268, -1542),
(1020, '2026-06-04 09:54:48', 2214, 2814, 600),
(1033, '2026-03-09 21:06:00', 4332, 4864, 532),
(1001, '2026-05-24 23:21:11', 4592, 4747, 155),
(1032, '2026-03-05 19:34:06', 3971, 2325, -1646),
(1007, '2026-04-09 04:01:40', 3173, 4387, 1214),
(1045, '2026-05-19 00:43:17', 3286, 4457, 1171),
(1010, '2026-03-05 01:45:04', 4238, 2367, -1871),
(1018, '2026-03-30 23:56:00', 4434, 3419, -1015),
(1020, '2026-05-05 06:24:44', 4532, 4152, -380);

INSERT INTO reportes (modulo, nombre, desde, hasta, generado_por, generado_por_nombre, generado_en) VALUES
('tesoreria', 'Reporte Masivo 1', '2026-04-17', '2026-04-24', 1040, 'Usuario Generico 1040', '2026-04-24 08:54:39'),
('ventas', 'Reporte Masivo 2', '2026-05-05', '2026-05-12', 1017, 'Usuario Generico 1017', '2026-05-12 17:40:28'),
('ventas', 'Reporte Masivo 3', '2026-05-29', '2026-06-05', 1013, 'Usuario Generico 1013', '2026-06-05 22:56:10'),
('tesoreria', 'Reporte Masivo 4', '2026-05-30', '2026-06-06', 1016, 'Usuario Generico 1016', '2026-06-06 20:01:30'),
('ventas', 'Reporte Masivo 5', '2026-05-07', '2026-05-14', 1047, 'Usuario Generico 1047', '2026-05-14 07:47:07'),
('ventas', 'Reporte Masivo 6', '2026-04-16', '2026-04-23', 1014, 'Usuario Generico 1014', '2026-04-23 01:48:50'),
('tesoreria', 'Reporte Masivo 7', '2026-04-08', '2026-04-15', 1022, 'Usuario Generico 1022', '2026-04-15 02:42:04'),
('ventas', 'Reporte Masivo 8', '2026-05-10', '2026-05-17', 1013, 'Usuario Generico 1013', '2026-05-17 04:53:59'),
('tesoreria', 'Reporte Masivo 9', '2026-05-07', '2026-05-14', 1012, 'Usuario Generico 1012', '2026-05-14 17:14:50'),
('ventas', 'Reporte Masivo 10', '2026-03-10', '2026-03-17', 1024, 'Usuario Generico 1024', '2026-03-17 02:31:14'),
('tesoreria', 'Reporte Masivo 11', '2026-03-19', '2026-03-26', 1034, 'Usuario Generico 1034', '2026-03-26 05:01:29'),
('ventas', 'Reporte Masivo 12', '2026-05-24', '2026-05-31', 1030, 'Usuario Generico 1030', '2026-05-31 00:33:35'),
('ventas', 'Reporte Masivo 13', '2026-05-15', '2026-05-22', 1016, 'Usuario Generico 1016', '2026-05-22 02:25:57'),
('tesoreria', 'Reporte Masivo 14', '2026-05-23', '2026-05-30', 1030, 'Usuario Generico 1030', '2026-05-30 21:54:53'),
('tesoreria', 'Reporte Masivo 15', '2026-03-06', '2026-03-13', 1012, 'Usuario Generico 1012', '2026-03-13 00:44:31'),
('tesoreria', 'Reporte Masivo 16', '2026-05-02', '2026-05-09', 1041, 'Usuario Generico 1041', '2026-05-09 06:32:55'),
('ventas', 'Reporte Masivo 17', '2026-05-19', '2026-05-26', 1032, 'Usuario Generico 1032', '2026-05-26 05:33:21'),
('ventas', 'Reporte Masivo 18', '2026-04-30', '2026-05-07', 1031, 'Usuario Generico 1031', '2026-05-07 19:23:35'),
('ventas', 'Reporte Masivo 19', '2026-05-10', '2026-05-17', 1021, 'Usuario Generico 1021', '2026-05-17 02:16:57'),
('ventas', 'Reporte Masivo 20', '2026-03-16', '2026-03-23', 1020, 'Usuario Generico 1020', '2026-03-23 11:55:12'),
('tesoreria', 'Reporte Masivo 21', '2026-04-11', '2026-04-18', 1046, 'Usuario Generico 1046', '2026-04-18 03:07:58'),
('ventas', 'Reporte Masivo 22', '2026-05-15', '2026-05-22', 1039, 'Usuario Generico 1039', '2026-05-22 02:32:21'),
('tesoreria', 'Reporte Masivo 23', '2026-04-24', '2026-05-01', 1011, 'Usuario Generico 1011', '2026-05-01 19:08:49'),
('ventas', 'Reporte Masivo 24', '2026-04-19', '2026-04-26', 1029, 'Usuario Generico 1029', '2026-04-26 21:58:13'),
('tesoreria', 'Reporte Masivo 25', '2026-03-10', '2026-03-17', 1041, 'Usuario Generico 1041', '2026-03-17 12:41:17'),
('ventas', 'Reporte Masivo 26', '2026-03-18', '2026-03-25', 1028, 'Usuario Generico 1028', '2026-03-25 22:46:30'),
('ventas', 'Reporte Masivo 27', '2026-03-28', '2026-04-04', 1013, 'Usuario Generico 1013', '2026-04-04 11:36:21'),
('ventas', 'Reporte Masivo 28', '2026-05-29', '2026-06-05', 1021, 'Usuario Generico 1021', '2026-06-05 12:34:34'),
('tesoreria', 'Reporte Masivo 29', '2026-04-23', '2026-04-30', 1001, 'Usuario Generico 1001', '2026-04-30 04:00:11'),
('tesoreria', 'Reporte Masivo 30', '2026-03-07', '2026-03-14', 1045, 'Usuario Generico 1045', '2026-03-14 01:15:38'),
('ventas', 'Reporte Masivo 31', '2026-03-18', '2026-03-25', 1022, 'Usuario Generico 1022', '2026-03-25 01:48:38'),
('tesoreria', 'Reporte Masivo 32', '2026-03-19', '2026-03-26', 1024, 'Usuario Generico 1024', '2026-03-26 04:08:10'),
('tesoreria', 'Reporte Masivo 33', '2026-03-30', '2026-04-06', 1015, 'Usuario Generico 1015', '2026-04-06 13:53:44'),
('tesoreria', 'Reporte Masivo 34', '2026-05-21', '2026-05-28', 1017, 'Usuario Generico 1017', '2026-05-28 04:36:54'),
('tesoreria', 'Reporte Masivo 35', '2026-05-30', '2026-06-06', 1037, 'Usuario Generico 1037', '2026-06-06 05:13:25'),
('ventas', 'Reporte Masivo 36', '2026-03-22', '2026-03-29', 1010, 'Usuario Generico 1010', '2026-03-29 08:10:12'),
('ventas', 'Reporte Masivo 37', '2026-02-28', '2026-03-07', 1009, 'Usuario Generico 1009', '2026-03-07 04:18:27'),
('tesoreria', 'Reporte Masivo 38', '2026-05-01', '2026-05-08', 1033, 'Usuario Generico 1033', '2026-05-08 20:00:24'),
('ventas', 'Reporte Masivo 39', '2026-02-22', '2026-03-01', 1002, 'Usuario Generico 1002', '2026-03-01 22:55:26'),
('ventas', 'Reporte Masivo 40', '2026-05-08', '2026-05-15', 1043, 'Usuario Generico 1043', '2026-05-15 16:17:52'),
('ventas', 'Reporte Masivo 41', '2026-05-30', '2026-06-06', 1001, 'Usuario Generico 1001', '2026-06-06 20:51:31'),
('ventas', 'Reporte Masivo 42', '2026-04-27', '2026-05-04', 1041, 'Usuario Generico 1041', '2026-05-04 09:32:01'),
('ventas', 'Reporte Masivo 43', '2026-05-11', '2026-05-18', 1012, 'Usuario Generico 1012', '2026-05-18 11:22:34'),
('ventas', 'Reporte Masivo 44', '2026-03-30', '2026-04-06', 1036, 'Usuario Generico 1036', '2026-04-06 19:27:31'),
('ventas', 'Reporte Masivo 45', '2026-04-04', '2026-04-11', 1049, 'Usuario Generico 1049', '2026-04-11 15:24:56'),
('ventas', 'Reporte Masivo 46', '2026-05-29', '2026-06-05', 1019, 'Usuario Generico 1019', '2026-06-05 00:43:35'),
('ventas', 'Reporte Masivo 47', '2026-05-28', '2026-06-04', 1002, 'Usuario Generico 1002', '2026-06-04 20:39:10'),
('tesoreria', 'Reporte Masivo 48', '2026-05-25', '2026-06-01', 1035, 'Usuario Generico 1035', '2026-06-01 00:21:13'),
('tesoreria', 'Reporte Masivo 49', '2026-04-01', '2026-04-08', 1020, 'Usuario Generico 1020', '2026-04-08 04:42:01'),
('tesoreria', 'Reporte Masivo 50', '2026-05-11', '2026-05-18', 1008, 'Usuario Generico 1008', '2026-05-18 05:56:08');

