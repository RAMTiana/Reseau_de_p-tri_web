from flask import Blueprint, render_template, request, jsonify
from .simulator import ElevatorSimulator

main = Blueprint("main", __name__)
simulator = ElevatorSimulator()

@main.route('/')
def index():
    return render_template("index.html", state=simulator.get_state())

@main.route('/fire', methods=["POST"])
def fire():
    data = request.json
    result = simulator.fire(data.get("transition"))
    return jsonify({
        "result": result,
        "state": simulator.get_state()
    })
