from flask import Flask, request, jsonify
from flask_cors import CORS
from labor_classifier import classify
from pathlib import Path
import tempfile
import os
app = Flask(__name__)
CORS(app)
@app.route("/api/hello", methods=["POST"])
def hello():
    # Check if a file was included
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    uploaded = request.files["file"]

    # Create a temp file with same extension as uploaded file
    suffix = Path(uploaded.filename).suffix
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        temp_path = tmp.name
        uploaded.save(temp_path)

    # Now call your classify() with the temp file path
    try:
        is_synlab, elapsed_time = classify(temp_path)
    finally:
        # Clean up temp file
        print("elapsed time:", elapsed_time)
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return jsonify({
        "is_synlab": is_synlab,
        "time": elapsed_time
    }), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)
