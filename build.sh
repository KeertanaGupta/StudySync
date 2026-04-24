#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Running collectstatic and migrate..."
cd backend
python manage.py collectstatic --no-input
python manage.py migrate
