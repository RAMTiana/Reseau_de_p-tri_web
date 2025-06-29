from .petri_net import Place, Transition

class ElevatorSimulator:
    def __init__(self):
        self.p0 = Place("Idle", tokens=1)
        self.p1 = Place("MovingUp")
        self.p3 = Place("DoorOpen")

        self.t0 = Transition("CallElevator")
        self.t0.add_input(self.p0)
        self.t0.add_output(self.p1)

        self.t1 = Transition("ArriveUp")
        self.t1.add_input(self.p1)
        self.t1.add_output(self.p3)

        self.t2 = Transition("CloseDoor")
        self.t2.add_input(self.p3)
        self.t2.add_output(self.p0)

        self.transitions = [self.t0, self.t1, self.t2]

    def get_state(self):
        return {
            'Idle': self.p0.tokens,
            'MovingUp': self.p1.tokens,
            'DoorOpen': self.p3.tokens
        }

    def fire(self, transition_name):
        for t in self.transitions:
            if t.name == transition_name and t.is_enabled():
                t.fire()
                return f"Transition {transition_name} fired"
        return f"Transition {transition_name} not enabled"
