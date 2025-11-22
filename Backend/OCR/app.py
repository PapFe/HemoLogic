from flask import Flask, request, jsonify
from flask_cors import CORS
from OCR_engine import make_mock_data
app = Flask(__name__)
CORS(app)
@app.route("/api/hello", methods=["POST"])
def hello():
    # Check if a file was included
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    filename = file.filename

    return jsonify(make_mock_data(filename)), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
