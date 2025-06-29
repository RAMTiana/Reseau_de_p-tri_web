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

@main.route('/enabled', methods=["POST"])
def enabled():
    data = request.json
    transition_name = data.get("transition")
    # vérifier si la transition est activée
    for t in simulator.transitions:
        if t.name == transition_name:
            return jsonify({"enabled": t.is_enabled()})
    return jsonify({"enabled": False})
