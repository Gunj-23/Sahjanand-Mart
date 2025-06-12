import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Config:
    SECRET_KEY = 'your-secret-key-here'  # Change for production
    DATABASE_PATH = os.path.join(BASE_DIR, 'database', 'sahjanand_mart.db')
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{DATABASE_PATH}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False