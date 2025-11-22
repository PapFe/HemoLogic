from flask import Flask, request, jsonify
from flask_cors import CORS
from OCR_engine import make_mock_data
import requests
app = Flask(__name__)
CORS(app)
CLASSIFIER_URL = "http://127.0.0.1:5002/api/hello"
@app.route("/api/hello", methods=["POST"])
def hello():
    # Check if a file was included
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    uploaded_file = request.files["file"]

    # ---- 1) FORWARD TO CLASSIFIER SERVICE ----
    files = {
        "file": (uploaded_file.filename, uploaded_file.stream, uploaded_file.mimetype)
    }

    try:
        classifier_response = requests.post(CLASSIFIER_URL, files=files)
        classifier_json = classifier_response.json()
        print(classifier_json)
    except Exception as e:
        print(jsonify({"error": "Classifier service request failed", "details": str(e)}), 500)

    filename = uploaded_file.filename

    return jsonify(make_mock_data(filename)), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
