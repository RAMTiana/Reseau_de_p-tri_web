class Place:
    def __init__(self, name, tokens=0):
        self.name = name
        self.tokens = tokens

class Transition:
    def __init__(self, name):
        self.name = name
        self.inputs = []
        self.outputs = []

    def add_input(self, place):
        self.inputs.append(place)

    def add_output(self, place):
        self.outputs.append(place)

    def is_enabled(self):
        return all(place.tokens > 0 for place in self.inputs)

    def fire(self):
        if self.is_enabled():
            for place in self.inputs:
                place.tokens -= 1
            for place in self.outputs:
                place.tokens += 1
