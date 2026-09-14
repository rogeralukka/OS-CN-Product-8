"""
app.py
======
Flask REST API for Industrial Machine Log Integrity Checker

Endpoints:
1. POST /api/compute
   Request Body:  { "log": "<original text>" }
   Response Body: {
     "crc": "<32-bit binary string>",
     "divisor": "<33-bit binary string>",
     "steps": { "original_text", "binary", "padded", "divisor", "remainder", "hex" }
   }

2. POST /api/verify
   Request Body:  { "log": "<received text>", "crc": "<32-bit string>" }
   Response Body: {
     "accepted": true/false,
     "divisor": "<same 33-bit divisor>",
     "steps": { "received_text", "binary", "codeword", "divisor", "remainder" }
   }

3. GET /api/divisor
   Response Body: { "divisor": "<33-bit binary string>" }
"""

import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from crc_checker import compute_crc, verify, get_divisor

# Initialize Flask app
app = Flask(__name__, static_folder="../frontend", static_url_path="")

# Enable CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint providing session divisor."""
    return jsonify({
        "status": "online",
        "service": "Industrial Machine Log Integrity Checker API",
        "divisor": get_divisor()
    }), 200


@app.route("/api/divisor", methods=["GET"])
def get_current_divisor():
    """Returns the session-level fixed 33-bit generator polynomial."""
    return jsonify({
        "divisor": get_divisor()
    }), 200


@app.route("/api/compute", methods=["POST"])
def api_compute():
    """
    Computes CRC-32 for original log text using session divisor.
    """
    data = request.get_json(silent=True) or {}
    
    if "log" not in data:
        return jsonify({"error": "Missing 'log' parameter in request body."}), 400
    
    log_line = str(data.get("log", ""))
    result = compute_crc(log_line)
    
    return jsonify(result), 200


@app.route("/api/verify", methods=["POST"])
def api_verify():
    """
    Verifies received log text and CRC against session divisor.
    """
    data = request.get_json(silent=True) or {}
    
    if "log" not in data or "crc" not in data:
        return jsonify({"error": "Missing 'log' or 'crc' parameter in request body."}), 400
    
    log_line = str(data.get("log", ""))
    received_crc = str(data.get("crc", ""))
    
    result = verify(log_line, received_crc)
    
    return jsonify(result), 200


# Static Frontend Routes
@app.route("/")
def serve_index():
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
    return send_from_directory(frontend_dir, "index.html")


@app.route("/<path:path>")
def serve_static(path):
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
    return send_from_directory(frontend_dir, path)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    current_divisor = get_divisor()
    print(f"[*] Starting Industrial Machine Log Integrity Checker API on port {port}...")
    print(f"[*] Session Fixed Divisor: {current_divisor} (33 bits)")
    app.run(host="0.0.0.0", port=port, debug=True)
