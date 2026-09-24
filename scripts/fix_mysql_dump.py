import os
import sqlite3

root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
db_path = os.path.join(root, 'backend', 'database', 'database.sqlite')
out_path = os.path.join(root, 'cpanel-packages', 'finagrow-db.sql')

if not os.path.exists(db_path):
    raise FileNotFoundError(f'Database not found: {db_path}')

os.makedirs(os.path.dirname(out_path), exist_ok=True)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

table_order = ['users', 'subscriptions', 'assets', 'coa_accounts', 'transactions', 'migrations']

with open(out_path, 'w', encoding='utf-8') as file:
    file.write("SET FOREIGN_KEY_CHECKS=0;\n\n")

    for table in table_order:
        if table == 'users':
            file.write("DROP TABLE IF EXISTS `users`;\n")
            file.write("CREATE TABLE `users` (\n")
            file.write("  `id` INT NOT NULL AUTO_INCREMENT,\n")
            file.write("  `name` VARCHAR(255) NOT NULL,\n")
            file.write("  `email` VARCHAR(255) NOT NULL,\n")
            file.write("  `phone` VARCHAR(255) DEFAULT NULL,\n")
            file.write("  `email_verified_at` DATETIME DEFAULT NULL,\n")
            file.write("  `password` VARCHAR(255) NOT NULL,\n")
            file.write("  `role` VARCHAR(50) NOT NULL DEFAULT 'user',\n")
            file.write("  `is_pro` TINYINT(1) NOT NULL DEFAULT 0,\n")
            file.write("  `is_banned` TINYINT(1) NOT NULL DEFAULT 0,\n")
            file.write("  `api_token` VARCHAR(255) DEFAULT NULL,\n")
            file.write("  `avatar` TEXT DEFAULT NULL,\n")
            file.write("  `job_title` VARCHAR(255) DEFAULT NULL,\n")
            file.write("  `department` VARCHAR(255) DEFAULT NULL,\n")
            file.write("  `cost_center` VARCHAR(255) DEFAULT NULL,\n")
            file.write("  `employee_id` VARCHAR(255) DEFAULT NULL,\n")
            file.write("  `remember_token` VARCHAR(255) DEFAULT NULL,\n")
            file.write("  `created_at` DATETIME DEFAULT NULL,\n")
            file.write("  `updated_at` DATETIME DEFAULT NULL,\n")
            file.write("  PRIMARY KEY (`id`),\n")
            file.write("  UNIQUE KEY `users_email_unique` (`email`)\n")
            file.write(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n")

        elif table == 'subscriptions':
            file.write("DROP TABLE IF EXISTS `subscriptions`;\n")
            file.write("CREATE TABLE `subscriptions` (\n")
            file.write("  `id` INT NOT NULL AUTO_INCREMENT,\n")
            file.write("  `user_id` INT NOT NULL,\n")
            file.write("  `plan` VARCHAR(50) NOT NULL DEFAULT 'Free',\n")
            file.write("  `status` VARCHAR(50) NOT NULL DEFAULT 'active',\n")
            file.write("  `price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,\n")
            file.write("  `start_date` DATETIME DEFAULT NULL,\n")
            file.write("  `end_date` DATETIME DEFAULT NULL,\n")
            file.write("  `created_at` DATETIME DEFAULT NULL,\n")
            file.write("  `updated_at` DATETIME DEFAULT NULL,\n")
            file.write("  PRIMARY KEY (`id`),\n")
            file.write("  KEY `subscriptions_user_id_foreign` (`user_id`),\n")
            file.write("  CONSTRAINT `subscriptions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE\n")
            file.write(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n")

        elif table == 'assets':
            file.write("DROP TABLE IF EXISTS `assets`;\n")
            file.write("CREATE TABLE `assets` (\n")
            file.write("  `id` VARCHAR(255) NOT NULL,\n")
            file.write("  `user_id` INT NOT NULL,\n")
            file.write("  `code` VARCHAR(255) DEFAULT NULL,\n")
            file.write("  `name` VARCHAR(255) NOT NULL,\n")
            file.write("  `category` VARCHAR(255) NOT NULL DEFAULT 'Equipment',\n")
            file.write("  `purchase_date` DATE NOT NULL,\n")
            file.write("  `purchase_cost` DECIMAL(15,2) NOT NULL DEFAULT 0.00,\n")
            file.write("  `useful_life` INT NOT NULL DEFAULT 5,\n")
            file.write("  `depreciation_method` VARCHAR(255) NOT NULL DEFAULT 'Straight Line',\n")
            file.write("  `created_at` DATETIME DEFAULT NULL,\n")
            file.write("  `updated_at` DATETIME DEFAULT NULL,\n")
            file.write("  PRIMARY KEY (`id`),\n")
            file.write("  KEY `assets_user_id_foreign` (`user_id`),\n")
            file.write("  CONSTRAINT `assets_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE\n")
            file.write(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n")

        elif table == 'coa_accounts':
            file.write("DROP TABLE IF EXISTS `coa_accounts`;\n")
            file.write("CREATE TABLE `coa_accounts` (\n")
            file.write("  `id` VARCHAR(255) NOT NULL,\n")
            file.write("  `user_id` INT NOT NULL,\n")
            file.write("  `code` VARCHAR(255) NOT NULL,\n")
            file.write("  `name` VARCHAR(255) NOT NULL,\n")
            file.write("  `type` VARCHAR(255) NOT NULL DEFAULT 'Asset',\n")
            file.write("  `description` TEXT DEFAULT NULL,\n")
            file.write("  `parent_account_id` VARCHAR(255) DEFAULT NULL,\n")
            file.write("  `opening_balance` DECIMAL(15,2) NOT NULL DEFAULT 0.00,\n")
            file.write("  `created_at` DATETIME DEFAULT NULL,\n")
            file.write("  `updated_at` DATETIME DEFAULT NULL,\n")
            file.write("  PRIMARY KEY (`id`),\n")
            file.write("  KEY `coa_accounts_user_id_foreign` (`user_id`),\n")
            file.write("  CONSTRAINT `coa_accounts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE\n")
            file.write(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n")

        elif table == 'transactions':
            file.write("DROP TABLE IF EXISTS `transactions`;\n")
            file.write("CREATE TABLE `transactions` (\n")
            file.write("  `id` VARCHAR(255) NOT NULL,\n")
            file.write("  `user_id` INT NOT NULL,\n")
            file.write("  `description` VARCHAR(255) NOT NULL,\n")
            file.write("  `amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,\n")
            file.write("  `date` DATE NOT NULL,\n")
            file.write("  `type` VARCHAR(50) NOT NULL DEFAULT 'income',\n")
            file.write("  `category` VARCHAR(255) NOT NULL DEFAULT 'General',\n")
            file.write("  `status` VARCHAR(50) NOT NULL DEFAULT 'Completed',\n")
            file.write("  `vendor` VARCHAR(255) DEFAULT NULL,\n")
            file.write("  `customer` VARCHAR(255) DEFAULT NULL,\n")
            file.write("  `payment_method` VARCHAR(255) DEFAULT NULL,\n")
            file.write("  `notes` TEXT DEFAULT NULL,\n")
            file.write("  `entity` VARCHAR(255) NOT NULL DEFAULT 'E1',\n")
            file.write("  `dr` VARCHAR(255) DEFAULT NULL,\n")
            file.write("  `cr` VARCHAR(255) DEFAULT NULL,\n")
            file.write("  `cur` VARCHAR(50) NOT NULL DEFAULT 'IDR',\n")
            file.write("  `created_at` DATETIME DEFAULT NULL,\n")
            file.write("  `updated_at` DATETIME DEFAULT NULL,\n")
            file.write("  PRIMARY KEY (`id`),\n")
            file.write("  KEY `transactions_user_id_foreign` (`user_id`),\n")
            file.write("  CONSTRAINT `transactions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE\n")
            file.write(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n")

        elif table == 'migrations':
            file.write("DROP TABLE IF EXISTS `migrations`;\n")
            file.write("CREATE TABLE `migrations` (\n")
            file.write("  `id` INT NOT NULL AUTO_INCREMENT,\n")
            file.write("  `migration` VARCHAR(255) NOT NULL,\n")
            file.write("  `batch` INT NOT NULL,\n")
            file.write("  PRIMARY KEY (`id`)\n")
            file.write(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n")

        columns = [col[1] for col in cur.execute(f"PRAGMA table_info(`{table}`)").fetchall()]
        rows = cur.execute(f"SELECT * FROM `{table}`").fetchall()

        if rows:
            file.write(f"INSERT INTO `{table}` (`{'`,`'.join(columns)}`) VALUES\n")
            values_list = []
            for row in rows:
                values = []
                for value in row:
                    if value is None:
                        values.append('NULL')
                    elif isinstance(value, str):
                        escaped = value.replace("\\", "\\\\").replace("'", "''")
                        values.append(f"'{escaped}'")
                    else:
                        values.append(str(value))
                values_list.append("(" + ", ".join(values) + ")")
            file.write(',\n'.join(values_list) + ";\n\n")

    file.write("SET FOREIGN_KEY_CHECKS=1;\n")

conn.close()
print(f"MySQL dump written to {out_path}")
