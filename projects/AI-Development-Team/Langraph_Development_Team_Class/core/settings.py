"""Application settings and environment loading."""
import os
from pathlib import Path
from dotenv import load_dotenv

PROJECT_DIR = Path(__file__).resolve().parents[1]
load_dotenv(PROJECT_DIR / ".env")
