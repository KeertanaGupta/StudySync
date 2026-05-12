#!/usr/bin/env bash
# Render Build Script for StudySync Django Backend
set -o errexit

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn whitenoise python-dotenv

# Collect static files
cd backend
python manage.py collectstatic --no-input

# Run database migrations
python manage.py migrate
