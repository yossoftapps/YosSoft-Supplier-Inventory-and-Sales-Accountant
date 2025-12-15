# إعدادات التطبيق
import os

# مسارات التطبيق
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, 'data')
DATABASE_DIR = os.path.join(DATA_DIR, 'database')
BACKUP_DIR = os.path.join(DATA_DIR, 'backups')
LOG_DIR = os.path.join(DATA_DIR, 'logs')

# مسارات قواعد البيانات
DB_PATHS = {
    'customers': os.path.join(DATABASE_DIR, 'customers.db'),
    'suppliers': os.path.join(DATABASE_DIR, 'suppliers.db'),
    'products': os.path.join(DATABASE_DIR, 'products.db'),
    'sales': os.path.join(DATABASE_DIR, 'sales.db'),
    'purchases': os.path.join(DATABASE_DIR, 'purchases.db'),
    'expenses': os.path.join(DATABASE_DIR, 'expenses.db'),
    'reports': os.path.join(DATABASE_DIR, 'reports.db')
}

# إعدادات النسخ الاحتياطي
BACKUP_INTERVAL_DAYS = 7
MAX_BACKUPS = 10

# إعدادات السجلات
LOG_LEVEL = 'INFO'
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

# إعدادات الواجهة
APP_TITLE = 'YosSoft Supplier, Inventory and Sales Accountant'
APP_VERSION = '1.0.0'
WINDOW_WIDTH = 1200
WINDOW_HEIGHT = 800

# إعدادات اللغة
DEFAULT_LANGUAGE = 'ar'
SUPPORTED_LANGUAGES = ['ar', 'en']
