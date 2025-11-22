from flask import Flask, request, jsonify
from flask_cors import CORS
from agent import MOCK_DATA
app = Flask(__name__)
CORS(app)
@app.route("/api/hello", methods=["POST"])
def hello():

    return jsonify({"analysis": MOCK_DATA}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
