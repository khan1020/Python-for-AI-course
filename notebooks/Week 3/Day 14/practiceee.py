# # if 5 > 2:
# #             print("Five is greater than two!")
 
# # print(1)


# # int
# # float
# # boolean
# # string
# # char

# """
# age5 =5
# ag_of_boy =6
# """
# print("fareed is {age5} years old")

# # x = [64, 54]
# # print(x)
# # x = bytearray(x)
# # # x = False
# # print(memoryview(bytes(x)))

# x = "5"
# print(type(x))

# x = int(x)
# print(type(x))

import numpy as np


# h = np.arange(12).reshape(3, 4)
# print(h)

# total = 0
# for p in ["10", "x", "5"]:
#     try:
#         total += int(p)
#     except ValueError:
#         total += 1
# print(total)

# marks = ["91", "100", "82"]   # read from a CSV file
# print(max(marks))


# s = np.array([40, 75, 90, 30])
# print((s >= 50).sum())

# class Animal:
#     def speak(self):
#         return "..."

# class Cat(Animal):
#     pass

# print(Cat().speak())


# import numpy as np

# a = np.array([80, 72])
# a[0] = 85.7
# print(a[0])


# prices = {"pen": 20}
# print(prices["book"])


# import pandas as pd

# df = pd.DataFrame({"item": ["pen", "book", "bag"],
#                    "price": [20, 150, 900]})
# print(df.shape)