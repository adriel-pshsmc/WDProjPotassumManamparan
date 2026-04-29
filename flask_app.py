"""Minimal Flask application demonstrating how to use `config.get_database_uri()`.

This file is intentionally small — it's an example you can drop into an
existing Flask project or use as a starting point for migration to Neon.
"""
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
import config as app_config

db = SQLAlchemy()


def create_app():
    app = Flask(__name__)
    # Load SQLALCHEMY config from our helper (DATABASE_URL or sqlite fallback)
    app.config.update(app_config.get_sqlalchemy_config())

    db.init_app(app)

    @app.route('/')
    def index():
        return 'Flask app running — DB: ' + app.config.get('SQLALCHEMY_DATABASE_URI', '')

    @app.route('/health')
    def health():
        return jsonify({ 'ok': True })

    return app


if __name__ == '__main__':
    create_app().run(host='127.0.0.1', port=5000, debug=True)
