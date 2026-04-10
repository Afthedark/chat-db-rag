-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: 172.21.22.250    Database: pv_mchicken
-- ------------------------------------------------------
-- Server version	5.7.39-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `actualizaciones`
--

DROP TABLE IF EXISTS `actualizaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `actualizaciones` (
  `actualizacion_id` int(11) NOT NULL AUTO_INCREMENT,
  `numero` int(11) NOT NULL,
  `nombre` varchar(45) NOT NULL,
  `fecha` datetime NOT NULL,
  PRIMARY KEY (`actualizacion_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1 ROW_FORMAT=COMPACT;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ajustes`
--

DROP TABLE IF EXISTS `ajustes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ajustes` (
  `ajuste_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'id de la tabla',
  `sucursal_id` int(11) NOT NULL COMMENT 'id de la sucursal',
  `turno_id` int(11) NOT NULL COMMENT 'id del turno',
  `empleado_id` int(11) NOT NULL COMMENT 'id del empleado',
  `movimiento` varchar(25) NOT NULL COMMENT 'si salida por ajuste, "EN CONTRA" y si es ingreso por ajuste, "A FAVOR"',
  `total` decimal(14,2) DEFAULT NULL COMMENT 'monto total',
  `observaciones` varchar(45) DEFAULT NULL COMMENT 'observaciones',
  `fecha` datetime NOT NULL,
  PRIMARY KEY (`ajuste_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `alm_clientes`
--

DROP TABLE IF EXISTS `alm_clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alm_clientes` (
  `alm_cliente_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador del cliente',
  `nit` char(15) NOT NULL COMMENT 'Numero NIT del cliente para facturacion',
  `nombre_razon_social` char(80) NOT NULL COMMENT 'Nombre o razon social del cliente',
  `direccion` char(80) DEFAULT NULL COMMENT 'Direccion del cliente',
  `telefono` char(15) DEFAULT NULL COMMENT 'telefono del cliente',
  `celular` char(15) DEFAULT NULL COMMENT 'Numero de telefono celular del cliente',
  `contacto` char(80) DEFAULT NULL COMMENT 'Persona de contacto en caso de que la persona sea una empresa',
  `telefono_contacto` char(80) DEFAULT NULL COMMENT 'Telefono de contacto en caso de que la persona sea una empresa',
  `email` char(50) DEFAULT NULL COMMENT 'e-mail',
  `fecha_alta` datetime DEFAULT NULL COMMENT 'Fecha en que fue creado el registro',
  `fecha_ult_modificacion` datetime DEFAULT NULL COMMENT 'Fecha de la ultima modificacion del registro',
  PRIMARY KEY (`nit`) USING BTREE,
  UNIQUE KEY `alm_cliente_id_UNIQUE` (`alm_cliente_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `almacen_pedidos`
--

DROP TABLE IF EXISTS `almacen_pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `almacen_pedidos` (
  `almacen_pedido_id` int(11) NOT NULL AUTO_INCREMENT,
  `almacen_id` int(11) NOT NULL,
  `fecha_alta` datetime DEFAULT NULL,
  `fecha_ult_modificacion` datetime DEFAULT NULL,
  PRIMARY KEY (`almacen_pedido_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1 ROW_FORMAT=COMPACT;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `almacenes`
--

DROP TABLE IF EXISTS `almacenes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `almacenes` (
  `almacen_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador de objeto',
  `codigo` char(20) DEFAULT NULL COMMENT 'Codigo',
  `descripcion` char(80) DEFAULT NULL COMMENT 'Descripcion',
  `es_sucursal` tinyint(1) NOT NULL COMMENT 'Indicador de si es una sucursal o el almacen esta en la central. Para aceso a base de datos local o remota',
  `sucursal_id` int(11) DEFAULT NULL COMMENT 'Identificador de la sucursal donde se encuentra el almacen',
  `fecha_alta` datetime DEFAULT NULL COMMENT 'Fecha en que el registro fue creado',
  `fecha_ult_modificacion` datetime DEFAULT NULL COMMENT 'Fecha de la ultima modificacion del registro',
  PRIMARY KEY (`almacen_id`),
  UNIQUE KEY `almacen_id` (`almacen_id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=94 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `area_produccion`
--

DROP TABLE IF EXISTS `area_produccion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `area_produccion` (
  `area_produccion_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador de la tabla area de produccion',
  `nombre` char(80) NOT NULL COMMENT 'nombre del area de produccion',
  `parent_id` int(11) DEFAULT NULL,
  `sucursal_id` int(11) DEFAULT NULL COMMENT 'Identificador de la sucursal con la que esta relacionada',
  `fecha_alta` datetime DEFAULT NULL COMMENT 'Fecha de alta del registro',
  `fecha_ult_modificacion` datetime DEFAULT NULL COMMENT 'Fecha de ultima modificacion del registro',
  PRIMARY KEY (`area_produccion_id`),
  UNIQUE KEY `area_produccion_id_UNIQUE` (`area_produccion_id`),
  KEY `FK_area_produccion` (`parent_id`),
  KEY `FK_area_produccion_sucursal` (`sucursal_id`),
  CONSTRAINT `FK_area_produccion` FOREIGN KEY (`parent_id`) REFERENCES `area_produccion` (`area_produccion_id`),
  CONSTRAINT `FK_area_produccion_sucursal` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`sucursal_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cajas`
--

DROP TABLE IF EXISTS `cajas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cajas` (
  `caja_id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(15) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `sucursal_id` int(11) DEFAULT NULL COMMENT 'Identificador de la sucursal en la que se encuentra la caja',
  `fecha_alta` datetime DEFAULT NULL,
  `fecha_ult_modificacion` datetime DEFAULT NULL,
  PRIMARY KEY (`caja_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cierreoperacionessistemas`
--

DROP TABLE IF EXISTS `cierreoperacionessistemas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cierreoperacionessistemas` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigomodalidad` int(1) NOT NULL COMMENT ' 1 - ELECTRONICA EN LINEA          2 - COMPUTARIZADA EN LINEA',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `cliente_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador del cliente',
  `codigotipodocumentoidentidad` int(1) NOT NULL DEFAULT '5' COMMENT 'codigo tipo documento identidad',
  `nit` varchar(20) NOT NULL COMMENT 'Numero documento del cliente para facturacion',
  `complemento` varchar(5) NOT NULL DEFAULT '' COMMENT 'complemento del ci',
  `nombre_razon_social` varchar(500) NOT NULL COMMENT 'Nombre o razon social del cliente',
  `direccion` char(150) DEFAULT NULL COMMENT 'Direccion del cliente',
  `telefono` char(70) DEFAULT NULL COMMENT 'telefono del cliente',
  `celular` char(70) DEFAULT NULL COMMENT 'Numero de telefono celular del cliente',
  `contacto` char(150) DEFAULT NULL COMMENT 'Persona de contacto en caso de que la persona sea una empresa',
  `telefono_contacto` char(70) DEFAULT NULL COMMENT 'Telefono de contacto en caso de que la persona sea una empresa',
  `email` char(100) DEFAULT NULL COMMENT 'e-mail',
  `tipo_precio` int(11) DEFAULT '-1' COMMENT 'Tipo de precio con el que trabajara el PV 0/1/2/3 (principal/opcion1/opcion2/opcion3)',
  `observaciones` text COMMENT 'Observaciones',
  `fecha_alta` datetime DEFAULT NULL,
  `fecha_ult_modificacion` datetime DEFAULT NULL,
  PRIMARY KEY (`cliente_id`),
  UNIQUE KEY `Idx_nit` (`nit`,`complemento`)
) ENGINE=InnoDB AUTO_INCREMENT=8587 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `combos`
--

DROP TABLE IF EXISTS `combos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `combos` (
  `combo_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador del Combo',
  `lin_factura_id` int(11) NOT NULL COMMENT 'Identificador del item, una linea en la factura',
  `item_id` int(11) NOT NULL COMMENT 'Identificador del item especifico que forma parte del combo',
  `cantidad` decimal(14,6) NOT NULL COMMENT 'Cantidad',
  `precio_unitario` decimal(14,2) NOT NULL COMMENT 'precio_unitario',
  `total` decimal(14,2) NOT NULL COMMENT 'Totalde la linea',
  PRIMARY KEY (`combo_id`),
  KEY `FK_combo_item` (`item_id`),
  KEY `FK_combo_lin_fac` (`lin_factura_id`),
  CONSTRAINT `FK_combo_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`),
  CONSTRAINT `FK_combo_lin_fac` FOREIGN KEY (`lin_factura_id`) REFERENCES `lin_facturas` (`lin_factura_id`)
) ENGINE=InnoDB AUTO_INCREMENT=219776 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `concepto_cajas`
--

DROP TABLE IF EXISTS `concepto_cajas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `concepto_cajas` (
  `concepto_caja_id` int(11) NOT NULL AUTO_INCREMENT,
  `concepto` varchar(80) NOT NULL,
  `cuenta_1` varchar(20) DEFAULT NULL,
  `cuenta_2` varchar(20) DEFAULT NULL,
  `tipo` varchar(10) DEFAULT NULL,
  `sucursal` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_alta` datetime DEFAULT NULL,
  `fecha_ult_modificacion` datetime DEFAULT NULL,
  `codigo` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`concepto_caja_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `config`
--

DROP TABLE IF EXISTS `config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `config` (
  `conf_id` int(11) NOT NULL,
  `sucursal_id` int(11) NOT NULL COMMENT 'identificador de la sucursal donde se usa el sistema',
  `almacen_id` int(11) NOT NULL COMMENT 'identificador del almacen de la tienda del sistema',
  `caja_id` int(11) NOT NULL COMMENT 'Identificador de la caja en la sucursal (utilizada para turnos)',
  `tipo_precio` int(11) NOT NULL COMMENT 'Tipo de precio con el que trabajara el PV 0/1/2/3 (principal/opcion1/opcion2/opcion3)',
  `ciudad` varchar(45) DEFAULT NULL COMMENT 'Municipio',
  `direccion` varchar(500) DEFAULT NULL,
  `telefonos` varchar(45) DEFAULT NULL,
  `nombre_empresa` varchar(200) DEFAULT NULL COMMENT 'Nombre razon social de la Empresa',
  `factura` tinyint(1) DEFAULT '0',
  `datos_sucursal` varchar(45) DEFAULT NULL COMMENT 'Datos de la sucursal para su impresion en la factura',
  `actividad` text COMMENT 'Actividad economica de la empresa',
  `nit` bigint(13) DEFAULT NULL COMMENT 'Nit del emisor',
  `municipio` varchar(25) DEFAULT NULL,
  `codigoSistema` varchar(100) DEFAULT NULL COMMENT 'codigo del sistema otorgado por impuestos',
  `codigoAmbiente` int(1) DEFAULT NULL COMMENT 'codigo ambiente 1 - produccion, 2 - pruebas',
  `codigoModalidad` int(1) DEFAULT NULL COMMENT 'codigo modalidad 1 - electronica, 2 - computarizada',
  `codigoSucursal` int(4) DEFAULT NULL COMMENT 'codigo sucursal, 0 casa matriz',
  `codigoPuntoVenta` int(4) DEFAULT NULL COMMENT 'codigo punto de venta, 0 en caso contrario',
  `logo` mediumblob COMMENT 'logo',
  `datossiatgeneral_id` int(11) DEFAULT NULL COMMENT 'id de la tabla daossiatgenerales',
  `token` text COMMENT 'token para generar el cuis',
  `email` varchar(100) DEFAULT NULL COMMENT 'email propio',
  `email_password` varchar(45) DEFAULT NULL COMMENT 'Valido para gmail',
  `dir_node` varchar(200) DEFAULT NULL,
  `turnos` tinyint(1) DEFAULT '0' COMMENT 'Para saber si habra impresion de numero de turnos',
  `actividad_rel` int(1) DEFAULT '1' COMMENT 'actividad relacionada, 1 - principal, 2 - actividad 2, 3 - actividad 3',
  `descuento` decimal(14,2) DEFAULT '0.00',
  `menu` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`conf_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `convenios`
--

DROP TABLE IF EXISTS `convenios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `convenios` (
  `convenio_id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(15) DEFAULT NULL,
  `porcentaje` decimal(14,2) DEFAULT '0.00',
  `fecha_alta` datetime DEFAULT NULL,
  `fecha_ult_modificacion` datetime DEFAULT NULL,
  PRIMARY KEY (`convenio_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1 ROW_FORMAT=COMPACT;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cufds`
--

DROP TABLE IF EXISTS `cufds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cufds` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigomodalidad` int(1) NOT NULL COMMENT ' 1 - ELECTRONICA EN LINEA          2 - COMPUTARIZADA EN LINEA',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `codigo` varchar(100) DEFAULT NULL COMMENT 'codigo CUFD de respuesta',
  `codigoControl` varchar(200) DEFAULT NULL COMMENT 'codigo de control de respuesta',
  `direccion` varchar(500) DEFAULT NULL COMMENT 'codigo CUFD de respuesta',
  `fechavigencia` timestamp NULL DEFAULT NULL COMMENT 'fecha limite de vigencia del cufd',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=297 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cuis`
--

DROP TABLE IF EXISTS `cuis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuis` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigomodalidad` int(1) NOT NULL COMMENT ' 1 - ELECTRONICA EN LINEA          2 - COMPUTARIZADA EN LINEA',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'C DIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `codigo` varchar(100) DEFAULT NULL COMMENT 'codigo de respuesta',
  `fechavigencia` timestamp NULL DEFAULT NULL COMMENT 'fecha limite de vigencia del cuis',
  `vigente` tinyint(4) DEFAULT '0' COMMENT 'Si el cuis esta vigente',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `datossiatgenerales`
--

DROP TABLE IF EXISTS `datossiatgenerales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `datossiatgenerales` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `apikey` text NOT NULL COMMENT 'token',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigomodalidad` int(1) NOT NULL COMMENT ' 1 - ELECTRONICA EN LINEA          2 - COMPUTARIZADA EN LINEA',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'C DIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `cuis` varchar(100) DEFAULT NULL COMMENT 'codigo cuis',
  `fechavigencia_cuis` timestamp NULL DEFAULT NULL COMMENT 'fecha limite de vigencia del cuis',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cufd` varchar(100) DEFAULT NULL COMMENT 'codigo cufd',
  `codigocontrol_cufd` varchar(200) DEFAULT NULL COMMENT 'codigo de control del cufd de respuesta',
  `fechafin_cufd` timestamp NULL DEFAULT NULL COMMENT 'fecha final del ultimo cufd',
  `contingencia` tinyint(1) DEFAULT '0' COMMENT 'Saber si estamos con alguna contingencia, facturacion en linea o fuera de linea',
  `estado` varchar(15) DEFAULT NULL COMMENT 'estado del sistema (VIGENTE/CERRADO)....',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `empleados`
--

DROP TABLE IF EXISTS `empleados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empleados` (
  `empleado_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identficador de objeto',
  `codigo` char(20) NOT NULL COMMENT 'Codigo empleado',
  `cargo` char(20) DEFAULT NULL COMMENT 'Cargo',
  `cedula_identidad` char(15) DEFAULT NULL COMMENT 'Carnet de identidad',
  `departamento` char(20) DEFAULT NULL COMMENT 'Departamento',
  `telefono_domicilio` char(15) DEFAULT NULL COMMENT 'Telefono domicilio',
  `telefono_movil` char(15) DEFAULT NULL COMMENT 'Teléfno movil',
  `direccion_domicilio` char(80) DEFAULT NULL COMMENT 'Dirección domicilio',
  `fecha_nacimiento` date DEFAULT NULL COMMENT 'Fecha de nacimiento',
  `lugar_nacimiento` char(20) DEFAULT NULL COMMENT 'lugar de nacimiento',
  `nacionalidad` char(20) DEFAULT NULL COMMENT 'Nacionalidad',
  `profesion` char(20) DEFAULT NULL COMMENT 'Profesión',
  `afp` char(20) DEFAULT NULL COMMENT 'AFP',
  `banco_asignado` char(20) DEFAULT NULL COMMENT 'Banco asignado',
  `numero_cta_bancaria` char(20) DEFAULT NULL COMMENT 'Numero de cuenta bancaria',
  `codigo_seguro` char(15) DEFAULT NULL COMMENT 'Codigo de seguro social',
  `fecha_ingreso` date DEFAULT NULL COMMENT 'Fecha de ingreso',
  `fecha_retiro` date DEFAULT NULL COMMENT 'Fecha de retiro',
  `sexo` char(15) DEFAULT NULL COMMENT 'Sexo',
  `estado_civil` char(15) DEFAULT NULL COMMENT 'Estado civil',
  `grupo_sanguineo` char(20) DEFAULT NULL,
  `email` char(80) DEFAULT NULL COMMENT 'Email',
  `garante` char(60) DEFAULT NULL COMMENT 'Grante',
  `direccion_garante` char(60) DEFAULT NULL COMMENT 'Direccion del garante',
  `telefono_garante` char(20) DEFAULT NULL COMMENT 'Telefono garante',
  `nombres` char(50) DEFAULT NULL COMMENT 'Nombres',
  `apaterno` char(20) DEFAULT NULL COMMENT 'Apellido Paterno',
  `amaterno` char(20) DEFAULT NULL COMMENT 'Apellido Materno',
  `acasada` char(20) DEFAULT NULL COMMENT 'Apellido de casada',
  `fecha_alta` datetime DEFAULT NULL COMMENT 'Fecha en que el registro fue creado',
  `fecha_ult_modificacion` datetime DEFAULT NULL COMMENT 'Fecha de la ultima modificacion del registro',
  `dir_foto` char(50) DEFAULT NULL COMMENT 'Direccion de la foto en el disco duro',
  `dir_croquis` char(50) DEFAULT NULL COMMENT 'Direccion del croquis en el disco duro',
  `sueldo_basico` decimal(14,2) DEFAULT '0.00' COMMENT 'Sueldo basico',
  `horario_id` int(11) DEFAULT NULL COMMENT 'Horario en el que trabaja',
  `ext_ci` varchar(3) DEFAULT NULL COMMENT 'Extension del carnet de identidad',
  `num_rel_biometrico` int(11) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1' COMMENT 'Si el empleado esta activo o no',
  PRIMARY KEY (`empleado_id`),
  UNIQUE KEY `empleado_id` (`empleado_id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=210 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `facturas`
--

DROP TABLE IF EXISTS `facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facturas` (
  `factura_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador de registro',
  `cliente_id` int(11) DEFAULT NULL COMMENT 'Identificador del cliente que realiza la compra',
  `observaciones` text COMMENT 'observaciones',
  `estado` varchar(15) NOT NULL COMMENT 'Estado de la factura (VALIDADA/ANULADA)',
  `numero_ticket` int(11) DEFAULT NULL COMMENT 'Nuero de ticket para atencion',
  `numero_mesa` varchar(25) DEFAULT NULL COMMENT 'Numero de mesa para atencion',
  `sub_total` decimal(17,2) DEFAULT '0.00' COMMENT 'Sub total',
  `descuento` decimal(17,2) DEFAULT '0.00' COMMENT 'Descuento',
  `total` decimal(17,2) DEFAULT '0.00' COMMENT 'Total = Subtotal - descuento',
  `a_cuenta` decimal(17,2) DEFAULT '0.00' COMMENT 'A cuenta, total pagado',
  `saldo` decimal(17,2) DEFAULT '0.00' COMMENT 'Saldo pendiente',
  `credito_empleado_id` int(11) DEFAULT '0' COMMENT 'Venta a credito a empleado de la empresa',
  `empleado_id` int(11) DEFAULT NULL COMMENT 'Identificador del empleado',
  `cajero_id` int(11) DEFAULT NULL COMMENT 'Identificador del cajero que esta de turno',
  `a_cuenta_pedido` decimal(17,2) DEFAULT '0.00',
  `tipo` char(15) DEFAULT NULL COMMENT 'Tipo Cobro (CONTADO/CREDITO)',
  `cupon_tarjeta` varchar(45) DEFAULT NULL COMMENT 'Tarjeta de Credito, cupon',
  `monto_tarjeta` decimal(17,2) DEFAULT '0.00' COMMENT 'Tarjeta de Credito, monto',
  `plan_tarjeta` varchar(45) DEFAULT NULL COMMENT 'Tarjeta de Credito, plan',
  `almacen_id` int(11) DEFAULT NULL COMMENT 'Identificador de la tienda',
  `tipo_pago` varchar(150) DEFAULT NULL COMMENT 'Forma de pago (EFECTIVO/TARJETA)',
  `efectivo` decimal(17,2) DEFAULT '0.00',
  `cambio` decimal(17,2) DEFAULT '0.00',
  `factura` tinyint(1) DEFAULT NULL,
  `turno_id` int(11) DEFAULT NULL,
  `promocion` tinyint(1) DEFAULT '0' COMMENT 'Promocion',
  `entrega` varchar(10) DEFAULT NULL COMMENT 'Pedido para (ENVIAR/RECOGER)',
  `pedido_id` int(11) DEFAULT NULL COMMENT 'Nro. de pedido que genero la venta',
  `propina` decimal(14,2) DEFAULT '0.00' COMMENT 'Monto de la Propina',
  `convenio_id` int(11) DEFAULT NULL COMMENT 'Convenio (delivery)',
  `numero_turno` int(11) DEFAULT NULL COMMENT 'numero de turno',
  `nitemisor` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `razonSocialEmisor` varchar(200) NOT NULL COMMENT 'razon Social del Emisor',
  `municipio` varchar(25) NOT NULL COMMENT 'municipio',
  `telefono` varchar(25) DEFAULT NULL COMMENT 'telefono',
  `numeroFactura` int(10) NOT NULL COMMENT 'numero de factura',
  `cuf` varchar(100) NOT NULL COMMENT 'codigo cuf',
  `cufd` varchar(100) NOT NULL COMMENT 'codigo cufd',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `direccion` varchar(500) NOT NULL COMMENT 'direccion',
  `codigopuntoventa` int(4) NOT NULL DEFAULT '0' COMMENT 'codigo 0 - 1 ...',
  `fechaEmision` timestamp NULL DEFAULT NULL COMMENT 'fecha emision de la factura',
  `nombreRazonSocial` varchar(500) DEFAULT NULL COMMENT 'nombreRazonSocial cliente',
  `codigoTipoDocumentoIdentidad` int(1) NOT NULL COMMENT 'codigoTipoDocumentoIdentidad',
  `numeroDocumento` varchar(20) NOT NULL COMMENT 'numero de Documento',
  `complemento` varchar(5) DEFAULT NULL COMMENT 'complemento',
  `codigoCliente` varchar(100) NOT NULL COMMENT 'codigo de Cliente',
  `codigoMetodoPago` int(2) NOT NULL COMMENT 'codigo Metodo Pago',
  `numeroTarjeta` bigint(16) DEFAULT NULL COMMENT 'numero de Tarjeta',
  `montoTotal` decimal(17,2) NOT NULL DEFAULT '0.00' COMMENT 'monto Total',
  `montoTotalSujetoIva` decimal(17,2) NOT NULL DEFAULT '0.00' COMMENT 'monto Total Sujeto a Iva',
  `codigoMoneda` int(3) NOT NULL DEFAULT '1' COMMENT 'codigo de Moneda',
  `tipoCambio` decimal(17,2) NOT NULL DEFAULT '1.00' COMMENT 'tipoCambio',
  `montoTotalMoneda` decimal(17,2) NOT NULL DEFAULT '0.00' COMMENT 'monto Total Moneda',
  `montoGiftCard` decimal(17,2) DEFAULT '0.00' COMMENT 'monto Gift Card',
  `descuentoAdicional` decimal(17,2) DEFAULT '0.00' COMMENT 'descuento Adicional',
  `codigoExcepcion` tinyint(1) DEFAULT NULL COMMENT 'codigo de Excepcion',
  `cafc` varchar(50) DEFAULT NULL COMMENT 'cafc',
  `leyenda` varchar(200) NOT NULL COMMENT 'leyenda',
  `usuario` varchar(100) NOT NULL COMMENT 'usuario',
  `codigoDocumentoSector` int(1) NOT NULL COMMENT 'codigo Documento Sector',
  `codigorecepcion` varchar(200) DEFAULT NULL COMMENT 'codigo de recepcion',
  `codigoModalidad` int(1) NOT NULL DEFAULT '2' COMMENT 'codigo modalidad 1 electronica, 2 computarizada',
  `codigoevento` int(11) DEFAULT NULL COMMENT 'Para el caso de facturas fuera de linea, el codigo del evento del registro del evento sisgnificativo',
  `paquetenum` int(11) DEFAULT NULL COMMENT 'en caso de que se envie por paquete, es el numero de factura dentro el paquete',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`factura_id`)
) ENGINE=InnoDB AUTO_INCREMENT=32000 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `formularios`
--

DROP TABLE IF EXISTS `formularios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `formularios` (
  `formulario_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID de formularios',
  `nombre` char(50) NOT NULL COMMENT 'Nombre del formulario',
  `descripcion` char(50) DEFAULT NULL COMMENT 'Descripcion del Formulario',
  `identificador` int(11) NOT NULL COMMENT 'Identificador del formulario',
  `relacionador` int(11) NOT NULL COMMENT 'Apunta al identificador',
  `action` char(50) DEFAULT NULL COMMENT 'nombre en el action manager',
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`formulario_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=latin1 COMMENT='lista de formularios';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gestiones`
--

DROP TABLE IF EXISTS `gestiones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gestiones` (
  `gestion_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '''Identificador de registro''',
  `fecha_inicio` datetime NOT NULL COMMENT 'Fecha en la que se inicia la gestion',
  `fecha_final` datetime NOT NULL COMMENT 'Fecha en la que finaliza la gestion',
  `gestion` int(11) NOT NULL COMMENT 'Gestion. numero entero 2009, 2010, ...',
  `base_dato_id` int(11) DEFAULT NULL COMMENT 'Id de base de datos',
  PRIMARY KEY (`gestion_id`),
  UNIQUE KEY `Idx_gestion` (`gestion`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `grupo_productos`
--

DROP TABLE IF EXISTS `grupo_productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grupo_productos` (
  `grupo_producto_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador del grupo',
  `descripcion` varchar(30) NOT NULL COMMENT 'Descripcion del grupo (Empanadas/Helados/...)',
  `fecha_alta` datetime DEFAULT NULL COMMENT 'Fecha en que el registro fue creado',
  `fecha_ult_modificacion` datetime DEFAULT NULL COMMENT 'Fecha de la ultima modificacion del registro',
  `orden` int(11) DEFAULT '0' COMMENT 'Orden de aparicion en el formulario de ventas',
  `actividad_rel` int(1) DEFAULT '1' COMMENT 'actividad relacionada 1,2 o 3',
  PRIMARY KEY (`grupo_producto_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador de registro',
  `unidad_medida_id` int(11) NOT NULL,
  `ubicacion_id` int(11) DEFAULT NULL,
  `codigo` char(20) NOT NULL COMMENT 'Codigo del item',
  `descripcion` char(150) DEFAULT NULL COMMENT 'Descripcion',
  `costo` decimal(14,6) DEFAULT NULL COMMENT 'Precio de costo',
  `cantidad_maxima` decimal(14,6) DEFAULT NULL COMMENT 'Cantidad máxima',
  `cantidad_minima` decimal(14,6) DEFAULT NULL COMMENT 'Cantiad Mínima',
  `categoria` varchar(50) DEFAULT NULL COMMENT 'Categoria',
  `almacenable` tinyint(1) DEFAULT NULL COMMENT 'Almacenable',
  `precio_compra` decimal(14,6) DEFAULT NULL COMMENT 'Precio de compra',
  `precio_venta` decimal(14,2) DEFAULT NULL COMMENT 'Precio de venta',
  `fecha_alta` datetime DEFAULT NULL COMMENT 'Fecha de alta',
  `fecha_ult_modificacion` datetime DEFAULT NULL COMMENT 'Fecha de última modificacion',
  `fecha_baja` date DEFAULT NULL COMMENT 'Fecha de baja',
  `fecha_activacion` date DEFAULT NULL COMMENT 'Fecha de activacion',
  `vida_util` int(11) DEFAULT NULL COMMENT 'Vida util',
  `tipo_item_id` int(11) NOT NULL COMMENT 'Identificador tipo de item',
  `ice` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica si el item tiene impuesto al consumo especifico ICE',
  `litros_por_unidad` decimal(14,6) DEFAULT '0.000000' COMMENT 'Cantidad de litros por unidad si el item tiene ICE',
  `grupo_producto_id` int(11) DEFAULT NULL COMMENT 'Grupo del producto terminado',
  `foto` mediumblob COMMENT 'Foto del producto terminado',
  `color` int(11) DEFAULT NULL COMMENT 'Color del producto terminado',
  `precio_venta_opcion1` decimal(14,2) DEFAULT NULL COMMENT 'Precio venta de productos terminados - opcion1',
  `precio_venta_opcion2` decimal(14,2) DEFAULT NULL COMMENT 'Precio venta de productos terminados - opcion2',
  `precio_venta_opcion3` decimal(14,2) DEFAULT NULL COMMENT 'Precio venta de productos terminados - opcion3',
  `mixto` tinyint(1) DEFAULT '0' COMMENT 'Si producto terminado es mixto o no',
  `saldo` decimal(14,6) DEFAULT '0.000000',
  `mixto_fijo` tinyint(1) DEFAULT '0' COMMENT 'Producto Mixto (Combo) con cantidades fijas',
  `desc_larga` text COMMENT 'Descripcion larga del producto',
  `ctrl_saldo` tinyint(1) DEFAULT '0' COMMENT 'Verifica si el item controla saldo',
  `seccion_id` int(11) DEFAULT NULL COMMENT 'Seccion en la cual se imprimira el item',
  `restringir_venta` tinyint(1) DEFAULT '0' COMMENT 'no permitir realizar una venta de este producto (formulario de ventas)',
  `cant_mixto` decimal(14,3) DEFAULT NULL COMMENT 'Cantidad establecida para mixtos',
  `reg_nuevo_id` int(11) DEFAULT NULL COMMENT 'Id del empleado que creo un nuevo registro',
  `reg_mod_id` int(11) DEFAULT NULL COMMENT 'Id del ultimo empleado que modifica el registro',
  `codigoActividad` int(11) DEFAULT NULL COMMENT 'codigoActividad del siat',
  `codigoProducto` int(11) DEFAULT NULL COMMENT 'codigoProducto del siat',
  `codigoUnidad` int(11) DEFAULT NULL COMMENT 'Unidad de medida de acuerdo al SIAT',
  PRIMARY KEY (`item_id`),
  UNIQUE KEY `item_id` (`item_id`),
  UNIQUE KEY `codigo` (`codigo`),
  UNIQUE KEY `idx_codigo` (`codigo`),
  KEY `AI_item_id` (`item_id`),
  KEY `idx_descripcion` (`descripcion`),
  KEY `tipo_item_id` (`tipo_item_id`),
  CONSTRAINT `items_ibfk_3` FOREIGN KEY (`tipo_item_id`) REFERENCES `tipo_items` (`tipo_item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1054 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kardex_tiendas`
--

DROP TABLE IF EXISTS `kardex_tiendas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kardex_tiendas` (
  `kardex_tienda_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador de registro',
  `sucursal_id` int(11) NOT NULL COMMENT 'Identificador de la sucursal',
  `almacen_id` int(11) NOT NULL COMMENT 'Identificador del almacen de la tienda',
  `numero_documento` int(11) DEFAULT NULL COMMENT 'Numero de documento',
  `fecha` datetime NOT NULL COMMENT 'Fecha de la operacion',
  `tipo_movimiento_id` int(11) NOT NULL COMMENT 'Identficador del tipo de movimiento',
  `glosa` char(80) DEFAULT NULL COMMENT 'Glosa',
  `estado` char(15) NOT NULL COMMENT 'Estado de la operacion (REGISTRADO/PROCESADO/ANULADO)',
  `almacen_rel_id` int(11) DEFAULT NULL COMMENT 'Identificador del almacen que envia a o recibe en la operacion',
  `rel_movimiento_id` int(11) DEFAULT NULL COMMENT 'Identificador del movimiento de almacen con el que esta relacionada la operacion',
  `num_docto_rel` int(11) DEFAULT NULL COMMENT 'Numero de documento del movimiento de almacen que envio los productos',
  `empleado_id` int(11) DEFAULT NULL COMMENT 'Identificador del empleado que realizo la operacion',
  `area_produccion_id` int(11) DEFAULT NULL,
  `estado_envio` char(15) DEFAULT NULL COMMENT 'Estado del envio a otra sucursal (ENVIADO/RECIBIDO)',
  `turno_id` int(11) DEFAULT NULL COMMENT 'Identificador del turno actual',
  `autorizado_empleado_id` int(11) DEFAULT NULL COMMENT 'Empleado que autoriza',
  `vendido_empleado_id` int(11) DEFAULT NULL COMMENT 'Empleado al que se le esta vendiendo',
  PRIMARY KEY (`kardex_tienda_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2175 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lin_ajustes`
--

DROP TABLE IF EXISTS `lin_ajustes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lin_ajustes` (
  `lin_ajuste_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'id de la tabla',
  `ajuste_id` int(11) DEFAULT NULL COMMENT 'id de la tabla maestro ajustes',
  `item_id` int(11) DEFAULT NULL COMMENT 'id del item',
  `cantidad` decimal(14,6) DEFAULT NULL COMMENT 'cantidad',
  `precio_unitario` decimal(14,2) DEFAULT NULL COMMENT 'precio unitario',
  `total` decimal(14,2) DEFAULT NULL COMMENT 'total',
  PRIMARY KEY (`lin_ajuste_id`),
  KEY `fk_lin_ajustes_1` (`ajuste_id`),
  CONSTRAINT `fk_lin_ajustes_1` FOREIGN KEY (`ajuste_id`) REFERENCES `ajustes` (`ajuste_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lin_facturas`
--

DROP TABLE IF EXISTS `lin_facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lin_facturas` (
  `lin_factura_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador del registro',
  `factura_id` int(11) NOT NULL COMMENT 'Identificador de la factura',
  `item_id` int(11) NOT NULL COMMENT 'Identificador del item',
  `cantidad` decimal(17,2) NOT NULL COMMENT 'Cantidad',
  `precio_unitario` decimal(17,2) NOT NULL COMMENT 'Precio del item',
  `total` decimal(17,2) NOT NULL COMMENT 'Total',
  `observaciones` varchar(500) DEFAULT NULL COMMENT 'Observaciones',
  `mixto` tinyint(1) DEFAULT '0' COMMENT 'El producto es mixto',
  `descuento` decimal(17,2) DEFAULT '0.00' COMMENT 'Descuento en el producto',
  `llevar` tinyint(1) DEFAULT '0' COMMENT 'Si es para llevar',
  `mixto_fijo` tinyint(1) DEFAULT '0' COMMENT 'Producto mixto con cantidades fijas',
  `actividadEconomica` varchar(10) NOT NULL,
  `codigoProductoSin` int(11) NOT NULL,
  `codigoProducto` varchar(50) NOT NULL,
  `descripcion` varchar(500) NOT NULL,
  `unidadMedida` int(11) NOT NULL,
  `numeroserie` varchar(1500) DEFAULT NULL COMMENT 'numero Serie',
  `numeroimei` varchar(1500) DEFAULT NULL COMMENT 'numero Imei',
  `venta_id` int(11) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`lin_factura_id`),
  KEY `FK_fac_item` (`item_id`),
  KEY `FK_lin_fac` (`factura_id`),
  CONSTRAINT `FK_fac_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`),
  CONSTRAINT `FK_lin_fac` FOREIGN KEY (`factura_id`) REFERENCES `facturas` (`factura_id`)
) ENGINE=InnoDB AUTO_INCREMENT=57340 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lin_items`
--

DROP TABLE IF EXISTS `lin_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lin_items` (
  `lin_items_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador de tabla lin_items',
  `item_id` int(11) NOT NULL COMMENT 'Item_id identificador de la tabla maestro',
  `item_rel_id` int(11) NOT NULL COMMENT 'item_id relacionado, sirve para crear combos para productos terminados',
  `fecha_alta` datetime DEFAULT NULL COMMENT 'Fecha de alta del registro',
  `fecha_ult_modificacion` datetime DEFAULT NULL COMMENT 'Fecha de ultima modificacion del registro',
  `cantidad` decimal(14,6) DEFAULT NULL COMMENT 'Cantidad fijada para producto mixto (combo)',
  `precio` decimal(14,2) DEFAULT NULL,
  `fijo` tinyint(1) DEFAULT '0' COMMENT 'si es un producto fijo si/no',
  PRIMARY KEY (`lin_items_id`),
  UNIQUE KEY `lin_items_id_UNIQUE` (`lin_items_id`),
  KEY `fk_lin_item` (`item_id`),
  CONSTRAINT `fk_lin_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2790 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lin_kardex_tiendas`
--

DROP TABLE IF EXISTS `lin_kardex_tiendas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lin_kardex_tiendas` (
  `lin_kardex_tienda_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador del registro',
  `kardex_tienda_id` int(11) NOT NULL COMMENT 'Identificador del kardex de tienda',
  `item_id` int(11) NOT NULL COMMENT 'Identificador del item',
  `cantidad` decimal(14,6) DEFAULT NULL COMMENT 'Cantidad . Cuando la operacion es una ransferencia IN-TRANSF, es la cantidad recibida efectivamente',
  `cantidad_enviada` decimal(14,6) DEFAULT NULL COMMENT 'Cantidad enviada cuando la operacion es una transferencia dese otro almacen',
  `proceso_id` int(11) DEFAULT NULL COMMENT 'Identificador del proceso que envia el item',
  `lote` int(11) DEFAULT NULL COMMENT 'Numero de lote (numero_proceso) cuando envian de produccion',
  `fecha_prod` date DEFAULT NULL COMMENT 'Fecha Produccion',
  `vida_util` int(11) DEFAULT NULL COMMENT 'Vida util del producto',
  PRIMARY KEY (`lin_kardex_tienda_id`),
  KEY `FK_Idx_kar` (`kardex_tienda_id`),
  CONSTRAINT `FK_Idx_kar` FOREIGN KEY (`kardex_tienda_id`) REFERENCES `kardex_tiendas` (`kardex_tienda_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11940 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lin_mesas`
--

DROP TABLE IF EXISTS `lin_mesas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lin_mesas` (
  `lin_mesa_id` int(11) NOT NULL AUTO_INCREMENT,
  `mesa_id` int(11) DEFAULT NULL,
  `mesa` varchar(10) NOT NULL,
  `pedido_id` int(11) DEFAULT NULL COMMENT 'Pedido con el cual esta relacionado',
  `estado` varchar(1) DEFAULT 'L' COMMENT 'Estado de la mesa, A atencion, L libre',
  PRIMARY KEY (`lin_mesa_id`),
  UNIQUE KEY `mesa_UNIQUE` (`mesa`),
  KEY `fk_seccion` (`mesa_id`),
  CONSTRAINT `fk_seccion` FOREIGN KEY (`mesa_id`) REFERENCES `mesas` (`mesa_id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lin_pedidos`
--

DROP TABLE IF EXISTS `lin_pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lin_pedidos` (
  `lin_pedido_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador de la tabla',
  `pedido_id` int(11) NOT NULL COMMENT 'Identificador de la tabla maestro',
  `item_id` int(11) DEFAULT NULL COMMENT 'Identificador del item',
  `cantidad` decimal(14,2) DEFAULT NULL COMMENT 'Cantidad',
  `precio_unitario` decimal(14,2) DEFAULT NULL COMMENT 'Precio unitario',
  `total` decimal(14,2) DEFAULT NULL COMMENT 'Total',
  `mixto` tinyint(1) DEFAULT '0' COMMENT 'El producto es mixto',
  `descuento` decimal(14,2) DEFAULT NULL,
  `mixto_fijo` tinyint(1) DEFAULT '0' COMMENT 'Producto mixto con cantidades fijas',
  `enviado` tinyint(1) DEFAULT NULL COMMENT 'Enviado el pedido (si/no)',
  `cant_total` decimal(14,2) DEFAULT '0.00' COMMENT 'Cantidad de productos que habia originalmente',
  `observaciones` varchar(500) DEFAULT NULL,
  `numeroserie` varchar(1500) DEFAULT NULL,
  `numeroimei` varchar(1500) DEFAULT NULL,
  `llevar` tinyint(1) DEFAULT '0' COMMENT 'Es un producto para llevar si/no',
  `hora_inicio` datetime DEFAULT NULL COMMENT 'Feha hora de inicio del pedido',
  `hora_fin` datetime DEFAULT NULL COMMENT 'Fecha hora final de atencion del pedido',
  `estado` varchar(10) DEFAULT 'PENDIENTE' COMMENT 'Estado del pedido (PENDIENTE/CONCLUIDO)',
  PRIMARY KEY (`lin_pedido_id`),
  KEY `fk_pedido` (`pedido_id`),
  CONSTRAINT `fk_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`pedido_id`)
) ENGINE=InnoDB AUTO_INCREMENT=57537 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lin_pedidos_combos`
--

DROP TABLE IF EXISTS `lin_pedidos_combos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lin_pedidos_combos` (
  `lin_pedido_combo_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador de la tabla',
  `lin_pedido_id` int(11) NOT NULL COMMENT 'Identificador de la tabla padre',
  `item_id` int(11) NOT NULL COMMENT 'Identificador del item',
  `cantidad` decimal(14,6) DEFAULT NULL COMMENT 'Cantidad',
  `precio_unitario` decimal(14,2) DEFAULT NULL COMMENT 'Precio unitario',
  `total` decimal(14,2) DEFAULT NULL COMMENT 'Total',
  PRIMARY KEY (`lin_pedido_combo_id`),
  KEY `fk_pedido_combo` (`lin_pedido_id`),
  CONSTRAINT `fk_pedido_combo` FOREIGN KEY (`lin_pedido_id`) REFERENCES `lin_pedidos` (`lin_pedido_id`)
) ENGINE=InnoDB AUTO_INCREMENT=220551 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `link_sucursales`
--

DROP TABLE IF EXISTS `link_sucursales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `link_sucursales` (
  `sucursal_id` int(11) NOT NULL,
  PRIMARY KEY (`sucursal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `listaventas`
--

DROP TABLE IF EXISTS `listaventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `listaventas` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador',
  `fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `tipoDocumento` int(1) NOT NULL DEFAULT '5' COMMENT 'codigo tipo documento identidad',
  `numeroDocumento` varchar(20) NOT NULL COMMENT 'Numero documento del cliente para facturacion',
  `complemento` varchar(5) NOT NULL DEFAULT '' COMMENT 'complemento del ci',
  `nombre_razon_social` varchar(500) NOT NULL COMMENT 'Nombre o razon social del cliente',
  `item_id` int(11) NOT NULL,
  `codigo` varchar(20) DEFAULT NULL COMMENT 'codigo del item',
  `descripcion` varchar(150) DEFAULT NULL COMMENT 'Descripcion del item',
  `numeroVenta` int(10) NOT NULL COMMENT 'numero de venta',
  `cantidad` decimal(14,2) NOT NULL COMMENT 'cantidad',
  `precioUnitario` decimal(14,2) NOT NULL DEFAULT '0.00' COMMENT 'precio unitario',
  `descuento` decimal(14,2) NOT NULL DEFAULT '0.00' COMMENT 'descuento',
  `total` decimal(14,2) NOT NULL DEFAULT '0.00' COMMENT 'total',
  `tipo` varchar(10) DEFAULT NULL COMMENT 'tipo  CRE',
  `metodoPago` varchar(50) DEFAULT NULL COMMENT 'EFE,QR,TAR',
  `numeroTarjeta` varchar(8) DEFAULT NULL COMMENT 'numero de tarjeta',
  `observaciones` varchar(500) DEFAULT NULL,
  `estado` varchar(10) DEFAULT NULL COMMENT 'estado, PENDIENTE, PROCESADO, ANULADO',
  `equipo` int(11) NOT NULL COMMENT 'numero de sucursal, equipo en el que se va a facturar',
  `email` varchar(100) DEFAULT NULL COMMENT 'email',
  `telefono` varchar(70) DEFAULT NULL,
  `direccion` varchar(150) DEFAULT NULL,
  `nro_venta` int(11) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logs`
--

DROP TABLE IF EXISTS `logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'id de la tabla',
  `codigoSistema` varchar(100) DEFAULT NULL,
  `apiNombre` varchar(45) DEFAULT NULL,
  `errorName` varchar(200) DEFAULT NULL,
  `errorMessage` text,
  `obs` varchar(300) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=431 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mesas`
--

DROP TABLE IF EXISTS `mesas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mesas` (
  `mesa_id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(25) NOT NULL,
  `fecha_alta` datetime DEFAULT NULL,
  `fecha_ult_modificacion` datetime DEFAULT NULL,
  PRIMARY KEY (`mesa_id`),
  UNIQUE KEY `nombre_UNIQUE` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `monedas`
--

DROP TABLE IF EXISTS `monedas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `monedas` (
  `moneda_id` int(11) NOT NULL AUTO_INCREMENT,
  `simbolo` varchar(10) NOT NULL,
  `moneda` varchar(30) NOT NULL,
  `fecha_alta` datetime DEFAULT NULL COMMENT 'Fecha en que el registro fue creado',
  `fecha_ult_modificacion` datetime DEFAULT NULL COMMENT 'Fecha de la ultima modificacion del registro',
  PRIMARY KEY (`moneda_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `movimiento_cajas`
--

DROP TABLE IF EXISTS `movimiento_cajas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimiento_cajas` (
  `movimiento_caja_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Indentificador de registro unico',
  `sucursal_id` int(11) NOT NULL COMMENT 'indentificador de la sucursal',
  `caja_id` int(11) NOT NULL COMMENT 'Identificador de la caja asignada',
  `usuario_id` int(11) DEFAULT NULL COMMENT 'Identificador del cajero que realiza la operacion',
  `fecha_hora` datetime DEFAULT NULL COMMENT 'Fecha y hora de la operacion cuando se hace efectivo el cobro o el pago',
  `moneda_id` int(11) NOT NULL COMMENT 'Moneda de la operacion',
  `concepto_caja_id` int(11) NOT NULL COMMENT 'Identificador del concepto , se relaciona con la tabla concepto_cajas',
  `turno_id` int(11) DEFAULT NULL COMMENT 'Identificador de turno del cajero',
  `forma_pago` varchar(10) NOT NULL COMMENT 'Forma de paro en caja  (CONTADO/TARJETA/CHEQUE)',
  `tarjeta` varchar(20) DEFAULT NULL COMMENT 'Numero de la tarjeta de debito o credito si el pago es con tarjeta',
  `cupon_tarjeta` varchar(15) DEFAULT NULL COMMENT 'Cupon de la tarjeta de debito o credito si el pago es con tarjeta',
  `monto_tarjeta` decimal(14,2) DEFAULT NULL COMMENT 'Monto de la tarjeta',
  `plan_tarjeta` varchar(30) DEFAULT NULL COMMENT 'Plan si es que se tuviera',
  `banco_cheque` varchar(30) DEFAULT NULL COMMENT 'Nombre del banco si la forma de pago es con cheque',
  `cuenta_cheque` varchar(30) DEFAULT NULL COMMENT 'Numero de cuenta del cheque si la forma de pago es con cheque',
  `monto_cheque` decimal(14,2) DEFAULT NULL COMMENT 'Monto del cheque',
  `num_cheque` int(10) DEFAULT NULL COMMENT 'Numero de cheque si la forma de pago es con cheque',
  `fecha_cheque` datetime DEFAULT NULL COMMENT 'Fecha de emision del cheque si la forma de pago es con cheque',
  `nombre_tercero` varchar(50) DEFAULT NULL COMMENT 'Nombre del la persona a la que se paga o cobra si es que no esta registrada en el sistema',
  `documento_identidad` varchar(20) DEFAULT NULL COMMENT 'Numero de documento de identidad de la persona si no esta registrada enel sistema',
  `tipo_movimiento` varchar(10) NOT NULL COMMENT 'Tipo de movimiento de caja INGRESO/EGRESO',
  `importe` decimal(14,2) NOT NULL COMMENT 'Importe cobrado o pagado',
  `proveedor_id` int(11) DEFAULT NULL COMMENT 'Identificador del proveedor o persona a quien se paga o cobra si esta registrada en el sistema',
  `pedido_id` int(11) DEFAULT NULL COMMENT 'Identificador del pedido en ventas principalmente para anticipos de clientes',
  `estado` varchar(15) NOT NULL COMMENT 'Estado de la operacion (PENDIENTE/COBRADO/PAGADO/ANULADO)',
  `numero_orden_pago` int(11) DEFAULT NULL COMMENT 'Numero de la orden de pago, numero serial',
  `cuenta_por_pagar_id` int(11) DEFAULT NULL COMMENT 'Identificador de la cuenta por pagar relacionada',
  `plan_pago_id` int(11) DEFAULT NULL COMMENT 'Identificador del plan de pago de la cuenta por pagar si hubiera',
  `fecha_orden_pago` datetime DEFAULT NULL COMMENT 'fecha de la orden de pago',
  `num_docto_caja` int(11) DEFAULT NULL COMMENT 'Numero de documento de caja',
  `cuenta_rendicion_id` int(11) DEFAULT NULL COMMENT 'Identificador de la cuenta rendicion',
  `tercero_id` int(11) DEFAULT NULL COMMENT 'Identificador de tercero',
  `tipo_tercero` varchar(10) CHARACTER SET utf8 DEFAULT NULL COMMENT 'Tipo tercero (Proveedor/Empleado) requiere estar junto a tercero_id para accederlo',
  `autoriza_id` int(11) DEFAULT NULL COMMENT 'Identificador del empleado que da la orden de pago o de cobro',
  `cajero_id` int(11) DEFAULT NULL COMMENT 'Identificador del empleado cajero que realiza la operacion',
  `glosa` varchar(80) DEFAULT NULL COMMENT 'Glosa para la orden de pago y de caja',
  `nit_cliente` char(15) DEFAULT NULL COMMENT 'Nit del cliente, sirve para relacionar los anticipos de clientes en sucursales',
  PRIMARY KEY (`movimiento_caja_id`) USING BTREE,
  KEY `Idx_cpp` (`cuenta_por_pagar_id`),
  KEY `Idx_pp` (`plan_pago_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1452 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notificacertificadorevocados`
--

DROP TABLE IF EXISTS `notificacertificadorevocados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificacertificadorevocados` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `certificado` varchar(100) NOT NULL COMMENT ' certificado',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `fecharevocacion` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' COMMENT 'fecha de revocacion, enviar 0 cuando no es de un punto de venta',
  `razonRevocacion` varchar(200) DEFAULT NULL COMMENT 'motivo de la revocacion',
  `codigosrespuestas` varchar(200) DEFAULT NULL COMMENT 'codigos respuestas ???',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `observaciones`
--

DROP TABLE IF EXISTS `observaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `observaciones` (
  `observacion_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Id de la tabla',
  `item_id` int(11) NOT NULL COMMENT 'Id de la tabla padre items',
  `obs` varchar(15) NOT NULL COMMENT 'Descripcion de la observacion',
  `fecha_alta` datetime DEFAULT NULL COMMENT 'Fecha en que el registro fue creado',
  `fecha_ult_modificacion` datetime DEFAULT NULL COMMENT 'Fecha de la ultima modificacion del registro',
  PRIMARY KEY (`observacion_id`),
  KEY `fk_obs_items` (`item_id`),
  CONSTRAINT `fk_obs_items` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pedido_tiendas`
--

DROP TABLE IF EXISTS `pedido_tiendas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedido_tiendas` (
  `pedido_tienda_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador de registro',
  `area` char(3) NOT NULL COMMENT 'Indica el area al que se realiza el pedido (ALM/PRO)',
  `almacen_id` int(11) DEFAULT '-1' COMMENT 'Identificador del almacen al cual se realiza el pedido SI AREA = ALM',
  `area_produccion_id` int(11) DEFAULT '-1' COMMENT 'Identificador del departamento de produccion al cual se realiza el pedido si AREA = PRO',
  `tienda_id` int(11) NOT NULL COMMENT 'identificador de almacen de la tienda que realiza el pedido',
  `empleado_id` int(11) DEFAULT NULL COMMENT 'Identificador del empleado que realiza el pedido',
  `numero_pedido` int(11) NOT NULL COMMENT 'Numero correlativo de pedidos de la tienda',
  `fecha_pedido` datetime DEFAULT NULL COMMENT 'Fecha del pedido',
  `justificacion` char(80) DEFAULT NULL COMMENT 'Texto que contiene la justificacion del pedido',
  `estado` char(20) DEFAULT NULL COMMENT 'Estado del pedido (SOLICITADO/AUTORIZADO/RECHAZADO/ANULADO/ATENDIDO)',
  `autoriza_id` int(11) DEFAULT NULL COMMENT 'Identificador del empleado, persona que autoriza el pedido',
  PRIMARY KEY (`pedido_tienda_id`),
  KEY `FK_ptda_emp` (`empleado_id`),
  KEY `FK_ptda_alm` (`almacen_id`),
  KEY `FK_ptda_area` (`area_produccion_id`),
  KEY `FK_ptda_tda` (`tienda_id`),
  CONSTRAINT `FK_ptda_alm` FOREIGN KEY (`almacen_id`) REFERENCES `almacenes` (`almacen_id`),
  CONSTRAINT `FK_ptda_area` FOREIGN KEY (`area_produccion_id`) REFERENCES `area_produccion` (`area_produccion_id`),
  CONSTRAINT `FK_ptda_emp` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`empleado_id`),
  CONSTRAINT `FK_ptda_tda` FOREIGN KEY (`tienda_id`) REFERENCES `almacenes` (`almacen_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `pedido_id` int(11) NOT NULL AUTO_INCREMENT,
  `fecha` datetime NOT NULL COMMENT 'Fecha actual',
  `fecha_entrega` datetime DEFAULT NULL COMMENT 'fecha a entregar los productos',
  `cliente_id` int(11) NOT NULL COMMENT 'Identificador de cliente',
  `a_cuenta` decimal(14,2) NOT NULL DEFAULT '0.00' COMMENT 'Monto a cuenta, dejado',
  `saldo` decimal(14,2) NOT NULL DEFAULT '0.00' COMMENT 'Saldo por pagar',
  `nit_cliente` char(15) NOT NULL COMMENT 'Nit/Ci del cliente',
  `observaciones` text COMMENT 'Observaciones',
  `total` decimal(14,2) NOT NULL DEFAULT '0.00' COMMENT 'Total',
  `descuento` decimal(14,2) DEFAULT '0.00',
  `empleado_id` int(11) NOT NULL COMMENT 'Identificador del empleado',
  `cajero_id` int(11) NOT NULL COMMENT 'Identificador del cajero que esta de turno',
  `estado` char(15) DEFAULT NULL COMMENT 'Estado del pedido (PENDIENTE/CONCLUIDO/ANULADO)',
  `almacen_id` int(11) DEFAULT NULL COMMENT 'Identificador del PV',
  `entrega` varchar(10) DEFAULT NULL COMMENT 'Forma de entrega del pedido (ENVIAR/RECOGER)',
  `lin_mesa_id` int(11) DEFAULT NULL COMMENT 'Identificador de la mesa',
  `tarjeta` varchar(45) DEFAULT NULL COMMENT 'Tarjeta de Credito, tarjeta',
  `cupon_tarjeta` varchar(45) DEFAULT NULL COMMENT 'Tarjeta de Credito, cupon',
  `monto_tarjeta` float(14,2) DEFAULT '0.00' COMMENT 'Tarjeta de Credito, monto',
  `plan_tarjeta` varchar(45) DEFAULT NULL COMMENT 'Tarjeta de Credito, plan',
  `nom_pedido_cliente` varchar(45) DEFAULT NULL COMMENT 'Nombre pedido cliente',
  `descuentoAdicional` decimal(17,2) NOT NULL DEFAULT '0.00' COMMENT 'descuento adicional',
  `montoGiftCard` decimal(17,2) NOT NULL DEFAULT '0.00' COMMENT 'monto giftCard',
  `codigoMoneda` int(3) NOT NULL DEFAULT '1',
  `tipoCambio` decimal(17,2) NOT NULL DEFAULT '0.00' COMMENT 'tipo de cambio',
  `montoTotalMoneda` decimal(17,2) NOT NULL DEFAULT '0.00',
  `pedido_almacen_id` int(11) DEFAULT NULL COMMENT 'almacen en el cual se recogera el pedido',
  `nombre_cliente` varchar(85) DEFAULT NULL COMMENT 'Nombre del cliente',
  `numero_ticket` int(11) DEFAULT NULL,
  `numeroVenta` int(11) DEFAULT NULL COMMENT 'numero de venta relacionado con el icon',
  `metodoPago` varchar(5) DEFAULT NULL COMMENT 'EFE,TAR,QR',
  PRIMARY KEY (`pedido_id`),
  KEY `fk_pedido_mesas` (`lin_mesa_id`),
  CONSTRAINT `fk_pedido_mesas` FOREIGN KEY (`lin_mesa_id`) REFERENCES `lin_mesas` (`lin_mesa_id`)
) ENGINE=InnoDB AUTO_INCREMENT=32100 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pedidos_anulados`
--

DROP TABLE IF EXISTS `pedidos_anulados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos_anulados` (
  `pedido_anulado_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Id de la tabla',
  `pedido_id` int(11) NOT NULL COMMENT 'Id de la tabla padre pedidos',
  `fecha` datetime NOT NULL COMMENT 'Fecha de la anulacion',
  `empleado_id` int(11) NOT NULL COMMENT 'Id del empleado que realiza la anulacion',
  `item_id` int(11) NOT NULL,
  `cantidad` float(14,2) DEFAULT NULL,
  `precio_unitario` float(14,2) DEFAULT NULL,
  `descuento` float(14,2) DEFAULT NULL,
  `total` varchar(45) DEFAULT NULL,
  `turno_id` int(11) DEFAULT NULL COMMENT 'Id del turno',
  `observacion` varchar(175) DEFAULT NULL COMMENT 'Obervaciones',
  PRIMARY KEY (`pedido_anulado_id`),
  KEY `fk_ped_anular` (`pedido_id`),
  CONSTRAINT `fk_ped_anular` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`pedido_id`)
) ENGINE=InnoDB AUTO_INCREMENT=204 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `permisos`
--

DROP TABLE IF EXISTS `permisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permisos` (
  `permisos_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID de Permisos',
  `empleado_id` int(11) NOT NULL COMMENT 'ID de Empleados',
  `visible` tinyint(1) DEFAULT NULL COMMENT 'Formulario Visible',
  `crear_reg` tinyint(1) DEFAULT NULL COMMENT 'Crear registro',
  `modificar_reg` tinyint(1) DEFAULT NULL COMMENT 'Modificar registro',
  `anular_reg` tinyint(1) DEFAULT NULL COMMENT 'Anular registro',
  `autorizar_sol` tinyint(1) DEFAULT NULL COMMENT 'Autorizar solicitud',
  `rechazar_sol` tinyint(1) DEFAULT NULL COMMENT 'Rechazar solicitud',
  `anular_sol` tinyint(1) DEFAULT NULL COMMENT 'Anular Solicitud',
  `formulario_id` int(11) DEFAULT NULL COMMENT 'ID de tabla formulario',
  `caja_id` int(11) DEFAULT NULL COMMENT 'ID Caja, Un empleado solo prodra utilizar una caja',
  `almacen_ids` char(20) DEFAULT NULL COMMENT 'Lista de IDs de almacenes que maneja el empleado',
  `sucursal_id` int(11) DEFAULT NULL,
  `depto_ids` char(20) DEFAULT NULL,
  `anular_venta` tinyint(1) DEFAULT '0' COMMENT 'Permiso para anular una venta',
  PRIMARY KEY (`permisos_id`),
  KEY `permisos_ibfk_1` (`empleado_id`),
  KEY `permisos_ibfk_2` (`formulario_id`),
  KEY `permisos_ibfk_3` (`caja_id`),
  CONSTRAINT `permisos_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`empleado_id`),
  CONSTRAINT `permisos_ibfk_2` FOREIGN KEY (`formulario_id`) REFERENCES `formularios` (`formulario_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `permisos_ibfk_3` FOREIGN KEY (`caja_id`) REFERENCES `cajas` (`caja_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3981 DEFAULT CHARSET=latin1 COMMENT='permisos usuarios';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `permisos_roles`
--

DROP TABLE IF EXISTS `permisos_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permisos_roles` (
  `permiso_id` int(11) NOT NULL AUTO_INCREMENT,
  `rol_id` int(11) NOT NULL,
  `formulario_id` int(11) DEFAULT NULL,
  `visible` tinyint(1) DEFAULT NULL,
  `modificar_reg` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`permiso_id`),
  KEY `perm_rol_fk_1` (`formulario_id`),
  KEY `perm_rol_fk_2` (`rol_id`),
  CONSTRAINT `perm_rol_fk_1` FOREIGN KEY (`formulario_id`) REFERENCES `formularios` (`formulario_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `perm_rol_fk_2` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`rol_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=412 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `proveedores`
--

DROP TABLE IF EXISTS `proveedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proveedores` (
  `proveedor_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'id del objeto',
  `codigo` char(20) NOT NULL COMMENT 'Codigo proveedor',
  `nit` char(20) DEFAULT NULL COMMENT 'NIT',
  `nombre` char(60) DEFAULT NULL COMMENT 'Nombre o Razón social',
  `direccion` char(80) DEFAULT NULL COMMENT 'Dirección',
  `telefono` char(15) DEFAULT NULL COMMENT 'Telefono',
  `telefono_movil` char(15) DEFAULT NULL COMMENT 'Telefono movil',
  `email` char(80) DEFAULT NULL COMMENT 'Email',
  `contacto1` char(80) DEFAULT NULL COMMENT 'Contacto 1',
  `contacto2` char(80) DEFAULT NULL COMMENT 'Contacto 2',
  `tipo_proveedor` char(30) DEFAULT NULL COMMENT 'Tipo',
  `fecha_alta` datetime DEFAULT NULL COMMENT 'Fecha en que se creo el registro',
  `fecha_ult_modificacion` datetime DEFAULT NULL COMMENT 'Fecha de ultima modificacion del registro',
  PRIMARY KEY (`proveedor_id`),
  UNIQUE KEY `proveedor_id` (`proveedor_id`),
  UNIQUE KEY `codigo` (`codigo`),
  UNIQUE KEY `idx_codigo` (`codigo`),
  KEY `AI_proveedor_id` (`proveedor_id`),
  KEY `idx_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `recepcionfacturas`
--

DROP TABLE IF EXISTS `recepcionfacturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recepcionfacturas` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `id_factura` int(11) NOT NULL COMMENT 'id de la tabla factura asociada',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigodocumentosector` int(1) NOT NULL COMMENT 'codigo documento sector',
  `codigoemision` int(1) NOT NULL COMMENT 'codigo emision',
  `codigomodalidad` int(1) NOT NULL COMMENT ' 1 - ELECTRONICA EN LINEA          2 - COMPUTARIZADA EN LINEA',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `cufd` varchar(100) NOT NULL COMMENT 'codigo cufd',
  `cuis` varchar(100) NOT NULL COMMENT 'codigo cuis',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `tipofacturadocumento` int(1) NOT NULL COMMENT 'tipo factura documento',
  `archivo` text NOT NULL COMMENT 'archivo base64 binary',
  `fechaEnvio` timestamp NULL DEFAULT NULL COMMENT 'fecha envio de la factura',
  `hashArchivo` text NOT NULL COMMENT 'hash del campo archivo',
  `cuf` varchar(100) NOT NULL,
  `codigorecepcion` varchar(200) DEFAULT NULL COMMENT 'codigo de recepcion',
  `codigoestado` int(11) DEFAULT NULL COMMENT 'codigo estado de la recepcion de la factura ',
  `codigomotivo` int(11) DEFAULT NULL COMMENT 'codigo motivo de la anulacion',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cuf_UNIQUE` (`cuf`)
) ENGINE=InnoDB AUTO_INCREMENT=26737 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `recepcionpaquetefacturas`
--

DROP TABLE IF EXISTS `recepcionpaquetefacturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recepcionpaquetefacturas` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigodocumentosector` int(1) NOT NULL COMMENT 'codigo documento sector',
  `codigoemision` int(1) NOT NULL COMMENT 'codigo emision',
  `codigomodalidad` int(1) NOT NULL COMMENT ' 1 - ELECTRONICA EN LINEA          2 - COMPUTARIZADA EN LINEA',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `cufd` varchar(100) NOT NULL COMMENT 'codigo cufd',
  `cuis` varchar(100) NOT NULL COMMENT 'codigo cuis',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `tipofacturadocumento` int(1) NOT NULL COMMENT 'tipo factura documento',
  `archivo` mediumtext NOT NULL COMMENT 'archivo base64 binary',
  `fechaEnvio` timestamp NULL DEFAULT NULL COMMENT 'fecha envio de la factura',
  `hashArchivo` text NOT NULL COMMENT 'hash del campo archivo',
  `cafc` varchar(50) DEFAULT NULL,
  `cantidadfacturas` int(11) NOT NULL COMMENT 'cantidad de facturas enviadas <=500',
  `codigoevento` int(11) NOT NULL COMMENT 'codigo que devolvio el metodo de registro de evento',
  `codigorecepcion` varchar(200) DEFAULT NULL COMMENT 'codigo de recepcion',
  `codigoestado` int(11) DEFAULT NULL COMMENT 'codigo estado de la recepcion de la factura ',
  `codigosrespuestas` text COMMENT 'codigos de respuesta',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `registroeventossignificativos`
--

DROP TABLE IF EXISTS `registroeventossignificativos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registroeventossignificativos` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `cufd` varchar(100) NOT NULL COMMENT 'Cufd: asignado diario',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigomotivoevento` int(11) DEFAULT NULL COMMENT 'codigo de evento',
  `descripcion` varchar(200) DEFAULT NULL COMMENT 'descripcion de respuesta',
  `fechahorainicioevento` timestamp NULL DEFAULT NULL COMMENT 'fecha inicio evento',
  `fechahorafinevento` timestamp NULL DEFAULT NULL COMMENT 'fecha inicio evento',
  `cufdevento` varchar(100) NOT NULL COMMENT 'Cufd con el que se genero el evento',
  `transaccion` tinyint(1) DEFAULT '0' COMMENT 'transaccion true/flase 0/1 de respuesta',
  `codigorecepcioneventosignificativo` int(11) DEFAULT NULL COMMENT 'codigo de recepcion del evento de respuesta',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `registropuntoventas`
--

DROP TABLE IF EXISTS `registropuntoventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registropuntoventas` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigomodalidad` int(1) NOT NULL COMMENT ' 1 - ELECTRONICA EN LINEA          2 - COMPUTARIZADA EN LINEA',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `codigotipopuntoventa` int(11) NOT NULL COMMENT 'codigo 0,1,2,3,4,5,6',
  `descripcion` varchar(100) NOT NULL COMMENT 'descripcion del punto de venta',
  `nombrepuntoventa` varchar(100) NOT NULL COMMENT 'nombre del punto de venta',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ... asignado',
  `estado` varchar(15) DEFAULT NULL COMMENT 'estado VIGENTE/CERRADO',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigopuntoventa_UNIQUE` (`codigopuntoventa`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `resumen_turnos`
--

DROP TABLE IF EXISTS `resumen_turnos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resumen_turnos` (
  `resumen_turno_id` int(11) NOT NULL AUTO_INCREMENT,
  `turno_id` int(11) DEFAULT NULL COMMENT 'Id del turno',
  `almacen_id` int(11) DEFAULT NULL COMMENT 'Id del almacen',
  `item_id` int(11) DEFAULT NULL COMMENT 'Id del producto',
  `fecha_inicio` datetime DEFAULT NULL COMMENT 'Fecha inicio del turno',
  `fecha_final` datetime DEFAULT NULL COMMENT 'Fecha final del turno',
  `saldo_ant` decimal(14,6) DEFAULT NULL COMMENT 'Saldo anterior',
  `cant_ing_erp` decimal(14,6) DEFAULT NULL COMMENT 'Cantidad ingresada desde la central (ERP)',
  `cant_ing_trans` decimal(14,6) DEFAULT NULL COMMENT 'Cantidad ingresada por transferencia de otros PV',
  `cant_ing_otros` decimal(14,6) DEFAULT NULL COMMENT 'Cantidad ingresada por otros conceptos',
  `total_ingresos` decimal(14,6) DEFAULT NULL COMMENT 'Total ingresos',
  `cant_sal_trans` decimal(14,6) DEFAULT NULL COMMENT 'Cantidad de salida por transferencia',
  `cant_sal_ajuste` decimal(14,6) DEFAULT NULL COMMENT 'Cantidad de salida por ajuste',
  `cant_sal_otros_varios` decimal(14,6) DEFAULT NULL COMMENT 'Cantidad de salida por otros conceptos',
  `cant_sal_perdida` decimal(14,6) DEFAULT NULL COMMENT 'Cantidad de salida por perdidas',
  `cant_sal_consumo` decimal(14,6) DEFAULT NULL COMMENT 'Cantidad de salida por consumo',
  `cant_sal_combo` decimal(14,6) DEFAULT NULL COMMENT 'Cantidad de salida de combos (mixtos)',
  `cant_sal_venta_emp` decimal(14,6) DEFAULT NULL,
  `cant_vendida` decimal(14,6) DEFAULT NULL COMMENT 'Cantidad vendida',
  `total_egresos` decimal(14,6) DEFAULT NULL COMMENT 'Total egresos',
  `pu` decimal(14,2) DEFAULT NULL COMMENT 'Precio unitario promedio',
  `sub_total` decimal(14,2) DEFAULT NULL COMMENT 'Sub total',
  `descuento` decimal(14,2) DEFAULT NULL COMMENT 'Total descuentos',
  `total` decimal(14,2) DEFAULT NULL COMMENT 'Total',
  `mixto` tinyint(1) DEFAULT NULL COMMENT 'Producto mixto',
  `saldo` decimal(14,6) DEFAULT NULL COMMENT 'Saldo, total ingresos - total egresos',
  PRIMARY KEY (`resumen_turno_id`)
) ENGINE=InnoDB AUTO_INCREMENT=73638 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `rol_id` int(11) NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(45) NOT NULL COMMENT 'descripcion del rol',
  PRIMARY KEY (`rol_id`),
  UNIQUE KEY `rol_id_UNIQUE` (`rol_id`),
  UNIQUE KEY `descripcion_UNIQUE` (`descripcion`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `secciones`
--

DROP TABLE IF EXISTS `secciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `secciones` (
  `seccion_id` int(11) NOT NULL AUTO_INCREMENT,
  `seccion` varchar(45) NOT NULL COMMENT 'Nombre de la seccion',
  `path_impresora` varchar(200) DEFAULT NULL COMMENT 'Direccion de la impresora',
  `fecha_alta` datetime DEFAULT NULL COMMENT 'Fecha en que el registro fue creado',
  `fecha_ult_modificacion` datetime DEFAULT NULL COMMENT 'Fecha de la ultima modificacion del registro',
  `impresion` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica si la comanda sera impresa al momento de realizar el pedido',
  PRIMARY KEY (`seccion_id`),
  UNIQUE KEY `seccion_UNIQUE` (`seccion`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `secuencias`
--

DROP TABLE IF EXISTS `secuencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `secuencias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) NOT NULL,
  `descripcion` varchar(80) DEFAULT NULL,
  `inicio` int(11) NOT NULL,
  `final` int(11) NOT NULL,
  `seq` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `siat_consultas`
--

DROP TABLE IF EXISTS `siat_consultas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `siat_consultas` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `api_codigo` varchar(50) NOT NULL COMMENT 'codigo unico de la api',
  `api_url` varchar(300) NOT NULL COMMENT 'link de la api',
  `metodo` varchar(10) NOT NULL DEFAULT 'POST' COMMENT 'metodo GET/POST/PUT/DELETE',
  `sql` text COMMENT 'Consulta sql',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `api_codigo_UNIQUE` (`api_codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sinc_actividades`
--

DROP TABLE IF EXISTS `sinc_actividades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinc_actividades` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `codigocaeb` int(11) DEFAULT NULL COMMENT 'codigo Caeb de respuesta',
  `descripcion` varchar(500) DEFAULT NULL COMMENT 'descripcion del codigo caeb de respuesta',
  `tipoactividad` varchar(10) DEFAULT NULL COMMENT 'tipo de actividad de respuesta',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sinc_actividadesdocumentosectores`
--

DROP TABLE IF EXISTS `sinc_actividadesdocumentosectores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinc_actividadesdocumentosectores` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `codigoactividad` int(11) DEFAULT NULL COMMENT 'codigo actividad de respuesta',
  `codigodocumentosector` int(11) DEFAULT NULL COMMENT 'codigo documento sector de respuesta',
  `tipodocumentosector` varchar(10) DEFAULT NULL COMMENT 'tipo documento sector de respuesta',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sinc_leyendasfacturas`
--

DROP TABLE IF EXISTS `sinc_leyendasfacturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinc_leyendasfacturas` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `codigoactividad` int(11) DEFAULT NULL COMMENT 'codigo actividad de respuesta',
  `descripcionLeyenda` varchar(200) DEFAULT NULL COMMENT 'descripcion de la leyenda de la factura de respuesta',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sinc_mensajesservicios`
--

DROP TABLE IF EXISTS `sinc_mensajesservicios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinc_mensajesservicios` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `codigoclasificador` int(11) DEFAULT NULL COMMENT 'codigo clasificador de respuesta',
  `descripcion` varchar(200) DEFAULT NULL COMMENT 'descripcion de respuesta',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=196 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sinc_parametricaeventossignificativos`
--

DROP TABLE IF EXISTS `sinc_parametricaeventossignificativos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinc_parametricaeventossignificativos` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `codigoclasificador` int(11) DEFAULT NULL COMMENT 'codigo clasificador de respuesta',
  `descripcion` varchar(200) DEFAULT NULL COMMENT 'descripcion de respuesta',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sinc_parametricamotivoanulacions`
--

DROP TABLE IF EXISTS `sinc_parametricamotivoanulacions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinc_parametricamotivoanulacions` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `codigoclasificador` int(11) DEFAULT NULL COMMENT 'codigo clasificador de respuesta',
  `descripcion` varchar(200) DEFAULT NULL COMMENT 'descripcion de respuesta',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sinc_parametricapaisorigens`
--

DROP TABLE IF EXISTS `sinc_parametricapaisorigens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinc_parametricapaisorigens` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `codigoclasificador` int(11) DEFAULT NULL COMMENT 'codigo clasificador de respuesta',
  `descripcion` varchar(200) DEFAULT NULL COMMENT 'descripcion de respuesta',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=212 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sinc_parametricatipodocumentoidentidads`
--

DROP TABLE IF EXISTS `sinc_parametricatipodocumentoidentidads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinc_parametricatipodocumentoidentidads` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `codigoclasificador` int(11) DEFAULT NULL COMMENT 'codigo clasificador de respuesta',
  `descripcion` varchar(200) DEFAULT NULL COMMENT 'descripcion de respuesta',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sinc_parametricatipodocumentosectors`
--

DROP TABLE IF EXISTS `sinc_parametricatipodocumentosectors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinc_parametricatipodocumentosectors` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `codigoclasificador` int(11) DEFAULT NULL COMMENT 'codigo clasificador de respuesta',
  `descripcion` varchar(200) DEFAULT NULL COMMENT 'descripcion de respuesta',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sinc_parametricatipoemisions`
--

DROP TABLE IF EXISTS `sinc_parametricatipoemisions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinc_parametricatipoemisions` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `codigoclasificador` int(11) DEFAULT NULL COMMENT 'codigo clasificador de respuesta',
  `descripcion` varchar(200) DEFAULT NULL COMMENT 'descripcion de respuesta',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sinc_parametricatipohabitacions`
--

DROP TABLE IF EXISTS `sinc_parametricatipohabitacions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinc_parametricatipohabitacions` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `codigoclasificador` int(11) DEFAULT NULL COMMENT 'codigo clasificador de respuesta',
  `descripcion` varchar(200) DEFAULT NULL COMMENT 'descripcion de respuesta',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sinc_parametricatipometodopagos`
--

DROP TABLE IF EXISTS `sinc_parametricatipometodopagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinc_parametricatipometodopagos` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `codigoclasificador` int(11) DEFAULT NULL COMMENT 'codigo clasificador de respuesta',
  `descripcion` varchar(200) DEFAULT NULL COMMENT 'descripcion de respuesta',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=307 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sinc_parametricatipomonedas`
--

DROP TABLE IF EXISTS `sinc_parametricatipomonedas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinc_parametricatipomonedas` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `codigoclasificador` int(11) DEFAULT NULL COMMENT 'codigo clasificador de respuesta',
  `descripcion` varchar(200) DEFAULT NULL COMMENT 'descripcion de respuesta',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=155 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sinc_parametricatipopuntoventas`
--

DROP TABLE IF EXISTS `sinc_parametricatipopuntoventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinc_parametricatipopuntoventas` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `codigoclasificador` int(11) DEFAULT NULL COMMENT 'codigo clasificador de respuesta',
  `descripcion` varchar(200) DEFAULT NULL COMMENT 'descripcion de respuesta',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sinc_parametricatiposfacturas`
--

DROP TABLE IF EXISTS `sinc_parametricatiposfacturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinc_parametricatiposfacturas` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `codigoclasificador` int(11) DEFAULT NULL COMMENT 'codigo clasificador de respuesta',
  `descripcion` varchar(200) DEFAULT NULL COMMENT 'descripcion de respuesta',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sinc_parametricaunidadmedidas`
--

DROP TABLE IF EXISTS `sinc_parametricaunidadmedidas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinc_parametricaunidadmedidas` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `codigoclasificador` int(11) DEFAULT NULL COMMENT 'codigo clasificador de respuesta',
  `descripcion` varchar(200) DEFAULT NULL COMMENT 'descripcion de respuesta',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=127 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sinc_productosservicios`
--

DROP TABLE IF EXISTS `sinc_productosservicios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinc_productosservicios` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `codigoambiente` int(1) NOT NULL COMMENT 'AMBIENTES: 1 - PRODUCCION ;  2 - PRUEBAS',
  `codigopuntoventa` int(4) NOT NULL COMMENT 'codigo 0 - 1 ...',
  `codigosistema` varchar(100) NOT NULL COMMENT 'CODIGO DE SISTEMA: asignado',
  `codigosucursal` int(4) NOT NULL COMMENT 'codigo 0 casa matriz, 1....',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `cuis` varchar(100) NOT NULL COMMENT 'Cuis: asignado',
  `codigoactividad` int(11) DEFAULT NULL COMMENT 'codigo actividad de respuesta',
  `codigoproducto` int(11) DEFAULT NULL COMMENT 'codigo producto de respuesta',
  `descripcionproducto` varchar(500) DEFAULT NULL COMMENT 'descripcion del producto de respuesta',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sinc_siat`
--

DROP TABLE IF EXISTS `sinc_siat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinc_siat` (
  `sinc_siat_id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL COMMENT 'nombre de la sincronizacion',
  `cod` varchar(45) NOT NULL COMMENT 'codigo de la descripcion',
  `tabla` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`sinc_siat_id`),
  UNIQUE KEY `nombre_UNIQUE` (`nombre`),
  UNIQUE KEY `cod_UNIQUE` (`cod`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sucursales`
--

DROP TABLE IF EXISTS `sucursales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sucursales` (
  `sucursal_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador de sucursal',
  `nombre` char(80) DEFAULT NULL COMMENT 'Nombre de la sucursal',
  `direccion` char(20) DEFAULT NULL COMMENT 'Direccion de la sucursal',
  `host` varchar(50) NOT NULL COMMENT 'Nombre o direccion IP del host de la sucursal',
  `port` int(11) NOT NULL COMMENT 'Numero de port de la base de datos de la sucursal',
  `usuario` varchar(30) NOT NULL COMMENT 'Login o nombrwe de usuario de base de datos de la sucursal',
  `password` varchar(30) NOT NULL COMMENT 'Pasword de la base de datos de la sucursal',
  `base_datos` varchar(30) NOT NULL COMMENT 'nombre de la base de datos del punto de venta de la sucursal',
  `fecha_alta` datetime DEFAULT NULL COMMENT 'Fecha en que el registro fue creado',
  `fecha_ult_modificacion` datetime DEFAULT NULL COMMENT 'Fecha de la ultima modificacion del registro',
  PRIMARY KEY (`sucursal_id`),
  UNIQUE KEY `sucursal_id` (`sucursal_id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tabla_local`
--

DROP TABLE IF EXISTS `tabla_local`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tabla_local` (
  `tabla_local_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador del registro',
  `tabla` varchar(80) NOT NULL COMMENT 'Nombre de la tabla',
  `ultima_actualizacion` datetime NOT NULL COMMENT 'Fecha y hora de la ultima actualizacion de la tabla',
  `campo_clave` varchar(45) DEFAULT NULL COMMENT 'Campo clave ademas de la clave primaria, por ejemplo Codigo',
  PRIMARY KEY (`tabla_local_id`),
  UNIQUE KEY `Idx_tabla` (`tabla`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tabla_remota`
--

DROP TABLE IF EXISTS `tabla_remota`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tabla_remota` (
  `tabla_remota_id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador del registro',
  `tabla` varchar(80) NOT NULL COMMENT 'Nombre de la tabla tanto en base de datos central como remota',
  `ultima_actualizacion` datetime NOT NULL COMMENT 'Fecha y hora de la ultima actualizacion',
  `campo_clave` varchar(45) NOT NULL COMMENT 'Nombre del campo que es clave primaria ej: pedido_producto_id',
  PRIMARY KEY (`tabla_remota_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tablas_parametros`
--

DROP TABLE IF EXISTS `tablas_parametros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tablas_parametros` (
  `parametro_id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Identificador de registro',
  `tabla` char(30) NOT NULL COMMENT 'Nombre de la tabla',
  `nombre_id` char(30) NOT NULL COMMENT 'Nombre del campo que es el Id. de la tabla',
  PRIMARY KEY (`parametro_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tarjetas`
--

DROP TABLE IF EXISTS `tarjetas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tarjetas` (
  `tarjeta_id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL COMMENT 'Nombre de la tarjeta',
  `fecha_alta` datetime DEFAULT NULL,
  `fecha_ult_modificacion` datetime DEFAULT NULL,
  PRIMARY KEY (`tarjeta_id`),
  UNIQUE KEY `nombre_UNIQUE` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `terceros`
--

DROP TABLE IF EXISTS `terceros`;
/*!50001 DROP VIEW IF EXISTS `terceros`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `terceros` AS SELECT 
 1 AS `codigo`,
 1 AS `tipo_tercero`,
 1 AS `tercero_id`,
 1 AS `nombre_tercero`,
 1 AS `cedula_identidad`,
 1 AS `direccion`,
 1 AS `telefono`,
 1 AS `celular`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `tipo_cambios`
--

DROP TABLE IF EXISTS `tipo_cambios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_cambios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `moneda_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `cotiz_compra` float(14,5) NOT NULL,
  `cotiz_venta` float(14,5) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Idx_femon` (`fecha`,`moneda_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tipo_items`
--

DROP TABLE IF EXISTS `tipo_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_items` (
  `tipo_item_id` int(11) NOT NULL COMMENT 'Identificador de tipo de item',
  `parent_tipo_item_id` int(11) DEFAULT NULL,
  `descripcion` char(50) DEFAULT NULL COMMENT 'Descripcion ',
  `prefijo` varchar(5) DEFAULT NULL COMMENT 'prefijo utilizado para crear el codigo del item',
  `fecha_alta` datetime DEFAULT NULL COMMENT 'Fecha en que el registro fue creado',
  `fecha_ult_modificacion` datetime DEFAULT NULL COMMENT 'Fecha de la ultima modificacion del registro',
  PRIMARY KEY (`tipo_item_id`),
  UNIQUE KEY `tipo_item_id` (`tipo_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tipo_movimientos`
--

DROP TABLE IF EXISTS `tipo_movimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_movimientos` (
  `tipo_movimiento_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador tipo',
  `codigo` char(20) NOT NULL COMMENT 'Codigo',
  `descripcion` char(80) NOT NULL COMMENT 'Descripcion',
  `sucursal` tinyint(1) NOT NULL COMMENT 'Sucural, se usa en sucursales si es true',
  `fecha_alta` datetime DEFAULT NULL COMMENT 'Fecha en que se dio de alta el registro',
  `fecha_ult_modificacion` datetime DEFAULT NULL COMMENT 'Fecha de ultima modificacion del registro',
  PRIMARY KEY (`tipo_movimiento_id`),
  UNIQUE KEY `tipo_movimiento_id` (`tipo_movimiento_id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tokens`
--

DROP TABLE IF EXISTS `tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'llave principal',
  `apikey` text NOT NULL COMMENT 'token',
  `nit` bigint(13) NOT NULL COMMENT 'nit del propietario',
  `fechavigencia` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'fecha limite de vigencia del token',
  `vigente` tinyint(4) DEFAULT '0' COMMENT 'Si el token esta vigente',
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `turnos`
--

DROP TABLE IF EXISTS `turnos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `turnos` (
  `turno_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador de la tabla',
  `fecha_inicio` datetime NOT NULL COMMENT 'Fecha inicio del turno del cajero',
  `fecha_fin` datetime DEFAULT NULL COMMENT 'Fecha fin del turno del cajero',
  `monto_inicial` decimal(14,6) DEFAULT NULL COMMENT 'Monto inicial con el cual esta iniciando su turno',
  `saldo_caja` decimal(14,6) DEFAULT NULL COMMENT 'Saldo en caja',
  `monto_entregado` decimal(14,6) DEFAULT NULL COMMENT 'Monto entregado al finalizar su turno',
  `diferencia` decimal(14,6) DEFAULT NULL COMMENT 'Diferencia Monto inicial - Monto entregado',
  `cajero_id` int(11) DEFAULT NULL COMMENT 'Identificador del cajero',
  `info_enviada` tinyint(1) DEFAULT '0' COMMENT 'Indica si la informacion de las tablas facturas, lin_facturas y movimiento_cajas ha sido enviada',
  `tarjeta_w` decimal(14,6) DEFAULT '0.000000',
  PRIMARY KEY (`turno_id`),
  UNIQUE KEY `turno_id_UNIQUE` (`turno_id`)
) ENGINE=InnoDB AUTO_INCREMENT=509 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ubicaciones`
--

DROP TABLE IF EXISTS `ubicaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ubicaciones` (
  `ubicacion_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador de objeto',
  `parent_ubicacion_id` int(11) DEFAULT NULL,
  `descripcion` char(80) DEFAULT NULL COMMENT 'Descripcion',
  `fecha_alta` datetime DEFAULT NULL COMMENT 'Fecha en que el registro fue creado',
  `fecha_ult_modificacion` datetime DEFAULT NULL COMMENT 'Fecha de la ultima modificacion del registro',
  PRIMARY KEY (`ubicacion_id`),
  UNIQUE KEY `ubicacion_id` (`ubicacion_id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unidad_medidas`
--

DROP TABLE IF EXISTS `unidad_medidas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unidad_medidas` (
  `unidad_medida_id` int(11) NOT NULL COMMENT 'Identificador de objeto codigo clasificador del siat',
  `simbolo` char(10) DEFAULT NULL COMMENT 'Simbolo unidad medida',
  `unidad` varchar(50) DEFAULT NULL COMMENT 'Descripcion de la unidad',
  `fecha_alta` datetime DEFAULT NULL COMMENT 'Fecha en que el registro fue creado',
  `fecha_ult_modificacion` datetime DEFAULT NULL COMMENT 'Fecha de la ultima modificacion del registro',
  PRIMARY KEY (`unidad_medida_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `usuario_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Identificador del usuario',
  `login` varchar(20) NOT NULL COMMENT 'login o nombre de la cuenta con la que se va a identificar',
  `password` varchar(20) NOT NULL COMMENT 'Password o palabra clave de acceso al sistema',
  `ultimo_login` datetime DEFAULT NULL COMMENT 'fecha y hora en que ingreso al sistema por ultima vez',
  `suspendido_en` datetime DEFAULT NULL COMMENT 'Fecha en que el usuario es suspendido',
  `nombre` varchar(80) NOT NULL COMMENT 'Nombre completo del usuario',
  `categoria` varchar(15) DEFAULT 'USUARIO' COMMENT '''Puede ser ADMINISTRADOR/SUPERVISOR/USUARIO''',
  `empleado_id` int(11) DEFAULT NULL COMMENT 'Identificador del usuario, si este es tambien empleado de Wistupiku',
  `fecha_alta` datetime DEFAULT NULL COMMENT 'Fecha en que el registro fue creado',
  `fecha_ult_modificacion` datetime DEFAULT NULL COMMENT 'Fecha de la ultima modificacion del registro',
  PRIMARY KEY (`usuario_id`),
  UNIQUE KEY `Idx_login` (`login`),
  KEY `FK_empleado_id` (`empleado_id`),
  CONSTRAINT `FK_empleado_id` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`empleado_id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Final view structure for view `terceros`
--

/*!50001 DROP VIEW IF EXISTS `terceros`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `terceros` AS select `empleados`.`codigo` AS `codigo`,'Empleado' AS `tipo_tercero`,`empleados`.`empleado_id` AS `tercero_id`,concat_ws(' ',`empleados`.`apaterno`,`empleados`.`amaterno`,`empleados`.`nombres`) AS `nombre_tercero`,`empleados`.`cedula_identidad` AS `cedula_identidad`,`empleados`.`direccion_domicilio` AS `direccion`,`empleados`.`telefono_domicilio` AS `telefono`,`empleados`.`telefono_movil` AS `celular` from `empleados` union select `proveedores`.`codigo` AS `codigo`,'Proveedor' AS `tipo_tercero`,`proveedores`.`proveedor_id` AS `tercero_id`,`proveedores`.`nombre` AS `nombre_tercero`,`proveedores`.`nit` AS `cedula_identidad`,`proveedores`.`direccion` AS `direccion`,`proveedores`.`telefono` AS `telefono`,`proveedores`.`telefono_movil` AS `celular` from `proveedores` union select `clientes`.`nit` AS `codigo`,'Cliente' AS `tipo_tercero`,`clientes`.`cliente_id` AS `tercero_id`,`clientes`.`nombre_razon_social` AS `nombre`,`clientes`.`nit` AS `cedula_identiad`,`clientes`.`direccion` AS `direccion`,`clientes`.`telefono` AS `telefono`,`clientes`.`celular` AS `celular` from `clientes` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-07 12:48:51
