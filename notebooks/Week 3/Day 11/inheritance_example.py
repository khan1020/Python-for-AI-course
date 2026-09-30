# 1. Build a shape family. "Shape" is the base with an "area()" that returns "0". "Rectangle(width, height)" and "Circle(radius)" each override "area()". Put a few in a list and print each area in one loop (polymorphism).



class Shape:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return 0

class Rectangle(Shape):
    def area(self):
        return self.width * self.height

class Circle(Shape):
    def area(self):
        return 3.14*(self.width/2)**2

print(Rectangle(5, 10).area())  
print(Circle(10, 0).area()) 

for shape in [Rectangle(15, 2), Circle(3, 0)]:
    print(shape.area())