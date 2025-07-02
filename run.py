from flask import Flask
from app import create_app
import os

template_dir = os.path.abspath('templates')
static_dir = os.path.abspath('static')

app = create_app()

if __name__ == "__main__":
    app.template_folder = template_dir
    app.static_folder = static_dir
    app.run(debug=True)
