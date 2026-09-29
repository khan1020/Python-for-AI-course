class Animal:
    def __init__(self, name):
        self.name = name

class Dog(Animal):
    def speak(self):
        return f"{self.name} says Woof!"

print(Dog("Buddy").speak())  # Output: Buddy says Woof!