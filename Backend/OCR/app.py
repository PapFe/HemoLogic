from flask import Flask, request, jsonify
from flask_cors import CORS
from OCR_engine import make_mock_data,create_file
import requests
import ocr
import os
app = Flask(__name__)
CORS(app)
#CLASSIFIER_URL = "http://127.0.0.1:5002/api/hello"
CLASSIFIER_URL = os.getenv("CLASSIFIER_URL", "http://127.0.0.1:5002/api/hello")
@app.route("/api/hello", methods=["POST"])
def hello():
    # Check if a file was included
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    uploaded_file = request.files["file"]
    path = create_file(uploaded_file)
    filename = uploaded_file.filename
    # ---- 1) FORWARD TO CLASSIFIER SERVICE ----


    res = ocr.run_ocr(path)


    return jsonify(res), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
