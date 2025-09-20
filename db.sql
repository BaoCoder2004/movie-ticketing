CREATE DATABASE  IF NOT EXISTS `movie_ticketing` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `movie_ticketing`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: movie_ticketing
-- ------------------------------------------------------
-- Server version	8.0.43

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
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `actor_id` bigint unsigned DEFAULT NULL,
  `action` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` bigint unsigned DEFAULT NULL,
  `meta` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_audit_user` (`actor_id`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branches` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `exhibitor_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_branches_exhibitor` (`exhibitor_id`),
  KEY `idx_branches_exhibitor_id` (`exhibitor_id`),
  KEY `ix_branches_city` (`city`),
  CONSTRAINT `fk_branches__exhibitor_id` FOREIGN KEY (`exhibitor_id`) REFERENCES `exhibitors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_branches_exhibitor` FOREIGN KEY (`exhibitor_id`) REFERENCES `exhibitors` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=901 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES (15,10,'CGV Hà Nội','Quận Ba Đình - Hà Nội','Hà Nội',21.0381370,105.8384900,1,'2025-09-18 05:28:55','2025-09-18 08:57:37');
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cms_posts`
--

DROP TABLE IF EXISTS `cms_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cms_posts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('NEWS','PROMO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `publish_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cms_posts`
--

LOCK TABLES `cms_posts` WRITE;
/*!40000 ALTER TABLE `cms_posts` DISABLE KEYS */;
/*!40000 ALTER TABLE `cms_posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `combo_items`
--

DROP TABLE IF EXISTS `combo_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `combo_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `combo_id` bigint unsigned NOT NULL,
  `item_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qty` smallint unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_combo_items_combo` (`combo_id`),
  CONSTRAINT `fk_combo_items_combo` FOREIGN KEY (`combo_id`) REFERENCES `combos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `combo_items`
--

LOCK TABLES `combo_items` WRITE;
/*!40000 ALTER TABLE `combo_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `combo_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `combos`
--

DROP TABLE IF EXISTS `combos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `combos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `combos`
--

LOCK TABLES `combos` WRITE;
/*!40000 ALTER TABLE `combos` DISABLE KEYS */;
INSERT INTO `combos` VALUES (1,'Combo Popcorn',50000.00,1,'2025-09-16 01:58:10','2025-09-16 01:58:10');
/*!40000 ALTER TABLE `combos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exhibitors`
--

DROP TABLE IF EXISTS `exhibitors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exhibitors` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_exhibitors_name` (`name`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `uq_exhibitors_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=901 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exhibitors`
--

LOCK TABLES `exhibitors` WRITE;
/*!40000 ALTER TABLE `exhibitors` DISABLE KEYS */;
INSERT INTO `exhibitors` VALUES (10,'CGV Hà Nội','CGV','www.cgv.com','2025-09-18 05:28:37','2025-09-18 06:07:12');
/*!40000 ALTER TABLE `exhibitors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `genres`
--

DROP TABLE IF EXISTS `genres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `genres` (
  `id` int unsigned NOT NULL,
  `name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `genres`
--

LOCK TABLES `genres` WRITE;
/*!40000 ALTER TABLE `genres` DISABLE KEYS */;
/*!40000 ALTER TABLE `genres` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movie_genres`
--

DROP TABLE IF EXISTS `movie_genres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movie_genres` (
  `movie_id` bigint unsigned NOT NULL,
  `genre_id` int unsigned NOT NULL,
  PRIMARY KEY (`movie_id`,`genre_id`),
  KEY `fk_mg_genre` (`genre_id`),
  CONSTRAINT `fk_mg_genre` FOREIGN KEY (`genre_id`) REFERENCES `genres` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_mg_movie` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movie_genres`
--

LOCK TABLES `movie_genres` WRITE;
/*!40000 ALTER TABLE `movie_genres` DISABLE KEYS */;
/*!40000 ALTER TABLE `movie_genres` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movie_videos`
--

DROP TABLE IF EXISTS `movie_videos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movie_videos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `movie_id` bigint unsigned NOT NULL,
  `site` enum('YouTube','Vimeo','Other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'YouTube',
  `kind` enum('Trailer','Teaser','Clip') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Trailer',
  `key_or_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `official` tinyint(1) NOT NULL DEFAULT '1',
  `published_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_videos_movie` (`movie_id`),
  CONSTRAINT `fk_videos_movie` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=757 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movie_videos`
--

LOCK TABLES `movie_videos` WRITE;
/*!40000 ALTER TABLE `movie_videos` DISABLE KEYS */;
INSERT INTO `movie_videos` VALUES (375,131,'YouTube','Teaser','Q6oxg6uUkKs',1,'2025-04-21 23:00:42'),(376,131,'YouTube','Clip','f8z3IEy2Quw',1,'2025-09-16 19:01:24'),(377,131,'YouTube','Clip','HY5WuuceKeM',1,'2025-09-12 19:00:42'),(378,131,'YouTube','Clip','NOE3c0F19gQ',1,'2025-09-09 19:00:48'),(379,131,'YouTube','Teaser','t41avNnPsaA',1,'2025-08-21 02:00:14'),(380,131,'YouTube','Teaser','IDukDKwrXjE',1,'2025-08-17 00:00:18'),(381,131,'YouTube','Teaser','NSutu0-zMto',1,'2025-08-15 01:04:12'),(382,131,'YouTube','Teaser','RF4ebCzaN0c',1,'2025-08-14 23:00:45'),(383,131,'YouTube','Teaser','85x_sUX9l7Q',1,'2025-08-13 23:00:22'),(384,131,'YouTube','Clip','SCpp32PKszw',1,'2025-08-13 01:02:35'),(385,131,'YouTube','Teaser','BeFZlnMUFlM',1,'2025-08-13 00:54:44'),(386,131,'YouTube','Teaser','Td9V7_6hVUQ',1,'2025-08-12 23:00:45'),(387,131,'YouTube','Teaser','wcy-LvbJji4',1,'2025-08-12 00:01:19'),(388,131,'YouTube','Clip','pCX1hAaVsnQ',1,'2025-08-11 23:01:33'),(389,131,'YouTube','Teaser','QRFAWHq_nRg',1,'2025-08-11 00:00:37'),(390,131,'YouTube','Teaser','401Ut-Uj1u8',1,'2025-08-10 01:00:05'),(391,131,'YouTube','Teaser','dVnZQ89SUe0',1,'2025-08-09 02:00:28'),(392,131,'YouTube','Teaser','czTNR6lHObw',1,'2025-08-08 23:01:18'),(393,131,'YouTube','Teaser','p5ByFKp0C0M',1,'2025-08-08 05:15:57'),(394,131,'YouTube','Teaser','ugdJsfOfcx0',1,'2025-08-08 01:01:13'),(395,131,'YouTube','Teaser','HIfttaJ1rEs',1,'2025-08-07 03:04:20'),(396,131,'YouTube','Clip','b4ohPuycsV8',1,'2025-08-07 02:00:40'),(397,131,'YouTube','Teaser','UbXgBuWEj6o',1,'2025-08-07 01:46:31'),(398,131,'YouTube','Teaser','Fr-8kGeshOA',1,'2025-08-07 01:30:31'),(399,131,'YouTube','Teaser','cR4Vyoqr3JE',1,'2025-08-07 01:00:43'),(400,131,'YouTube','Clip','T67VcPj6U4c',1,'2025-08-07 00:30:13'),(401,131,'YouTube','Clip','kU7zVywiZfo',1,'2025-08-06 23:45:41'),(402,131,'YouTube','Teaser','vl6O3bYs5JI',1,'2025-08-05 23:32:56'),(403,131,'YouTube','Clip','YdoaB2gpgXw',1,'2025-08-05 00:00:43'),(404,131,'YouTube','Clip','1JLpEhutH80',1,'2025-08-04 00:00:01'),(405,131,'YouTube','Teaser','T9q4lNmsuek',1,'2025-08-03 00:00:41'),(406,131,'YouTube','Clip','wMraVQFDZT8',1,'2025-08-02 23:01:28'),(407,131,'YouTube','Teaser','ZfcG7656Tr4',1,'2025-08-02 04:00:24'),(408,131,'YouTube','Teaser','J8PlxT8AouY',1,'2025-08-02 03:06:57'),(409,131,'YouTube','Teaser','UDYFcscrIuI',1,'2025-08-02 00:06:21'),(410,131,'YouTube','Teaser','fA9Q6doTqLk',1,'2025-07-31 00:04:02'),(411,131,'YouTube','Teaser','UcfUZIaG2n8',1,'2025-07-30 02:28:12'),(412,131,'YouTube','Clip','Vu1H6WHPikQ',1,'2025-07-29 05:29:16'),(413,131,'YouTube','Teaser','Z79rq3u6pjw',1,'2025-07-29 01:00:40'),(414,131,'YouTube','Teaser','nITXh93s8HE',1,'2025-07-28 01:06:22'),(415,131,'YouTube','Teaser','Q5rRz8Y5WZQ',1,'2025-07-26 23:00:42'),(416,131,'YouTube','Teaser','wuSv3ozRrCg',1,'2025-07-26 00:01:20'),(417,131,'YouTube','Teaser','GS0yXQAmkzY',1,'2025-07-25 19:29:46'),(418,131,'YouTube','Teaser','aTFz6_hwYmo',1,'2025-07-25 19:26:13'),(419,131,'YouTube','Teaser','rH82lFeMvCw',1,'2025-07-25 19:23:40'),(420,131,'YouTube','Teaser','gKQWqm7JUKc',1,'2025-07-23 22:51:03'),(421,131,'YouTube','Teaser','HbybN67yGjU',1,'2025-07-23 22:47:01'),(422,131,'YouTube','Teaser','ehGDuQ8498k',1,'2025-07-23 08:27:38'),(423,131,'YouTube','Clip','mLrI3Awhdq0',1,'2025-07-23 01:17:01'),(424,131,'YouTube','Teaser','VMYRflYwmlg',1,'2025-07-22 23:00:53'),(518,133,'YouTube','Clip','AQmiLNr4BVY',1,'2025-09-02 23:29:49'),(519,133,'YouTube','Clip','NLSD4cj8u_w',1,'2025-08-22 18:00:40'),(520,133,'YouTube','Clip','4g5z5QK4sMg',1,'2025-08-21 18:00:11'),(521,133,'YouTube','Clip','XOQSUQiYDxc',1,'2025-08-21 06:41:18'),(522,133,'YouTube','Teaser','WW5gu9D1exU',1,'2025-08-20 18:01:01'),(523,133,'YouTube','Clip','jCkw103pE0s',1,'2025-08-20 00:01:02'),(524,133,'YouTube','Teaser','zw2mr4tMKqw',1,'2025-08-18 18:01:41'),(525,133,'YouTube','Teaser','I8KT8fzwjKA',1,'2025-08-17 18:00:25'),(526,133,'YouTube','Clip','RRa9bkComeM',1,'2025-08-16 18:00:54'),(527,133,'YouTube','Clip','vusj83V6Tb8',1,'2025-08-15 23:01:39'),(528,133,'YouTube','Teaser','v_6LO0WfYb0',1,'2025-08-15 18:01:39'),(529,133,'YouTube','Teaser','uj7TGqJpX_M',1,'2025-08-14 16:01:19'),(530,133,'YouTube','Teaser','IffroWzwtNw',1,'2025-08-14 15:00:19'),(531,133,'YouTube','Teaser','wdHqdPmYpnA',1,'2025-08-14 14:00:54'),(532,133,'YouTube','Clip','9_TprYlgb7s',1,'2025-08-14 06:30:02'),(533,133,'YouTube','Clip','zop84VMyG-8',1,'2025-08-14 06:00:59'),(534,133,'YouTube','Clip','UZUezRVbATo',1,'2025-08-13 18:00:22'),(535,133,'YouTube','Clip','BJ1XCIBk5NA',1,'2025-08-12 21:30:15'),(536,133,'YouTube','Teaser','lIzzfTEYVPQ',1,'2025-08-11 18:01:32'),(537,133,'YouTube','Clip','-5bk0FUlc-g',1,'2025-08-10 18:00:01'),(538,133,'YouTube','Clip','o1Lcfiwh710',1,'2025-08-09 18:01:29'),(539,133,'YouTube','Teaser','yw6seOGEt6c',1,'2025-08-08 15:30:39'),(540,133,'YouTube','Teaser','W_NqFZQqKUA',1,'2025-08-08 11:00:51'),(541,133,'YouTube','Teaser','q8n-9UyroBg',1,'2025-08-07 18:01:35'),(542,133,'YouTube','Teaser','pTtwFqTesBc',1,'2025-08-07 14:06:11'),(543,133,'YouTube','Clip','ghyArJO-VkU',1,'2025-08-07 14:00:44'),(544,133,'YouTube','Clip','e8FSxdOiZCg',1,'2025-08-06 23:01:16'),(545,133,'YouTube','Teaser','q_Z-syb9iuo',1,'2025-08-06 18:01:38'),(546,133,'YouTube','Clip','CbSxcyXg6Ss',1,'2025-08-05 22:00:19'),(547,133,'YouTube','Teaser','IYcN9ZLlNso',1,'2025-08-05 18:00:37'),(548,133,'YouTube','Clip','jVDCjMyusQE',1,'2025-08-04 23:30:26'),(549,133,'YouTube','Clip','u9YhyXIi0_0',1,'2025-08-04 22:01:35'),(550,133,'YouTube','Teaser','Fz-erVqpIUQ',1,'2025-08-04 18:00:23'),(551,133,'YouTube','Clip','aVg1XvhDj5g',1,'2025-08-02 18:00:03'),(552,133,'YouTube','Teaser','LEMsstM0BaI',1,'2025-08-01 23:00:39'),(553,133,'YouTube','Clip','h4K27hIZNGU',1,'2025-08-01 19:30:56'),(554,133,'YouTube','Clip','btYYtLxm7Rk',1,'2025-08-01 18:01:05'),(555,133,'YouTube','Teaser','14QoV-lODM8',1,'2025-08-01 17:00:02'),(556,133,'YouTube','Clip','tZHr6ixf7z8',1,'2025-07-31 23:45:05'),(557,133,'YouTube','Clip','zNP9-Jy-8dw',1,'2025-07-31 22:01:49'),(558,133,'YouTube','Clip','-E0LOVc9apQ',1,'2025-07-31 21:00:01'),(559,133,'YouTube','Clip','5DjMqtSJ6Do',1,'2025-07-31 00:00:14'),(560,133,'YouTube','Clip','EszSjbW5Crs',1,'2025-07-30 22:00:33'),(561,133,'YouTube','Clip','9c2mKoyU5Go',1,'2025-07-30 22:00:05'),(562,133,'YouTube','Clip','hqtbM8rZzFA',1,'2025-07-28 23:33:21'),(563,133,'YouTube','Teaser','wfkCj4WCyPo',1,'2025-07-27 23:01:32'),(564,133,'YouTube','Teaser','PJzyrj6XXjE',1,'2025-07-27 08:00:32'),(565,133,'YouTube','Teaser','8NzKsmlzeIs',1,'2025-07-25 14:01:34'),(566,133,'YouTube','Clip','moGz4FY3HgA',1,'2025-07-24 18:30:46'),(567,133,'YouTube','Clip','EkMhqRT7DLM',1,'2025-07-24 18:29:17'),(568,135,'YouTube','Trailer','juD6zgap4-I',1,'2025-09-12 20:58:37'),(569,135,'YouTube','Trailer','M5daTTJKT3s',1,'2025-09-12 15:00:49'),(570,135,'YouTube','Clip','DitPK3bfFOI',1,'2025-09-10 23:22:07'),(571,135,'YouTube','Trailer','pD4ysb6BTqE',1,'2025-09-03 12:06:00'),(572,135,'YouTube','Trailer','5EqVDyqhMko',1,'2025-08-30 03:00:06'),(573,135,'YouTube','Trailer','pzM-GJjactA',1,'2025-08-17 03:30:40'),(574,135,'YouTube','Trailer','gkXS7_5GOgc',1,'2025-08-15 16:01:13'),(575,135,'YouTube','Trailer','6h1PbfaL8pQ',1,'2025-08-15 01:00:11'),(576,135,'YouTube','Trailer','VCC958XvXpA',1,'2025-08-01 11:25:33'),(577,135,'YouTube','Trailer','ywHXIge-PbA',1,'2025-07-20 05:19:59'),(578,135,'YouTube','Trailer','11iy5Hyl0fs',1,'2025-07-20 05:11:07'),(579,135,'YouTube','Trailer','x7uLutVRBfI',1,'2025-06-28 14:01:35'),(580,135,'YouTube','Teaser','rDDxPpzXFhM',1,'2025-03-05 17:00:51'),(581,135,'YouTube','Trailer','F6v_I34-EWY',1,'2024-12-09 00:00:06'),(582,135,'YouTube','Trailer','nKS3mF_D7dM',1,'2024-12-08 18:20:00'),(583,135,'YouTube','Trailer','seX6WMONCkU',1,'2024-06-30 15:18:00'),(714,132,'YouTube','Teaser','3iBhELud1-I',1,'2025-09-09 18:00:07'),(715,132,'YouTube','Teaser','YVbHSRleTmU',1,'2025-09-07 18:00:36'),(716,132,'YouTube','Teaser','cw8KajB4JeQ',1,'2025-09-07 17:30:08'),(717,132,'YouTube','Teaser','Dg63O5d15Wg',1,'2025-09-07 03:51:24'),(718,132,'YouTube','Teaser','6YBNV0Z51IM',1,'2025-09-05 20:00:20'),(719,132,'YouTube','Teaser','m19EFnX40Cg',1,'2025-09-05 15:59:33'),(720,132,'YouTube','Clip','dMbFgvTsgwA',1,'2025-09-05 13:51:20'),(721,132,'YouTube','Teaser','1LHUndpIm3Q',1,'2025-09-03 18:00:41'),(722,132,'YouTube','Clip','ZIyfiX5qrxw',1,'2025-09-02 21:00:35'),(723,132,'YouTube','Clip','XzLTNftJJvc',1,'2025-09-01 19:30:04'),(724,132,'YouTube','Teaser','14glKAg7kpA',1,'2025-09-01 18:00:03'),(725,132,'YouTube','Teaser','TNjRbIPuuAY',1,'2025-08-31 18:00:24'),(726,132,'YouTube','Teaser','Hp4AX2q0N_Q',1,'2025-08-31 16:00:25'),(727,132,'YouTube','Teaser','LhAQr-ZvcyY',1,'2025-08-30 18:30:37'),(728,132,'YouTube','Clip','FKX95PnqNcA',1,'2025-08-30 17:30:07'),(729,132,'YouTube','Teaser','xPnrrHPtzyI',1,'2025-08-29 19:01:01'),(730,132,'YouTube','Teaser','S1OWfDyrk0o',1,'2025-08-29 17:12:47'),(731,132,'YouTube','Clip','3Cw-bJQ1Ji8',1,'2025-08-29 17:00:05'),(732,132,'YouTube','Clip','Qy6Zc4viT64',1,'2025-08-28 19:00:21'),(733,132,'YouTube','Clip','_GxskyETFj0',1,'2025-08-28 17:00:50'),(734,132,'YouTube','Clip','Zrz00rGnX38',1,'2025-08-27 20:00:20'),(735,132,'YouTube','Clip','jQzX7fPFMuw',1,'2025-08-27 18:00:52'),(736,132,'YouTube','Clip','YBJK9Pna54I',1,'2025-08-27 16:24:12'),(737,132,'YouTube','Clip','S0MdnFYgEII',1,'2025-08-22 17:59:55'),(738,132,'YouTube','Teaser','LhNDy-T8Y5A',1,'2025-08-21 23:16:45'),(739,132,'YouTube','Teaser','JwViglfHFxM',1,'2025-08-21 23:15:26'),(740,132,'YouTube','Trailer','p4aWdkM5xF8',1,'2025-08-20 15:59:33'),(741,132,'YouTube','Teaser','w2CTkPjmQ1Y',1,'2025-08-18 20:00:40'),(742,132,'YouTube','Teaser','pwLNMtz6QbM',1,'2025-08-15 16:41:39'),(743,132,'YouTube','Teaser','IxB50J1ZSvA',1,'2025-08-15 16:40:26'),(744,132,'YouTube','Teaser','IjDsQKH3h8Y',1,'2025-08-15 16:36:43'),(745,132,'YouTube','Teaser','XLNi2jALpiU',1,'2025-08-15 16:36:41'),(746,132,'YouTube','Teaser','-CN-TEj7KMQ',1,'2025-08-11 16:00:01'),(747,132,'YouTube','Teaser','_pTH8nqYTDs',1,'2025-08-08 17:00:51'),(748,132,'YouTube','Teaser','PNt1FZXbD4k',1,'2025-08-07 20:02:08'),(749,132,'YouTube','Teaser','411ptXpPtWA',1,'2025-08-07 16:01:32'),(750,132,'YouTube','Clip','xFyCbokgH0E',1,'2025-08-06 17:41:28'),(751,132,'YouTube','Teaser','t-ypvm_JJjQ',1,'2025-07-31 16:15:30'),(752,132,'YouTube','Trailer','bMgfsdYoEEo',1,'2025-07-31 16:00:56'),(753,132,'YouTube','Teaser','A7Eu86USqcw',1,'2025-07-30 16:00:43'),(754,132,'YouTube','Teaser','32Qzh695g3s',1,'2025-05-08 16:15:35'),(755,132,'YouTube','Teaser','FSAz556s0fM',1,'2025-05-08 16:00:19'),(756,132,'YouTube','Clip','WI7GOmpOBkk',1,'2025-05-06 23:00:05');
/*!40000 ALTER TABLE `movie_videos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movies`
--

DROP TABLE IF EXISTS `movies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movies` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tmdb_id` bigint unsigned DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('NOW','SOON') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NOW',
  `duration_min` smallint unsigned NOT NULL,
  `rating_age` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `genres` json DEFAULT NULL,
  `release_date` date DEFAULT NULL,
  `trailer_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `imdb_id` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `original_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `original_language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `poster_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `backdrop_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `popularity` decimal(10,3) DEFAULT NULL,
  `vote_average` decimal(3,1) DEFAULT NULL,
  `vote_count` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_movies_title` (`title`),
  UNIQUE KEY `tmdb_id` (`tmdb_id`),
  KEY `ix_movies_release` (`release_date`)
) ENGINE=InnoDB AUTO_INCREMENT=141 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movies`
--

LOCK TABLES `movies` WRITE;
/*!40000 ALTER TABLE `movies` DISABLE KEYS */;
INSERT INTO `movies` VALUES (131,1078605,'Giờ Mất Tích','NOW',129,'R','[\"Phim Kinh Dị\", \"Phim Bí Ẩn\"]','2025-08-04','https://www.youtube.com/watch?v=QKHySfXqN0I','Khi tất cả học sinh trong cùng một lớp bất ngờ biến mất trong cùng một đêm, vào đúng một thời điểm — chỉ trừ lại một em nhỏ duy nhất — cả cộng đồng rơi vào hoang mang tột độ, tự hỏi: ai… hoặc điều gì đứng sau sự biến mất bí ẩn ấy?','2025-09-17 16:02:12','2025-09-19 05:29:01','tt26581740','Weapons','en','/lVY3xYt7ai6ahduq3D7F2z5wwin.jpg','/Q2OajDi2kcO6yErb1IAyVDTKMs.jpg',460.198,7.4,1350),(132,1038392,'Ám Ảnh Kinh Hoàng: Nghi Lễ Cuối Cùng','NOW',135,'R','[\"Phim Kinh Dị\"]','2025-09-03','https://www.youtube.com/watch?v=p4aWdkM5xF8','Hai nhà điều tra hiện tượng siêu nhiên Ed và Lorraine Warren đối mặt với một vụ án kinh hoàng cuối cùng — nơi họ buộc phải đối đầu với những thực thể bí ẩn đầy đe dọa, thách thức tất cả những gì họ từng tin tưởng.','2025-09-18 14:26:28','2025-09-20 04:10:22','tt22898462','The Conjuring: Last Rites','en','/sjvW985erG7NSKJScFNhLbjhyma.jpg','/fq8gLtrz1ByW3KQ2IM3RMZEIjsQ.jpg',326.662,6.6,364),(133,1035259,'Họng Súng Vô Hình','NOW',85,'PG-13','[\"Phim Hài\", \"Phim Hành Động\", \"Phim Hình Sự\"]','2025-07-30','https://www.youtube.com/watch?v=uLguU7WLreA','Họng Súng Vô Hình là phần tiếp theo của thương hiệu hài giả tội phạm đình đám The Naked Gun, lần này nhân vật trung úy Frank Drebin Jr. – do Liam Neeson thủ vai – tiếp bước cha mình để điều tra một vụ ám sát liên quan đến anh trai của quý cô Beth. Bộ phim mang phong cách hài hành động châm biếm, kết hợp giữa các tình huống đối kháng kịch tính và cú lừa đảo đầy hài hước đậm chất “ngơ ngơ nhưng cực quyết liệt.','2025-09-18 15:45:24','2025-09-18 15:45:54','tt3402138','The Naked Gun','en','/zXM4DvkQKPaLjsbnKezjzS43Ind.jpg','/kzeBfhXMRWiykBsqoL3UbfaM0S.jpg',206.636,6.7,664),(135,1311031,'Thanh Gươm Diệt Quỷ: Vô Hạn Thành','NOW',155,'R','[\"Phim Hoạt Hình\", \"Phim Hành Động\", \"Phim Giả Tượng\", \"Phim Gây Cấn\"]','2025-07-18','https://www.youtube.com/watch?v=juD6zgap4-I','Khi các thành viên của Sát Quỷ Đoàn và Trụ Cột tham gia vào chương trình đặc huấn để chuẩn bị cho trận chiến sắp với lũ quỷ, Kibutsuji Muzan xuất hiện tại Dinh thự Ubuyashiki. Khi thủ lĩnh của Sát Quỷ Đoàn gặp nguy hiểm, Tanjiro và các Trụ Cột trở về trụ sở Thế nhưng, Muzan bất ngờ kéo toàn bộ Sát Quỷ Đoàn đến hang ổ cuối cùng của lũ quỷ là Vô Hạn Thành, mở màn cho trận đánh cuối cùng của cả hai phe.','2025-09-19 16:54:28','2025-09-19 16:54:28','tt32820897','劇場版「鬼滅の刃」無限城編 第一章 猗窩座再来','ja','/nV99ACeAa8fFFso0tQZ3HktEf5X.jpg','/1RgPyOhN4DRs225BGTlHJqCudII.jpg',812.633,7.6,266);
/*!40000 ALTER TABLE `movies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `kind` enum('TICKET','COMBO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ref_id` bigint unsigned NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `qty` int unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_oit_order` (`order_id`),
  CONSTRAINT `fk_oit_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_code` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `status` enum('pending','confirmed','expired','canceled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `confirmed_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_code` (`order_code`),
  KEY `idx_orders_user_created` (`user_id`,`created_at`),
  KEY `ix_orders_exp` (`status`,`expires_at`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_ipn_logs`
--

DROP TABLE IF EXISTS `payment_ipn_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_ipn_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `payment_id` bigint unsigned NOT NULL,
  `received_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `query_raw` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `signature_valid` tinyint(1) NOT NULL,
  `response_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_ipn_payment` (`payment_id`),
  CONSTRAINT `fk_ipn_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_ipn_logs`
--

LOCK TABLES `payment_ipn_logs` WRITE;
/*!40000 ALTER TABLE `payment_ipn_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_ipn_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `provider` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ref_code` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `merchant_txn_ref` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VND',
  `status` enum('INITIATED','SUCCESS','FAILED','REFUNDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INITIATED',
  `payload` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `bank_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pay_date` datetime DEFAULT NULL,
  `client_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ipn_verified` tinyint(1) NOT NULL DEFAULT '0',
  `ipn_at` datetime DEFAULT NULL,
  `fail_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ref_code` (`ref_code`),
  UNIQUE KEY `merchant_txn_ref` (`merchant_txn_ref`),
  KEY `fk_payments_order` (`order_id`),
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `movie_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `rating` tinyint unsigned NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_reviews_user` (`user_id`),
  KEY `idx_reviews_movie` (`movie_id`),
  CONSTRAINT `fk_reviews_movie` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `branch_id` bigint unsigned NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `format_type` enum('2D','3D','IMAX','4DX') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '2D',
  `capacity` int unsigned NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_rooms_branch` (`branch_id`),
  CONSTRAINT `fk_rooms_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=901 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (4,15,'Phòng 1','3D',90,1,'2025-09-18 05:50:30','2025-09-20 02:52:40'),(5,15,'Phòng 2','2D',150,1,'2025-09-18 13:31:08','2025-09-20 01:09:38'),(6,15,'Phòng 3','IMAX',0,1,'2025-09-18 14:26:03','2025-09-19 05:27:25');
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seat_holds`
--

DROP TABLE IF EXISTS `seat_holds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seat_holds` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `showtime_id` bigint unsigned NOT NULL,
  `seat_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `expire_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_hold_seat` (`showtime_id`,`seat_id`),
  KEY `idx_seat_holds_expire` (`expire_at`),
  KEY `fk_holds_seat` (`seat_id`),
  KEY `fk_holds_user` (`user_id`),
  CONSTRAINT `fk_holds_seat` FOREIGN KEY (`seat_id`) REFERENCES `seats` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_holds_showtime` FOREIGN KEY (`showtime_id`) REFERENCES `showtimes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_holds_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seat_holds`
--

LOCK TABLES `seat_holds` WRITE;
/*!40000 ALTER TABLE `seat_holds` DISABLE KEYS */;
/*!40000 ALTER TABLE `seat_holds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seats`
--

DROP TABLE IF EXISTS `seats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seats` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `room_id` bigint unsigned NOT NULL,
  `row_label` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `col_number` smallint unsigned NOT NULL,
  `seat_type` enum('STANDARD','VIP','DOUBLE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STANDARD',
  `is_accessible` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_seats_unique` (`room_id`,`row_label`,`col_number`),
  CONSTRAINT `fk_seats_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5321 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seats`
--

LOCK TABLES `seats` WRITE;
/*!40000 ALTER TABLE `seats` DISABLE KEYS */;
INSERT INTO `seats` VALUES (5081,4,'A',1,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5082,4,'A',2,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5083,4,'A',3,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5084,4,'A',4,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5085,4,'A',5,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5086,4,'A',6,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5087,4,'A',7,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5088,4,'A',8,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5089,4,'A',9,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5090,4,'A',10,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5091,4,'B',1,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5092,4,'B',2,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5093,4,'B',3,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5094,4,'B',4,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5095,4,'B',5,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5096,4,'B',6,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5097,4,'B',7,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5098,4,'B',8,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5099,4,'B',9,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5100,4,'B',10,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5101,4,'C',1,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5102,4,'C',2,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5103,4,'C',3,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5104,4,'C',4,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5105,4,'C',5,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5106,4,'C',6,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5107,4,'C',7,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5108,4,'C',8,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5109,4,'C',9,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5110,4,'C',10,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5111,4,'D',1,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5112,4,'D',2,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5113,4,'D',3,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5114,4,'D',4,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5115,4,'D',5,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5116,4,'D',6,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5117,4,'D',7,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5118,4,'D',8,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5119,4,'D',9,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5120,4,'D',10,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5121,4,'E',1,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5122,4,'E',2,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5123,4,'E',3,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5124,4,'E',4,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5125,4,'E',5,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5126,4,'E',6,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5127,4,'E',7,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5128,4,'E',8,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5129,4,'E',9,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5130,4,'E',10,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5131,4,'F',1,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5132,4,'F',2,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5133,4,'F',3,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5134,4,'F',4,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5135,4,'F',5,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5136,4,'F',6,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5137,4,'F',7,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5138,4,'F',8,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5139,4,'F',9,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5140,4,'F',10,'STANDARD',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5141,4,'G',1,'VIP',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5142,4,'G',2,'VIP',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5143,4,'G',3,'VIP',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5144,4,'G',4,'VIP',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5145,4,'G',5,'VIP',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5146,4,'G',6,'VIP',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5147,4,'G',7,'VIP',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5148,4,'G',8,'VIP',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5149,4,'G',9,'VIP',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5150,4,'G',10,'VIP',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5151,4,'H',1,'VIP',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5152,4,'H',2,'VIP',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5153,4,'H',3,'VIP',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5154,4,'H',4,'VIP',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5155,4,'H',5,'VIP',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5156,4,'H',6,'VIP',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5157,4,'H',7,'VIP',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5158,4,'H',8,'VIP',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5159,4,'H',9,'VIP',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5160,4,'H',10,'VIP',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5161,4,'I',1,'DOUBLE',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5162,4,'I',2,'DOUBLE',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5163,4,'I',3,'DOUBLE',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5164,4,'I',4,'DOUBLE',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5165,4,'I',5,'DOUBLE',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5166,4,'I',6,'DOUBLE',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5167,4,'I',7,'DOUBLE',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5168,4,'I',8,'DOUBLE',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5169,4,'I',9,'DOUBLE',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5170,4,'I',10,'DOUBLE',0,'2025-09-19 03:56:40','2025-09-19 03:56:40'),(5171,5,'A',1,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5172,5,'A',2,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5173,5,'A',3,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5174,5,'A',4,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5175,5,'A',5,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5176,5,'A',6,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5177,5,'A',7,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5178,5,'A',8,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5179,5,'A',9,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5180,5,'A',10,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5181,5,'A',11,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5182,5,'A',12,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5183,5,'A',13,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5184,5,'A',14,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5185,5,'A',15,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5186,5,'B',15,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5187,5,'B',14,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5188,5,'B',13,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5189,5,'B',1,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5190,5,'B',2,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5191,5,'B',3,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5192,5,'B',4,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5193,5,'B',5,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5194,5,'B',6,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5195,5,'B',7,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5196,5,'B',8,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5197,5,'B',9,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5198,5,'B',10,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5199,5,'B',11,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5200,5,'B',12,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5201,5,'C',1,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5202,5,'C',2,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5203,5,'C',3,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5204,5,'C',4,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5205,5,'C',5,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5206,5,'C',6,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5207,5,'C',7,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5208,5,'C',8,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5209,5,'C',9,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5210,5,'C',10,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5211,5,'C',11,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5212,5,'C',12,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5213,5,'C',13,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5214,5,'C',14,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5215,5,'C',15,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5216,5,'D',15,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5217,5,'D',14,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5218,5,'D',13,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5219,5,'D',11,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5220,5,'D',12,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5221,5,'D',9,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5222,5,'D',10,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5223,5,'D',8,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5224,5,'D',7,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5225,5,'D',6,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5226,5,'D',4,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5227,5,'D',1,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5228,5,'D',2,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5229,5,'D',3,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5230,5,'D',5,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5231,5,'E',1,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5232,5,'E',2,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5233,5,'E',3,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5234,5,'E',4,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5235,5,'E',5,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5236,5,'E',6,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5237,5,'E',7,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5238,5,'E',8,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5239,5,'E',9,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5240,5,'E',11,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5241,5,'E',14,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5242,5,'E',15,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5243,5,'E',10,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5244,5,'E',12,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5245,5,'E',13,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5246,5,'F',1,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5247,5,'F',2,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5248,5,'F',3,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5249,5,'F',4,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5250,5,'F',5,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5251,5,'F',6,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5252,5,'F',7,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5253,5,'F',10,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5254,5,'F',9,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5255,5,'F',8,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5256,5,'F',11,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5257,5,'F',12,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5258,5,'F',14,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5259,5,'F',15,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5260,5,'F',13,'STANDARD',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5261,5,'G',1,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5262,5,'H',1,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5263,5,'I',1,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5264,5,'G',2,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5265,5,'H',2,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5266,5,'I',2,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5267,5,'H',3,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5268,5,'I',3,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5269,5,'G',3,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5270,5,'G',4,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5271,5,'H',4,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5272,5,'I',4,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5273,5,'G',5,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5274,5,'H',5,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5275,5,'I',5,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5276,5,'G',6,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5277,5,'H',6,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5278,5,'I',6,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5279,5,'G',7,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5280,5,'H',7,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5281,5,'I',7,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5282,5,'G',8,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5283,5,'H',8,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5284,5,'I',8,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5285,5,'G',9,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5286,5,'H',9,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5287,5,'I',9,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5288,5,'G',10,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5289,5,'I',10,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5290,5,'H',10,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5291,5,'G',11,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5292,5,'H',11,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5293,5,'I',11,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5294,5,'G',12,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5295,5,'H',12,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5296,5,'I',12,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5297,5,'G',13,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5298,5,'H',13,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5299,5,'I',13,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5300,5,'G',14,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5301,5,'H',14,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5302,5,'I',14,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5303,5,'G',15,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5304,5,'H',15,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5305,5,'I',15,'VIP',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5306,5,'J',1,'DOUBLE',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5307,5,'J',2,'DOUBLE',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5308,5,'J',3,'DOUBLE',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5309,5,'J',4,'DOUBLE',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5310,5,'J',5,'DOUBLE',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5311,5,'J',6,'DOUBLE',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5312,5,'J',7,'DOUBLE',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5313,5,'J',8,'DOUBLE',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5314,5,'J',9,'DOUBLE',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5315,5,'J',10,'DOUBLE',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5316,5,'J',11,'DOUBLE',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5317,5,'J',12,'DOUBLE',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5318,5,'J',13,'DOUBLE',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5319,5,'J',14,'DOUBLE',0,'2025-09-19 03:59:50','2025-09-19 03:59:50'),(5320,5,'J',15,'DOUBLE',0,'2025-09-19 03:59:50','2025-09-19 03:59:50');
/*!40000 ALTER TABLE `seats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `showtimes`
--

DROP TABLE IF EXISTS `showtimes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `showtimes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `movie_id` bigint unsigned NOT NULL,
  `room_id` bigint unsigned NOT NULL,
  `start_at` datetime NOT NULL,
  `end_at` datetime NOT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `language` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtitle` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('SCHEDULED','CANCELLED','ENDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SCHEDULED',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_showtimes_room_start` (`room_id`,`start_at`),
  KEY `fk_showtimes_movie` (`movie_id`),
  CONSTRAINT `fk_showtimes_movie` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_showtimes_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_showtime_time` CHECK ((`end_at` > `start_at`))
) ENGINE=InnoDB AUTO_INCREMENT=3012 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `showtimes`
--

LOCK TABLES `showtimes` WRITE;
/*!40000 ALTER TABLE `showtimes` DISABLE KEYS */;
INSERT INTO `showtimes` VALUES (3006,131,4,'2025-09-19 20:00:00','2025-09-19 22:09:00',50000.00,NULL,NULL,'SCHEDULED','2025-09-18 08:47:52','2025-09-19 05:26:43'),(3007,132,5,'2025-09-20 00:01:00','2025-09-20 02:16:00',50000.00,NULL,NULL,'SCHEDULED','2025-09-18 15:08:29','2025-09-20 02:53:50'),(3008,133,4,'2025-09-19 09:10:00','2025-09-19 10:35:00',90000.00,NULL,NULL,'SCHEDULED','2025-09-19 04:52:22','2025-09-19 05:40:51'),(3009,135,6,'2025-09-20 23:00:00','2025-09-21 01:35:00',90000.00,NULL,NULL,'SCHEDULED','2025-09-20 02:53:41','2025-09-20 02:54:12'),(3010,131,4,'2025-09-20 23:00:00','2025-09-21 01:09:00',90000.00,NULL,NULL,'SCHEDULED','2025-09-20 04:20:15','2025-09-20 04:20:15'),(3011,132,5,'2025-09-20 18:30:00','2025-09-20 20:45:00',50000.00,NULL,NULL,'SCHEDULED','2025-09-20 04:23:34','2025-09-20 04:23:34');
/*!40000 ALTER TABLE `showtimes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tickets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `showtime_id` bigint unsigned NOT NULL,
  `seat_id` bigint unsigned NOT NULL,
  `qr_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ISSUED','SCANNED','REFUNDED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ISSUED',
  `scanned_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `qr_code` (`qr_code`),
  UNIQUE KEY `uq_ticket_seat` (`showtime_id`,`seat_id`),
  UNIQUE KEY `uq_ticket_qr` (`showtime_id`,`qr_code`),
  KEY `idx_tickets_showtime` (`showtime_id`),
  KEY `fk_tickets_order` (`order_id`),
  KEY `fk_tickets_seat` (`seat_id`),
  CONSTRAINT `fk_tickets_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_tickets_seat` FOREIGN KEY (`seat_id`) REFERENCES `seats` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_tickets_showtime` FOREIGN KEY (`showtime_id`) REFERENCES `showtimes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN','STAFF','USER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (11,'Admin','admin@gmail.com',NULL,'$2b$10$y5651plK1MZEJ6JHUfTjZeRmg.cc4Rkyhoo.jej2IuMn3b8RDibC2','ADMIN',1,'2025-09-17 02:59:28','2025-09-17 02:59:28'),(12,'User Test','user@gmail.com',NULL,'$2b$10$shgI1DuDOrXdFSKdxOwDhuP3.ulYkhKs3b3XpSuAb1L3n1C5OvqJG','USER',1,'2025-09-17 02:59:41','2025-09-18 14:42:24'),(13,'Bảo','kbao230104@gmail.com',NULL,'$2b$10$oH6Qn9.X8JzqSNS3eRBGzOZQtiSTPvfVdFzj0If4pPP6jHXViB39C','USER',1,'2025-09-17 03:46:52','2025-09-18 14:42:18');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `voucher_usages`
--

DROP TABLE IF EXISTS `voucher_usages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voucher_usages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `voucher_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `order_id` bigint unsigned NOT NULL,
  `used_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_voucher_usage` (`voucher_id`,`user_id`,`order_id`),
  KEY `fk_vu_user` (`user_id`),
  CONSTRAINT `fk_vu_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_vu_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `voucher_usages`
--

LOCK TABLES `voucher_usages` WRITE;
/*!40000 ALTER TABLE `voucher_usages` DISABLE KEYS */;
/*!40000 ALTER TABLE `voucher_usages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vouchers`
--

DROP TABLE IF EXISTS `vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vouchers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` enum('PERCENT','AMOUNT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `min_total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `expiry_at` datetime DEFAULT NULL,
  `quota` int unsigned DEFAULT NULL,
  `per_user_limit` int unsigned NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  CONSTRAINT `chk_voucher_value` CHECK ((`value` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vouchers`
--

LOCK TABLES `vouchers` WRITE;
/*!40000 ALTER TABLE `vouchers` DISABLE KEYS */;
INSERT INTO `vouchers` VALUES (4,'JHSTK8PDQ2','AMOUNT',50000.00,1.00,'2025-09-25 15:35:00',1,1,1,'2025-09-19 02:33:04','2025-09-19 04:21:15');
/*!40000 ALTER TABLE `vouchers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-20 11:51:19
