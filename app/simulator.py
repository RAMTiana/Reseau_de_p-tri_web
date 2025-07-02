import time

class Place:
    def __init__(self, name, tokens=0):
        self.name = name
        self.tokens = tokens

    def add_tokens(self, n=1):
        self.tokens += n

    def remove_tokens(self, n=1):
        if self.tokens >= n:
            self.tokens -= n
            return True
        return False

    def __repr__(self):
        return f"{self.name}: {self.tokens}"

class Transition:
    def __init__(self, name, input_places, output_places, condition=None):
        self.name = name
        self.input_places = input_places  # list of tuples (Place, tokens needed)
        self.output_places = output_places  # list of tuples (Place, tokens added)
        self.condition = condition  # fonction optionnelle pour activer transition

    def is_enabled(self):
        # Check tokens in input places
        for place, needed in self.input_places:
            if place.tokens < needed:
                return False
        # Check condition si défini
        if self.condition and not self.condition():
            return False
        return True

    def fire(self):
        if not self.is_enabled():
            return False

        for place, needed in self.input_places:
            place.remove_tokens(needed)
        for place, added in self.output_places:
            place.add_tokens(added)
        return True


class ElevatorSimulator:
    def __init__(self):
        # Places
        self.Idle = Place("Idle", tokens=1)
        self.MovingUp = Place("MovingUp")
        self.MovingDown = Place("MovingDown")
        self.DoorOpen = Place("DoorOpen")
        self.RequestsQueue = Place("RequestsQueue")  # nombre demandes

        # Etat interne
        self.current_floor = 0
        self.max_floor = 5
        self.door_timer = 0  # compte itérations porte ouverte

        self.history = []

        # Condition activation MoveUp : RequestsQueue > 0 et pas déjà MovingDown
        def can_move_up():
            return self.RequestsQueue.tokens > 0 and self.MovingDown.tokens == 0 and self.current_floor < self.max_floor

        def can_move_down():
            return self.RequestsQueue.tokens > 0 and self.MovingUp.tokens == 0 and self.current_floor > 0

        # Transitions
        self.transitions = [
            Transition("CallElevator", [], [(self.RequestsQueue,1)], condition=None),

            Transition("MoveUp", [(self.Idle,1), (self.RequestsQueue,1)], [(self.MovingUp,1)], condition=can_move_up),

            Transition("MoveDown", [(self.Idle,1), (self.RequestsQueue,1)], [(self.MovingDown,1)], condition=can_move_down),

            Transition("ArriveFloor", [(self.MovingUp,1)], [(self.DoorOpen,1)], condition=None),

            Transition("ArriveFloorDown", [(self.MovingDown,1)], [(self.DoorOpen,1)], condition=None),

            Transition("OpenDoor", [(self.DoorOpen,1)], [(self.DoorOpen,1)], condition=None),  # reset temporisation

            Transition("CloseDoor", [(self.DoorOpen,1)], [(self.Idle,1)], condition=self.door_can_close),
        ]

    def door_can_close(self):
        # On ferme la porte si timer > 2 itérations
        return self.door_timer >= 2

    def get_state(self):
        return {
            "Idle": self.Idle.tokens,
            "MovingUp": self.MovingUp.tokens,
            "MovingDown": self.MovingDown.tokens,
            "DoorOpen": self.DoorOpen.tokens,
            "RequestsQueue": self.RequestsQueue.tokens,
            "CurrentFloor": self.current_floor,
            "DoorTimer": self.door_timer
        }

    def fire(self, transition_name):
        # Gérer temporisation porte
        if self.DoorOpen.tokens > 0:
            self.door_timer += 1
        else:
            self.door_timer = 0

        # Trouver transition
        t = next((tr for tr in self.transitions if tr.name == transition_name), None)
        if not t:
            return "Transition inconnue"

        if not t.is_enabled():
            return f"Transition {transition_name} non activée"

        # Fire transition
        if t.fire():
            # Actions spécifiques pour mises à jour
            if transition_name == "CallElevator":
                self.history.append(f"Nouvelle demande ajoutée à la queue")
            elif transition_name == "MoveUp":
                self.Idle.remove_tokens(1)
                self.RequestsQueue.remove_tokens(1)
                self.MovingUp.add_tokens(1)
                self.history.append(f"Ascenseur démarre montée")
            elif transition_name == "MoveDown":
                self.Idle.remove_tokens(1)
                self.RequestsQueue.remove_tokens(1)
                self.MovingDown.add_tokens(1)
                self.history.append(f"Ascenseur démarre descente")
            elif transition_name == "ArriveFloor":
                self.MovingUp.remove_tokens(1)
                self.DoorOpen.add_tokens(1)
                self.current_floor += 1
                self.history.append(f"Ascenseur arrive à l'étage {self.current_floor} (monte)")
                self.door_timer = 0
            elif transition_name == "ArriveFloorDown":
                self.MovingDown.remove_tokens(1)
                self.DoorOpen.add_tokens(1)
                self.current_floor -= 1
                self.history.append(f"Ascenseur arrive à l'étage {self.current_floor} (descend)")
                self.door_timer = 0
            elif transition_name == "OpenDoor":
                self.history.append("Porte ouverte")
                self.door_timer = 0
            elif transition_name == "CloseDoor":
                self.DoorOpen.remove_tokens(1)
                self.Idle.add_tokens(1)
                self.history.append("Porte fermée, ascenseur au repos")
                self.door_timer = 0
            else:
                self.history.append(f"Transition {transition_name} tirée")

            return f"Transition {transition_name} exécutée"
        else:
            return f"Transition {transition_name} non activée"

